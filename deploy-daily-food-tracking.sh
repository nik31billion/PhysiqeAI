#!/bin/bash

# Deployment script for Daily Food Intake Tracking feature
# This script applies the database migration for food scanner calorie integration

echo "🚀 Deploying Daily Food Intake Tracking..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "database/migration_add_daily_food_intake.sql" ]; then
    echo "❌ Daily food intake migration not found. Make sure you're in the PhysiqeAI directory."
    exit 1
fi

echo "🗄️  Applying daily food intake database migration..."

# Apply the database migration
supabase db push --project-ref YOUR_PROJECT_REF

if [ $? -eq 0 ]; then
    echo "✅ Database migration applied successfully!"
    echo ""
    echo "🎉 Daily Food Intake Tracking Deployed!"
    echo ""
    echo "New features enabled:"
    echo "- ✅ Food scanner calories are now tracked separately"
    echo "- ✅ Daily calorie intake includes both planned meals + scanned food"
    echo "- ✅ Individual food items stored with full nutrition data"
    echo "- ✅ Analytics tracking for food scanner usage"
    echo ""
    echo "Database changes:"
    echo "- Added 'daily_food_intake' table"
    echo "- Added 'get_daily_calorie_intake' function"
    echo "- Proper RLS policies for data security"
    echo ""
    echo "The food scanner now fully integrates with your daily calorie tracking!"
    echo "Users can scan food and it will be automatically added to their daily intake."
else
    echo "❌ Failed to apply database migration"
    exit 1
fi
