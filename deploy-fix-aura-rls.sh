#!/bin/bash

# Deploy Aura RLS Fix Migration
# This script applies the RLS policy fix for the aura system

echo "🔧 Deploying Aura RLS Fix Migration..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first."
    echo "   Visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory. Please run this from your project root."
    exit 1
fi

# Apply the migration
echo "📝 Applying Aura RLS fix migration..."
supabase db push --include-all

if [ $? -eq 0 ]; then
    echo "✅ Aura RLS fix migration applied successfully!"
    echo ""
    echo "🔍 What was fixed:"
    echo "   - Added service role policies for user_aura_summary table"
    echo "   - Added service role policies for aura_events table"
    echo "   - Ensured functions are properly set as SECURITY DEFINER"
    echo ""
    echo "🎯 This should resolve the 'new row violates row-level security policy' error"
    echo "   when creating user aura summaries during user registration."
else
    echo "❌ Failed to apply migration. Please check the error messages above."
    exit 1
fi
