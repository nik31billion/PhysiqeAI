#!/bin/bash

# Deploy food analysis fix
echo "🔧 Deploying food analysis fix..."
echo "This fixes the JSON parsing issue in the food scanner"

# Deploy the analyze-food function
supabase functions deploy analyze-food

if [ $? -eq 0 ]; then
    echo "✅ Food analysis function deployed successfully!"
    echo ""
    echo "🎉 The fix includes:"
    echo "   • Improved JSON parsing with multiple fallback strategies"
    echo "   • Better handling of descriptive responses from Gemini"
    echo "   • Enhanced food recognition for Middle Eastern/Mediterranean dishes"
    echo "   • More robust error handling"
    echo ""
    echo "🧪 Test the fix by:"
    echo "   1. Opening the app"
    echo "   2. Using the food scanner to take a photo"
    echo "   3. Verifying that calories are now properly displayed"
else
    echo "❌ Deployment failed. Please check your Supabase CLI setup."
    echo "Make sure you're logged in: supabase login"
    echo "And that your project is linked: supabase link"
fi
