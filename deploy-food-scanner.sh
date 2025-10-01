#!/bin/bash

# Deployment script for Food Scanner feature
# This script deploys the analyze-food edge function and applies database migrations

echo "🚀 Deploying Food Scanner Feature..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/functions/analyze-food/index.ts" ]; then
    echo "❌ analyze-food function not found. Make sure you're in the PhysiqeAI directory."
    exit 1
fi

echo "📦 Deploying analyze-food edge function..."

# Deploy the edge function
supabase functions deploy analyze-food --project-ref YOUR_PROJECT_REF

if [ $? -eq 0 ]; then
    echo "✅ analyze-food function deployed successfully!"
else
    echo "❌ Failed to deploy analyze-food function"
    exit 1
fi

echo "🗄️  Applying database migrations..."

# Apply the food analysis logs migration
supabase db push --project-ref YOUR_PROJECT_REF

if [ $? -eq 0 ]; then
    echo "✅ Database migrations applied successfully!"
else
    echo "❌ Failed to apply database migrations"
    exit 1
fi

echo ""
echo "🎉 Food Scanner Feature Deployment Complete!"
echo ""
echo "Next steps:"
echo "1. Make sure your GEMINI_API_KEY is set in Supabase Edge Function secrets"
echo "2. Test the feature in your app"
echo "3. Monitor the food_analysis_logs table for usage analytics"
echo ""
echo "To set the Gemini API key:"
echo "supabase secrets set GEMINI_API_KEY=your_actual_api_key --project-ref YOUR_PROJECT_REF"
echo ""
echo "To view logs:"
echo "supabase functions logs analyze-food --project-ref YOUR_PROJECT_REF"
