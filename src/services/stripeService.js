const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createOrGetCustomer(user) {
  try {
    const { User, Subscription } = require('../models');
    
    const subscription = await Subscription.findOne({
      where: { user_id: user.id }
    });

    if (subscription && subscription.stripe_customer_id) {
      return subscription.stripe_customer_id;
    }

    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstname} ${user.lastname}`,
      metadata: {
        userId: user.id.toString()
      }
    });

    return customer.id;
  } catch (error) {
    console.error('Error creating/getting Stripe customer:', error);
    throw new Error('Erreur lors de la création du client Stripe');
  }
}

async function verifyWebhook(rawBody, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }

  try {
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    throw new Error(`Webhook signature verification failed: ${error.message}`);
  }
}

async function getSubscription(subscriptionId) {
  return retrieveSubscription(subscriptionId);
}

async function createCheckoutSession({ userId, email, firstname, lastname, customerId }) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      success_url: `${process.env.FRONTEND_URL}?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}?payment=cancelled`,
      metadata: {
        userId,
        email,
        firstname,
        lastname
      },
      subscription_data: {
        metadata: {
          userId,
          email,
          firstname,
          lastname
        }
      }
    });

    return session;

  } catch (error) {
    console.error('Stripe checkout session error:', error);
    throw new Error('Erreur lors de la création de la session de paiement');
  }
}

async function retrieveSession(sessionId) {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    console.error('Stripe retrieve session error:', error);
    throw error;
  }
}

async function retrieveSubscription(subscriptionId) {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Stripe retrieve subscription error:', error);
    throw error;
  }
}

async function cancelSubscription(subscriptionId) {
  try {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
  } catch (error) {
    console.error('Stripe cancel subscription error:', error);
    throw error;
  }
}

async function reactivateSubscription(subscriptionId) {
  try {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    });
  } catch (error) {
    console.error('Stripe reactivate subscription error:', error);
    throw error;
  }
}

async function listInvoices(customerId) {
  try {
    return await stripe.invoices.list({
      customer: customerId,
      limit: 20
    });
  } catch (error) {
    console.error('Stripe list invoices error:', error);
    throw error;
  }
}

module.exports = {
  createOrGetCustomer,
  verifyWebhook,
  getSubscription,
  createCheckoutSession,
  retrieveSession,
  retrieveSubscription,
  cancelSubscription,
  reactivateSubscription,
  listInvoices
};
