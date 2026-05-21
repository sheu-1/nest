import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://inigwkkzgxxufiofyiqh.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluaWd3a2t6Z3h4dWZpb2Z5aXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NzkzMjMsImV4cCI6MjA5NDQ1NTMyM30.SfTf-GpxpcUIZOaXgNNM-FDE2818boeV4LQT16dShu8';


if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing! Check your .env file.');
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
