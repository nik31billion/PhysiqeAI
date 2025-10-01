#!/bin/bash

# Deploy meal swap edge function
# This script deploys the swap-meal edge function to Supabase

echo "🚀 Deploying meal swap edge function..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first."
    echo "   Visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory. Please run this from the project root."
    exit 1
fi

# Deploy the edge function
echo "📦 Deploying swap-meal function..."
supabase functions deploy swap-meal

if [ $? -eq 0 ]; then
    echo "✅ Meal swap function deployed successfully!"
    echo ""
    echo "🔧 Next steps:"
    echo "1. Run the database migration: supabase db push"
    echo "2. Test the function in your app"
    echo ""
    echo "📝 Function details:"
    echo "   - Function name: swap-meal"
    echo "   - Endpoint: /functions/v1/swap-meal"
    echo "   - Method: POST"
    echo "   - Requires: userId, currentMeal, dayName, mealType"
else
    echo "❌ Failed to deploy meal swap function"
    exit 1
fi
