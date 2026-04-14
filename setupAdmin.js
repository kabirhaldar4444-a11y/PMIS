import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  const email = 'admin@elitetoolistic.com';
  const password = 'Password123!';

  console.log('Creating admin user...');
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error('Error signing up:', authError.message);
    if (authError.message.includes('User already registered')) {
        console.log('User already exists. Trying to log in to update profile...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email, password
        });
        if (loginError) {
             console.error('Login error:', loginError.message);
             return;
        }
        await updateProfile(loginData.session);
    }
    return;
  }
  
  if (authData.session) {
      await updateProfile(authData.session);
  } else {
      console.log('Please turn off email confirmation in Supabase Auth settings to make this work smoothly, or confirm the email.');
  }
}

async function updateProfile(session) {
  console.log('Updating profile to admin...');
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ 
      id: session.user.id, 
      role: 'admin', 
      full_name: 'System Admin',
      email: session.user.email
    });

  if (profileError) {
    console.error('Error updating profile:', profileError.message);
  } else {
    console.log('Admin user ready! Email: admin@elitetoolistic.com, Password: Password123!');
  }
}

setup();
