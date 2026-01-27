
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);



async function fixProfile() {
    const userId = 'd9fd13b4-561d-4087-8ef3-319d00d64538';
    const email = 'pantinople.janlie078@gmail.com';

    console.log(`Creating profile for ${email} (${userId})...`);

    const { error } = await supabase.from('profiles').upsert({
        id: userId,
        email: email,
        subscription_status: 'pro', // Set to pro directly since we know they paid
        updated_at: new Date().toISOString()
    });

    if (error) console.error('Error creating profile:', error);
    else console.log('Success! Profile created and set to PRO.');
}

fixProfile();
