
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
    const { data, error } = await supabase
        .from('fields')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Data:', data);
        if (data.length === 0) {
            console.log('No data found, but query succeeded. Table exists.');
            // Insert a dummy to check columns if needed, but select * should have worked if columns exist. 
            // Actually, empty result doesn't show columns. 
            // We'll trust that if I select 'type' and it errors, then it doesn't exist.
            const { error: typeError } = await supabase.from('fields').select('type').limit(1);
            if (typeError) console.log("Field 'type' likely missing:", typeError.message);
            else console.log("Field 'type' exists.");
        } else {
            console.log("Keys:", Object.keys(data[0]));
        }
    }
}

checkSchema();
