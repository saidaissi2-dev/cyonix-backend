const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User, Subscription, Certificate } = require('../models');
const pkiService = require('../services/pkiService');
const emailService = require('../services/emailService');

async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleCheckoutSessionCompleted(session) {
  console.log('Processing checkout.session.completed:', session.id);

  const userId = session.metadata.userId;
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  if (!userId) {
    throw new Error('Missing userId in session metadata');
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

  const subscription = await Subscription.create({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    status: 'active',
    plan_type: 'basic',
    current_period_start: new Date(stripeSubscription.current_period_start * 1000),
    current_period_end: new Date(stripeSubscription.current_period_end * 1000),
    cancel_at_period_end: false
  });

  console.log('Subscription created:', subscription.id);

  try {
    const commonName = `${user.firstname}.${user.lastname}`.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9.]/g, '');

    const p12Password = require('crypto').randomBytes(16).toString('hex');

    console.log(`Generating certificate for: ${commonName}`);

    const certificatePath = await pkiService.generateCertificate({
      commonName,
      p12Password
    });

    const certificate = await Certificate.create({
      user_id: userId,
      subscription_id: subscription.id,
      common_name: commonName,
      p12_password: p12Password,
      certificate_path: certificatePath,
      issued_at: new Date(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      revoked: false
    });

    console.log('Certificate created:', certificate.id);

    await emailService.sendWelcomeEmail({
      email: user.email,
      firstname: user.firstname,
      commonName,
      p12Password,
      certificateDownloadUrl: `${process.env.FRONTEND_URL}/dashboard?tab=certificate`
    });

    console.log('Welcome email sent to:', user.email);

  } catch (error) {
    console.error('Error generating certificate or sending email:', error);
  }
}

async function handleSubscriptionUpdated(stripeSubscription) {
  console.log('Processing subscription.updated:', stripeSubscription.id);

  const subscription = await Subscription.findOne({
    where: { stripe_subscription_id: stripeSubscription.id }
  });

  if (subscription) {
    await subscription.update({
      status: stripeSubscription.status,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end
    });
    console.log('Subscription updated:', subscription.id);
  }
}

async function handleSubscriptionDeleted(stripeSubscription) {
  console.log('Processing subscription.deleted:', stripeSubscription.id);

  const subscription = await Subscription.findOne({
    where: { stripe_subscription_id: stripeSubscription.id }
  });

  if (subscription) {
    await subscription.update({ status: 'cancelled' });

    const certificate = await Certificate.findOne({
      where: { subscription_id: subscription.id, revoked: false }
    });

    if (certificate) {
      await pkiService.revokeCertificate(certificate.common_name);
      await certificate.update({ 
        revoked: true, 
        revoked_at: new Date() 
      });
      console.log('Certificate revoked:', certificate.common_name);
    }
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  console.log('Processing payment succeeded:', invoice.id);
  
  const subscription = await Subscription.findOne({
    where: { stripe_subscription_id: invoice.subscription }
  });

  if (subscription && subscription.status !== 'active') {
    await subscription.update({ status: 'active' });
  }
}

async function handleInvoicePaymentFailed(invoice) {
  console.log('Processing payment failed:', invoice.id);

  const subscription = await Subscription.findOne({
    where: { stripe_subscription_id: invoice.subscription }
  });

  if (subscription) {
    const user = await User.findByPk(subscription.user_id);
    
    await emailService.sendPaymentFailedEmail({
      email: user.email,
      firstname: user.firstname,
      invoiceUrl: invoice.hosted_invoice_url
    });
  }
}

module.exports = { handleStripeWebhook };
