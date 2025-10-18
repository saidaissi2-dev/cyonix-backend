const { Subscription } = require('../models');
const stripeService = require('../services/stripeService');
const logger = require('../utils/logger');

class SubscriptionController {
  /**
   * GET /api/subscription/info
   * Get subscription information
   */
  async getInfo(req, res, next) {
    try {
      const subscription = await Subscription.findOne({
        where: { user_id: req.userId }
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Aucun abonnement trouvé'
        });
      }

      res.json({
        success: true,
        data: {
          subscription: {
            id: subscription.id,
            status: subscription.status,
            planType: subscription.plan_type,
            price: '5.00',
            currency: 'EUR',
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            nextBillingDate: subscription.cancel_at_period_end 
              ? null 
              : subscription.current_period_end
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/subscription/cancel
   * Cancel subscription at period end
   */
  async cancel(req, res, next) {
    try {
      const subscription = await Subscription.findOne({
        where: {
          user_id: req.userId,
          status: 'active'
        }
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Aucun abonnement actif trouvé'
        });
      }

      if (subscription.cancel_at_period_end) {
        return res.status(400).json({
          success: false,
          message: 'L\'abonnement est déjà programmé pour annulation'
        });
      }

      // Cancel subscription in Stripe
      await stripeService.cancelSubscription(subscription.stripe_subscription_id);

      // Update database
      await subscription.update({ cancel_at_period_end: true });

      logger.info(`Subscription cancelled for user: ${req.userId}`);

      const endDate = new Date(subscription.current_period_end).toLocaleDateString('fr-FR');

      res.json({
        success: true,
        message: `Votre abonnement sera annulé le ${endDate}`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/subscription/reactivate
   * Reactivate cancelled subscription
   */
  async reactivate(req, res, next) {
    try {
      const subscription = await Subscription.findOne({
        where: {
          user_id: req.userId,
          status: 'active'
        }
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Aucun abonnement actif trouvé'
        });
      }

      if (!subscription.cancel_at_period_end) {
        return res.status(400).json({
          success: false,
          message: 'L\'abonnement n\'est pas programmé pour annulation'
        });
      }

      // Reactivate subscription in Stripe
      await stripeService.reactivateSubscription(subscription.stripe_subscription_id);

      // Update database
      await subscription.update({ cancel_at_period_end: false });

      logger.info(`Subscription reactivated for user: ${req.userId}`);

      res.json({
        success: true,
        message: 'Abonnement réactivé avec succès'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/subscription/invoices
   * Get invoice history
   */
  async getInvoices(req, res, next) {
    try {
      const subscription = await Subscription.findOne({
        where: { user_id: req.userId }
      });

      if (!subscription || !subscription.stripe_customer_id) {
        return res.status(404).json({
          success: false,
          message: 'Aucun abonnement trouvé'
        });
      }

      // Get invoices from Stripe
      const invoices = await stripeService.listInvoices(subscription.stripe_customer_id);

      // Format invoices
      const formattedInvoices = invoices.map(invoice => ({
        id: invoice.id,
        date: new Date(invoice.created * 1000),
        amount: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        status: invoice.status,
        pdfUrl: invoice.invoice_pdf
      }));

      res.json({
        success: true,
        data: {
          invoices: formattedInvoices
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SubscriptionController();