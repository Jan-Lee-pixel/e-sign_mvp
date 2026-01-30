
const express = require('express');
const cors = require('cors');
const stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const logFile = path.join(__dirname, 'server.log');

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    try {
        fs.appendFileSync(logFile, logMessage);
    } catch (e) {
        console.error("Failed to write to log file:", e);
    }
}

function logError(message, error) {
    const timestamp = new Date().toISOString();
    const errorDetails = error ? (error.stack || JSON.stringify(error, null, 2)) : '';
    const logMessage = `[${timestamp}] ERROR: ${message}\n${errorDetails}\n`;
    console.error(message, error);
    try {
        fs.appendFileSync(logFile, logMessage);
    } catch (e) {
        console.error("Failed to write to log file:", e);
    }
}

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
        logError(`Webhook Error: ${err.message}`, err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata.userId;

        log(`Payment succeeded for user: ${userId}`);

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
                    logError('Error logging payment event:', eventError);
                } else {
                    log('Payment event logged successfully.');
                }

                // Log into payments table (Customer History)
                const { error: paymentError } = await supabase
                    .from('payments')
                    .insert({
                        stripe_payment_id: paymentIntent.id,
                        amount: paymentIntent.amount,
                        currency: paymentIntent.currency,
                        status: paymentIntent.status,
                        user_id: userId
                    });

                if (paymentError) {
                    logError('Error logging payment history:', paymentError);
                } else {
                    log('Payment history saved.');
                }


                const { error } = await supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        subscription_status: 'pro',
                        email: paymentIntent.receipt_email, // Update email from payment intent
                        updated_at: new Date().toISOString()
                    });

                if (error) {
                    logError('Error updating Supabase:', error);
                    return res.status(500).json({ error: 'Database update failed' });
                }
                log(`User ${userId} upgraded to pro.`);
            } catch (dbError) {
                logError('Supabase Client Error:', dbError);
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
        logError('Error verifying payment:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/create-payment-intent', async (req, res) => {
    try {
        const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
        const { userId, email } = req.body;

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
            receipt_email: email, // Store email in Stripe
            metadata: { userId },
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        logError('Error creating payment intent:', error);
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
            logError('Error cancelling subscription:', error);
            return res.status(500).json({ error: 'Database update failed' });
        }

        log(`User ${userId} cancelled subscription (downgraded to free).`);
        res.json({ success: true, message: 'Subscription cancelled' });

    } catch (error) {
        logError('Error in cancel-subscription:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    log(`Server running on http://localhost:${port}`);
});
