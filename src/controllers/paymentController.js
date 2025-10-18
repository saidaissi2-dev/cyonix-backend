const { User, Subscription } = require('../models');
const stripeService = require('../services/stripeService');
const pkiService = require('../services/pkiService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const { calculateSubscriptionEnd } = require('../utils/helpers');

class PaymentController {
  /**
   * POST /api/payment/create-checkout-session
   * Create Stripe checkout session
   */
  async createCheckoutSession(req, res, next) {
    try {
      const user = await User.findByPk(req.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Check if user already has active subscription
      const existingSub = await Subscription.findOne({
        where: {
          user_id: user.id,
          status: 'active'
        }
      });

      if (existingSub) {
        return res.status(400).json({
          success: false,
          message: 'Vous avez déjà un abonnement actif'
        });
      }

      // Create or get Stripe customer
      const customerId = await stripeService.createOrGetCustomer(user);

      // Create checkout session
      const checkoutSession = await stripeService.createCheckoutSession({
        userId: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        customerId
      });

      res.json({
        url: checkoutSession.url
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/webhooks/stripe
   * Handle Stripe webhooks
   */
  async handleWebhook(req, res, next) {
    const sig = req.headers['stripe-signature'];

    try {
      // Verify webhook signature
      const event = await stripeService.verifyWebhook(req.body, sig);

      logger.info(`Stripe webhook received: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      logger.error('Webhook error:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Handle checkout.session.completed event
   * CRITICAL FLOW: Create subscription + Generate PKI certificate
   */
  async handleCheckoutCompleted(session) {
    try {
      const userId = session.metadata.userId;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      logger.info(`Processing checkout completion for user: ${userId}`);

      // Get user
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Get Stripe subscription details
      const stripeSubscription = await stripeService.getSubscription(subscriptionId);

      // Create subscription in database
      const subscription = await Subscription.create({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        status: 'active',
        plan_type: 'basic',
        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000)
      });

      logger.info(`Subscription created: ${subscription.id}`);

      // CRITICAL: Generate PKI certificate
      try {
        const { certificate, p12Password, commonName } = await pkiService.generateCertificate({
          userId: user.id,
          subscriptionId: subscription.id,
          firstname: user.firstname,
          lastname: user.lastname
        });

        logger.info(`Certificate generated: ${certificate.id}`);

        // Send welcome email with certificate info
        await emailService.sendWelcomeEmail({
          email: user.email,
          firstname: user.firstname,
          commonName,
          p12Password
        });

        logger.info(`Welcome email sent to: ${user.email}`);
      } catch (certError) {
        logger.error('Error generating certificate:', certError);
        // Don't fail the webhook - subscription is created
        // Admin should be notified to manually generate certificate
      }
    } catch (error) {
      logger.error('Error handling checkout completion:', error);
      throw error;
    }
  }

  /**
   * Handle customer.subscription.updated event
   */
  async handleSubscriptionUpdated(stripeSubscription) {
    try {
      const subscription = await Subscription.findOne({
        where: { stripe_subscription_id: stripeSubscription.id }
      });

      if (!subscription) {
        logger.warn(`Subscription not found: ${stripeSubscription.id}`);
        return;
      }

      await subscription.update({
        status: stripeSubscription.status,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000),
        cancel_at_period_end: stripeSubscription.cancel_at_period_end
      });

      logger.info(`Subscription updated: ${subscription.id}`);
    } catch (error) {
      logger.error('Error handling subscription update:', error);
      throw error;
    }
  }

  /**
   * Handle customer.subscription.deleted event
   */
  async handleSubscriptionDeleted(stripeSubscription) {
    try {
      const subscription = await Subscription.findOne({
        where: { stripe_subscription_id: stripeSubscription.id },
        include: [{ model: require('../models').Certificate, as: 'certificate' }]
      });

      if (!subscription) {
        logger.warn(`Subscription not found: ${stripeSubscription.id}`);
        return;
      }

      // Update subscription status
      await subscription.update({ status: 'cancelled' });

      // Revoke certificate if exists
      if (subscription.certificate && !subscription.certificate.revoked) {
        try {
          await pkiService.revokeCertificate(subscription.certificate.common_name);
          await subscription.certificate.update({
            revoked: true,
            revoked_at: new Date()
          });
          logger.info(`Certificate revoked: ${subscription.certificate.id}`);
        } catch (certError) {
          logger.error('Error revoking certificate:', certError);
        }
      }

      logger.info(`Subscription deleted: ${subscription.id}`);
    } catch (error) {
      logger.error('Error handling subscription deletion:', error);
      throw error;
    }
  }

  /**
   * Handle invoice.payment_succeeded event
   */
  async handlePaymentSucceeded(invoice) {
    try {
      const subscription = await Subscription.findOne({
        where: { stripe_subscription_id: invoice.subscription }
      });

      if (subscription && subscription.status !== 'active') {
        await subscription.update({ status: 'active' });
        logger.info(`Subscription reactivated: ${subscription.id}`);
      }
    } catch (error) {
      logger.error('Error handling payment success:', error);
      throw error;
    }
  }

  /**
   * Handle invoice.payment_failed event
   */
  async handlePaymentFailed(invoice) {
    try {
      const subscription = await Subscription.findOne({
        where: { stripe_subscription_id: invoice.subscription },
        include: [{ model: User, as: 'user' }]
      });

      if (subscription) {
        logger.warn(`Payment failed for subscription: ${subscription.id}`);
        // TODO: Send email notification to user
        // After 3 failed attempts, suspend account
      }
    } catch (error) {
      logger.error('Error handling payment failure:', error);
      throw error;
    }
  }
}

module.exports = new PaymentController();