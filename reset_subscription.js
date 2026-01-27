
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function resetSubscription() {
    const userId = 'd9fd13b4-561d-4087-8ef3-319d00d64538'; // pantinople.janlie078@gmail.com
    console.log(`Resetting subscription for ${userId}...`);

    const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'free' })
        .eq('id', userId);

    if (error) {
        console.error('Error resetting subscription:', error);
    } else {
        console.log('Success! Subscription reset to FREE.');
    }
}

resetSubscription();
