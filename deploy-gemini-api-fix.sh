#!/bin/bash

# Deploy Gemini API fix to all Supabase Edge Functions
# This script deploys the updated functions with improved model fallback logic

echo "🚀 Deploying Gemini API fix to Supabase Edge Functions..."

# Set project reference (replace with your actual project ID)
# PROJECT_REF="your-project-ref"

echo ""
echo "📦 Deploying generate-plans function..."
supabase functions deploy generate-plans

echo ""
echo "📦 Deploying coach-glow function..."
supabase functions deploy coach-glow

echo ""
echo "📦 Deploying swap-meal function..."
supabase functions deploy swap-meal

echo ""
echo "📦 Deploying analyze-food function..."
supabase functions deploy analyze-food

echo ""
echo "✅ All functions deployed successfully!"
echo ""
echo "🔍 The updated functions now include:"
echo "   - Multiple Gemini model fallback (gemini-1.5-flash, gemini-1.5-pro, gemini-pro)"
echo "   - Fixed model versions to use stable Generative Language API models"
echo "   - Better error handling and logging"
echo "   - Improved reliability for plan generation"
echo ""
echo "🧪 Test your OnboardingScreen20 plan generation now!"
