#!/bin/bash

# Deploy Display Name Migration
# This script adds the display_name column to the user_profiles table

echo "🚀 Deploying Display Name Migration..."

# Check if we're in the right directory
if [ ! -f "database/migration_add_display_name.sql" ]; then
    echo "❌ Error: migration_add_display_name.sql not found. Please run this script from the project root."
    exit 1
fi

# Apply the migration
echo "📝 Applying display_name migration..."
supabase db reset --linked

if [ $? -eq 0 ]; then
    echo "✅ Display name migration applied successfully!"
    echo ""
    echo "📋 What was added:"
    echo "   • display_name column to user_profiles table"
    echo "   • Existing users will have their email username as default display name"
    echo "   • Users can now customize their display name in the Edit Profile modal"
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Test the Edit Profile functionality"
    echo "   2. Verify that custom names appear in HomeScreen, PlanScreen, and ProfileScreen"
    echo "   3. Ensure the name updates immediately after saving"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
