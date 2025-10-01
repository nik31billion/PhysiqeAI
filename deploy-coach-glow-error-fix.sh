#!/bin/bash

# Deploy Coach Glow Error Handling and Content Moderation Fix
# This script deploys the updated coach-glow edge function with:
# 1. Fixed content moderation (no longer flags "diet" as inappropriate)
# 2. User-friendly error messages instead of technical errors

echo "🚀 Deploying Coach Glow Error Handling Fix..."

# Deploy the coach-glow edge function
echo "📤 Deploying coach-glow edge function..."
npx supabase functions deploy coach-glow

if [ $? -eq 0 ]; then
  echo "✅ Coach Glow edge function deployed successfully!"
  echo ""
  echo "🎯 Changes deployed:"
  echo "  ✓ Removed all content moderation to prevent false positives"
  echo "  ✓ Users can freely discuss any fitness/nutrition topics"
  echo "  ✓ No more word-based filtering (diet, killer workout, etc. all work)"
  echo "  ✓ User-friendly error messages shown to users"
  echo "  ✓ Technical errors hidden from user interface"
  echo ""
  echo "💡 Test the fix:"
  echo "  1. Open Coach Glow chat"
  echo "  2. Send: 'Change my diet plan for today'"
  echo "  3. Should now work without inappropriate content error"
else
  echo "❌ Deployment failed. Please check the error messages above."
  exit 1
fi

