#!/bin/bash

# Deploy the delete-user-data Supabase Edge Function
# This function handles complete account deletion including all user data

echo "🚀 Deploying delete-user-data function..."

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

# Deploy the function
echo "📦 Deploying function..."
supabase functions deploy delete-user-data --project-ref $SUPABASE_PROJECT_REF

if [ $? -eq 0 ]; then
    echo "✅ delete-user-data function deployed successfully!"
    echo ""
    echo "🔧 Function details:"
    echo "   - Name: delete-user-data"
    echo "   - Purpose: Permanently delete user account and all associated data"
    echo "   - Tables affected: progress_photos, day_completions, individual_completions, achievements, aura_events, coach_glow_chats, user_plans, user_profiles"
    echo ""
    echo "⚠️  Important: This function requires admin privileges to delete auth users"
    echo "   Make sure your Supabase project has the necessary RLS policies configured"
else
    echo "❌ Failed to deploy delete-user-data function"
    exit 1
fi
