// Supabase Configuration
// Uses environment variables from .env file

export const SUPABASE_CONFIG = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY',
};

// Environment variables are loaded from .env file
// Make sure your .env file contains:
// EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
// EXPO_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
//
// For Supabase Edge Functions, you also need to add these to your Supabase project:
// SUPABASE_URL=https://your-project.supabase.co
// SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
// GEMINI_API_KEY=your-gemini-api-key
