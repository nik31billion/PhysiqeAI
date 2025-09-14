#!/bin/bash

# Deploy Apply Plan Swap Edge Function Script
# This script helps deploy the apply-plan-swap edge function to Supabase

echo "🚀 Deploying Apply Plan Swap System"
echo "==================================="

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

echo "📦 Deploying apply-plan-swap edge function..."

# Deploy the edge function
supabase functions deploy apply-plan-swap

if [ $? -eq 0 ]; then
    echo "✅ Edge function deployed successfully!"
    echo ""
    echo "🔧 Next Steps:"
    echo "1. Make sure environment variables are set in Supabase Dashboard:"
    echo "   - SUPABASE_URL: Your Supabase project URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY: Your service role key"
    echo ""
    echo "2. Test the plan swap functionality in your app!"
    echo ""
    echo "📖 The function should now be available at:"
    echo "   https://your-project.supabase.co/functions/v1/apply-plan-swap"
else
    echo "❌ Failed to deploy edge function. Please check the error messages above."
    exit 1
fi
