#!/bin/bash

# Quick deployment script to fix the Gemini API model issue
echo "🔧 Deploying Food Scanner Fix - Updated Gemini Model..."

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

echo "📦 Re-deploying analyze-food edge function with Gemini 1.5 Flash..."

# Deploy the updated edge function
supabase functions deploy analyze-food --project-ref YOUR_PROJECT_REF

if [ $? -eq 0 ]; then
    echo "✅ analyze-food function updated successfully!"
    echo ""
    echo "🎉 Fix Applied!"
    echo ""
    echo "Changes made:"
    echo "- Updated from gemini-pro-vision to gemini-1.5-flash model"
    echo "- Added better error logging and debugging"
    echo ""
    echo "The food scanner should now work properly!"
    echo ""
    echo "To test:"
    echo "1. Take a photo of food in your app"
    echo "2. Check the function logs if needed:"
    echo "   supabase functions logs analyze-food --project-ref YOUR_PROJECT_REF"
else
    echo "❌ Failed to deploy analyze-food function"
    exit 1
fi
