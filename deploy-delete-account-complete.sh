#!/bin/bash

# Complete deployment script for delete account functionality
# This script deploys both the database migration and the Edge Function

echo "🚀 Deploying complete delete account functionality..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if user is logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Please login to Supabase first:"
    echo "supabase login"
    exit 1
fi

# Deploy the database migration first
echo "📦 Deploying database migration..."
supabase db push --include-all

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy database migration"
    exit 1
fi

echo "✅ Database migration deployed successfully!"

# Deploy the Edge Function
echo "📦 Deploying Edge Function..."
supabase functions deploy delete-user-data

if [ $? -eq 0 ]; then
    echo "✅ delete-user-data function deployed successfully!"
    echo ""
    echo "🔧 Complete delete account functionality is now ready!"
    echo ""
    echo "📋 What was deployed:"
    echo "   - Database function: delete_user_data() with elevated privileges"
    echo "   - Edge Function: delete-user-data for API access"
    echo "   - Tables cleaned: progress_photos, day_completions, meal_completions,"
    echo "     exercise_completions, user_achievements, aura_events, coach_glow_chats,"
    echo "     user_weight_tracking, user_plans, user_profiles"
    echo ""
    echo "⚠️  Important: The database function runs with SECURITY DEFINER privileges"
    echo "   and will properly delete the auth user via CASCADE constraints"
else
    echo "❌ Failed to deploy delete-user-data function"
    exit 1
fi
