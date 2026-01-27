
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0'

console.log("Stripe Payment Function Initialized")

serve(async (req) => {
    const { method } = req

    // Handle CORS
    if (method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            },
        })
    }

    try {
        const supabaseClientAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        const authHeader = req.headers.get('Authorization')

        if (!authHeader) {
            throw new Error('Missing Authorization header')
        }

        // Create a Stripe instance
        // Make sure to set STRIPE_SECRET_KEY in your Supabase secrets
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
            apiVersion: '2023-10-16', // Use a pinned version
        })

        const body = await req.json()
        const { amount, currency = 'usd' } = body

        if (!amount) {
            throw new Error('Missing amount')
        }

        // Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            automatic_payment_methods: { enabled: true },
            metadata: { userId: body.userId }, // Pass user ID to metadata
        })

        return new Response(
            JSON.stringify({ clientSecret: paymentIntent.client_secret }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
                },
                status: 200,
            }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
                },
                status: 400,
            }
        )
    }
})
