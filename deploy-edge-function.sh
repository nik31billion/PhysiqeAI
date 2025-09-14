#!/bin/bash

# Deploy Edge Function Script for Personalized Plan Generation
# This script helps deploy the generate-plans edge function to Supabase

echo "🚀 Deploying Personalized Plan Generation System"
echo "================================================"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if user is logged in to Supabase
echo "🔍 Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please login first:"
    echo "   supabase login"
    exit 1
fi

echo "📦 Deploying generate-plans edge function..."

# Deploy the edge function
supabase functions deploy generate-plans

if [ $? -eq 0 ]; then
    echo "✅ Edge function deployed successfully!"
    echo ""
    echo "🔧 Next Steps:"
    echo "1. Set up environment variables in Supabase Dashboard:"
    echo "   - GEMINI_API_KEY: Your Google Gemini API key"
    echo "   - SUPABASE_URL: Your Supabase project URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY: Your service role key"
    echo ""
    echo "2. Run the database setup SQL in Supabase SQL Editor"
    echo "   (See PLAN_GENERATION_README.md for the SQL commands)"
    echo ""
    echo "3. Test the integration in your app!"
    echo ""
    echo "📖 For detailed setup instructions, see PLAN_GENERATION_README.md"
else
    echo "❌ Failed to deploy edge function. Please check the error messages above."
    exit 1
fi
