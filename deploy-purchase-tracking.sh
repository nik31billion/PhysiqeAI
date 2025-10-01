#!/bin/bash

# Deploy purchase tracking migration
# This script adds database columns for RevenueCat purchase tracking

echo "🚀 Deploying purchase tracking migration..."

# Apply the migration
supabase db push --db-url "$SUPABASE_DB_URL"

# Alternative: Apply specific migration file
# supabase db reset --db-url "$SUPABASE_DB_URL"

echo "✅ Purchase tracking migration deployed successfully!"

# Test the new columns
echo "🔍 Testing new columns..."
echo "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name IN ('purchase_successful', 'product_identifier', 'revenue_cat_user_id');" | supabase db psql --db-url "$SUPABASE_DB_URL"

echo "🎉 Purchase tracking is ready for use!"
