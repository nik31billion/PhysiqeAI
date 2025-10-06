#!/bin/bash

# Deploy Rate Limiting System
# This script deploys the rate limiting functionality for plan regeneration

echo "🚀 Deploying Rate Limiting System..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Deploy the check-rate-limit edge function
echo "📦 Deploying check-rate-limit edge function..."
supabase functions deploy check-rate-limit

if [ $? -eq 0 ]; then
    echo "✅ check-rate-limit function deployed successfully"
else
    echo "❌ Failed to deploy check-rate-limit function"
    exit 1
fi

# Deploy the updated generate-plans function
echo "📦 Deploying updated generate-plans function..."
supabase functions deploy generate-plans

if [ $? -eq 0 ]; then
    echo "✅ generate-plans function updated successfully"
else
    echo "❌ Failed to deploy generate-plans function"
    exit 1
fi

echo ""
echo "🎉 Rate Limiting System Deployment Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Run the database migration: add_regeneration_limits.sql"
echo "2. Test the rate limiting functionality"
echo "3. Monitor the logs for any issues"
echo ""
echo "🔧 Database Migration:"
echo "   Go to your Supabase dashboard → SQL Editor"
echo "   Copy and run the contents of: database/add_regeneration_limits.sql"
echo ""
echo "✅ Rate limiting is now active:"
echo "   - Users can regenerate each plan type once per 24 hours"
echo "   - Separate limits for workout, diet, and complete plan regeneration"
echo "   - Graceful degradation if rate limiting fails"
