
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('email, full_name, profile_photo_url, live_photo_url, aadhaar_front_url, aadhaar_back_url, pan_card_url, signature_url, profile_completed')
    .limit(10);

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log('--- PROFILES DATA ---');
  data.forEach(p => {
    console.log(`Email: ${p.email}`);
    console.log(`Full Name: ${p.full_name}`);
    console.log(`Completed: ${p.profile_completed}`);
    console.log(`Photo: ${p.profile_photo_url ? 'YES' : 'NO'}`);
    console.log(`Live Photo: ${p.live_photo_url ? 'YES' : 'NO'}`);
    console.log(`Aadhaar Front: ${p.aadhaar_front_url ? 'YES' : 'NO'}`);
    console.log(`Aadhaar Back: ${p.aadhaar_back_url ? 'YES' : 'NO'}`);
    console.log(`PAN: ${p.pan_card_url ? 'YES' : 'NO'}`);
    console.log(`Signature: ${p.signature_url ? 'YES' : 'NO'}`);
    console.log('---------------------');
  });
}

checkProfiles();
