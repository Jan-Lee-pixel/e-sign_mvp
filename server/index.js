
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

                // IDEMPOTENCY CHECK (DB-Level): distinct 'stripe_event_id'
                // We attempt to insert first. If it violates uniqueness, we know it's a duplicate.
                const { error: insertError } = await supabase
                    .from('payment_events')
                    .insert({
                        stripe_event_id: event.id,
                        type: event.type,
                        status: paymentIntent.status,
                        payload: event,
                        user_id: userId
                    });

                if (insertError) {
                    if (insertError.code === '23505') {
                        // unique violation -> already processed
                        log(`Event ${event.id} already processed (DB-level, 23505). Skipping.`);
                        return res.status(200).send();
                    }
                    // Some other error? Throw it.
                    throw insertError;
                }

                log('Payment event captured (Idempotency Lock secured).');

                // Log into payments table (Customer History)
                const { data: existingPayment } = await supabase
                    .from('payments')
                    .select('id')
                    .eq('stripe_payment_id', paymentIntent.id)
                    .single();

                if (!existingPayment) {
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
                } else {
                    log(`Payment ${paymentIntent.id} already recorded. Skipping insert.`);
                }

                const { error } = await supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        subscription_status: 'pro',
                        email: paymentIntent.receipt_email,
                        updated_at: new Date().toISOString()
                    });

                if (error) {
                    logError('Error updating Supabase:', error);
                    // If profile update fails, we should still try to release the lock
                    await supabase.from('payment_locks')
                        .update({ status: 'failed' }) // Mark as failed because profile update didn't complete
                        .eq('user_id', userId)
                        .eq('payment_intent_id', paymentIntent.id);
                    return res.status(500).json({ error: 'Database update failed' });
                }
                log(`User ${userId} upgraded to pro.`);

                // RELEASE LOCK (Success)
                await supabase.from('payment_locks')
                    .update({ status: 'succeeded' })
                    .eq('user_id', userId)
                    .eq('payment_intent_id', paymentIntent.id);


            } catch (dbError) {
                logError('Supabase Client Error:', dbError);
                // In case of any DB error during processing, attempt to mark the lock as failed
                // This assumes userId is available from paymentIntent.metadata
                if (userId && paymentIntent && paymentIntent.id) {
                    try {
                        const supabase = createClient(
                            process.env.VITE_SUPABASE_URL,
                            process.env.SUPABASE_SERVICE_ROLE_KEY
                        );
                        await supabase.from('payment_locks')
                            .update({ status: 'failed' })
                            .eq('user_id', userId)
                            .eq('payment_intent_id', paymentIntent.id);
                        log(`Payment lock for user ${userId} marked as failed due to DB error.`);
                    } catch (lockUpdateError) {
                        logError('Failed to update payment lock status to failed after DB error:', lockUpdateError);
                    }
                }
                return res.status(500).json({ error: 'Database connection failed' });
            }
        }
    }

    res.send();
});

// JSON parser for other routes
app.use(express.json());



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

        const supabase = createClient(
            process.env.VITE_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // 0. CHECK PROFILE: Ensure user isn't already PRO
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_status')
            .eq('id', userId)
            .single();

        if (profile && profile.subscription_status === 'pro') {
            return res.status(400).json({ error: 'User is already subscribed' });
        }

        // 1. ACQUIRE LOCK (Atomically)
        // We attempt to insert a 'pending' lock first. 
        // If a lock exists (PK violation on user_id), this will fail, preventing race conditions.

        // 1. ACQUIRE LOCK (Atomically)
        log(`[Lock] Attempting to acquire lock for user ${userId}...`);
        let lockAcquired = false;

        const { error: insertError } = await supabase
            .from('payment_locks')
            .insert({
                user_id: userId,
                status: 'pending',
                created_at: new Date().toISOString()
            });

        if (insertError) {
            log(`[Lock] Insert failed: ${insertError.code} - ${insertError.message}`);
            // Check if it's a PK violation (code 23505)
            if (insertError.code === '23505') {
                // Check if existing lock is stale
                const { data: staleLock } = await supabase
                    .from('payment_locks')
                    .select('created_at')
                    .eq('user_id', userId)
                    .single();

                if (staleLock) {
                    const lockTime = new Date(staleLock.created_at).getTime();
                    const now = new Date().getTime();
                    const lockDuration = 60 * 1000; // 1 minute

                    if (now - lockTime > lockDuration) {
                        log(`[Lock] Expiring stale lock for user ${userId} (older than 1 minute)`);
                        await supabase.from('payment_locks').delete().eq('user_id', userId);

                        // AUTO-RETRY: Attempt to acquire lock again immediately
                        log(`[Lock] Retrying lock acquisition for user ${userId}...`);
                        const { error: retryError } = await supabase
                            .from('payment_locks')
                            .insert({
                                user_id: userId,
                                status: 'pending',
                                created_at: new Date().toISOString()
                            });

                        if (retryError) {
                            log(`[Lock] Retry failed: ${retryError.message}`);
                            return res.status(409).json({ error: 'Payment already in progress (retry failed).' });
                        }

                        // Retry success!
                        log(`[Lock] Acquired on retry for user ${userId}`);
                        lockAcquired = true;
                        // Proceed to Stripe creation below...
                    } else {
                        // Not stale yet
                        log(`[Lock] Blocked concurrent request for user ${userId}`);
                        return res.status(409).json({
                            error: 'Payment already in progress. Please complete existing session.'
                        });
                    }
                } else {
                    // No stale lock found (maybe deleted by race condition), but insert failed previously.
                    // Treating as conflict.
                    return res.status(409).json({
                        error: 'Payment already in progress.'
                    });
                }
            } else {
                throw insertError;
            }
        } else {
            // First attempt success
            lockAcquired = true;
            log(`[Lock] Acquired for user ${userId}`);
        }

        try {
            // 2. CREATE INTENT
            const idempotencyKey = `pi_lock_${userId}_${Date.now()}`;
            log(`[Stripe] Creating intent with key ${idempotencyKey}...`);

            const paymentIntent = await stripeClient.paymentIntents.create({
                amount,
                currency,
                automatic_payment_methods: { enabled: true },
                receipt_email: email,
                metadata: { userId },
            }, {
                idempotencyKey
            });
            log(`[Stripe] Intent created: ${paymentIntent.id}`);

            // 3. UPDATE LOCK with Intent ID
            log(`[Lock] Updating lock with intent ID...`);
            const { error: updateError } = await supabase
                .from('payment_locks')
                .update({ payment_intent_id: paymentIntent.id })
                .eq('user_id', userId);

            if (updateError) {
                log(`[Lock] Update failed: ${updateError.message}`);
                throw updateError;
            }

            res.send({
                clientSecret: paymentIntent.client_secret,
            });

        } catch (error) {
            logError(`[Lock] Critical error in flow:`, error);
            // Rollback lock if Stripe fails
            if (lockAcquired) {
                log(`[Lock] Rolling back lock for user ${userId}`);
                await supabase.from('payment_locks').delete().eq('user_id', userId);
            }
            throw error;
        }
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
