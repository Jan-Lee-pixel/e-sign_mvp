
const express = require('express');
const cors = require('cors');
const stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
const port = 4242;

// Middleware
app.use(cors());

// Stripe Webhook needs raw body, so we handle it before parsing JSON for other routes
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripeClient.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata.userId;

        console.log(`Payment succeeded for user: ${userId}`);

        if (userId) {
            try {
                const supabase = createClient(
                    process.env.VITE_SUPABASE_URL,
                    process.env.SUPABASE_SERVICE_ROLE_KEY
                );

                // Log payment event
                const { error: eventError } = await supabase
                    .from('payment_events')
                    .insert({
                        stripe_event_id: event.id,
                        type: event.type,
                        status: paymentIntent.status,
                        payload: event,
                        user_id: userId
                    });

                if (eventError) {
                    console.error('Error logging payment event:', eventError);
                } else {
                    console.log('Payment event logged successfully.');
                }


                const { error } = await supabase
                    .from('profiles')
                    .update({
                        subscription_status: 'pro',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId);

                if (error) {
                    console.error('Error updating Supabase:', error);
                    return res.status(500).json({ error: 'Database update failed' });
                }
                console.log(`User ${userId} upgraded to pro.`);
            } catch (dbError) {
                console.error('Supabase Client Error:', dbError);
                return res.status(500).json({ error: 'Database connection failed' });
            }
        }
    }

    res.send();
});

// JSON parser for other routes
app.use(express.json());

app.post('/verify-payment', async (req, res) => {
    try {
        const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
        const { paymentIntentId } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({ error: 'Missing paymentIntentId' });
        }

        const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            const userId = paymentIntent.metadata.userId;

            if (userId) {
                const supabase = createClient(
                    process.env.VITE_SUPABASE_URL,
                    process.env.SUPABASE_SERVICE_ROLE_KEY
                );

                const { error } = await supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        email: paymentIntent.receipt_email || undefined, // Optional
                        subscription_status: 'pro',
                        updated_at: new Date().toISOString()
                    });

                if (error) throw error;

                return res.json({ success: true, message: 'User upgraded to pro' });
            }
        }

        res.json({ success: false, status: paymentIntent.status });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/create-payment-intent', async (req, res) => {
    try {
        const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
        const { userId } = req.body;

        // SECURITY: Hardcode amount to $20.00 (2000 cents)
        // Do NOT trust the client to send the amount.
        const amount = 2000;
        const currency = 'usd';

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }

        const paymentIntent = await stripeClient.paymentIntents.create({
            amount,
            currency,
            automatic_payment_methods: { enabled: true },
            metadata: { userId },
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/cancel-subscription', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }

        const supabase = createClient(
            process.env.VITE_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { error } = await supabase
            .from('profiles')
            .update({
                subscription_status: 'free',
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) {
            console.error('Error cancelling subscription:', error);
            return res.status(500).json({ error: 'Database update failed' });
        }

        console.log(`User ${userId} cancelled subscription (downgraded to free).`);
        res.json({ success: true, message: 'Subscription cancelled' });

    } catch (error) {
        console.error('Error in cancel-subscription:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
