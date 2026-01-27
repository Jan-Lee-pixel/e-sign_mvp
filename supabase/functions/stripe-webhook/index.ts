
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

console.log("Stripe Webhook Handler Initialized")

serve(async (req) => {
    try {
        const signature = req.headers.get('Stripe-Signature')

        if (!signature) {
            throw new Error('No Stripe signature found')
        }

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
            apiVersion: '2023-10-16',
        })

        const body = await req.text()
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')

        let event
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
        } catch (err) {
            console.error(`Webhook signature verification failed: ${err.message}`)
            return new Response(err.message, { status: 400 })
        }

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object
            const userId = paymentIntent.metadata.userId

            if (userId) {
                // Initialize Supabase Client
                const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
                const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
                const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

                // Update user profile
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        subscription_status: 'pro',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId)

                if (error) {
                    console.error('Error updating profile:', error)
                    return new Response('Error updating profile', { status: 500 })
                }
                console.log(`Successfully upgraded user ${userId} to pro`)
            } else {
                console.warn('No userId found in payment intent metadata')
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
