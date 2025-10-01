/**
 * Test script to verify Gemini API connectivity and available models
 * Run this to diagnose the API issue
 */

// You'll need to set your GEMINI_API_KEY environment variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'your-api-key-here';

async function testGeminiAPI() {
  console.log('🔍 Testing Gemini API connectivity...\n');

  // Test 1: Try the current model your code uses
  console.log('1️⃣ Testing gemini-1.5-flash (current model):');
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Hello, just testing the API connection. Please respond with "API working".'
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 50,
          }
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS - gemini-1.5-flash is working');
      console.log('Response:', data.candidates[0].content.parts[0].text);
    } else {
      const errorData = await response.json();
      console.log('❌ FAILED - gemini-1.5-flash error:', response.status);
      console.log('Error details:', JSON.stringify(errorData, null, 2));
    }
  } catch (error) {
    console.log('❌ FAILED - Network error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: List available models
  console.log('2️⃣ Fetching available models:');
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Available models:');
      data.models.forEach(model => {
        console.log(`   - ${model.name} (${model.displayName})`);
      });
    } else {
      const errorData = await response.json();
      console.log('❌ FAILED to fetch models:', response.status);
      console.log('Error details:', JSON.stringify(errorData, null, 2));
    }
  } catch (error) {
    console.log('❌ FAILED - Network error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Try alternative model names
  const alternativeModels = [
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-pro-vision'
  ];

  for (const modelName of alternativeModels) {
    console.log(`3️⃣ Testing ${modelName}:`);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: 'Test'
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 10,
            }
          })
        }
      );

      if (response.ok) {
        console.log(`✅ SUCCESS - ${modelName} is working`);
      } else {
        const errorData = await response.json();
        console.log(`❌ FAILED - ${modelName} error:`, response.status);
      }
    } catch (error) {
      console.log(`❌ FAILED - ${modelName} network error:`, error.message);
    }
  }

  console.log('\n🏁 Test completed!');
  console.log('\n📋 Next steps:');
  console.log('1. If gemini-1.5-flash works, the issue might be with your Supabase environment');
  console.log('2. If it fails, try using one of the working alternative models');
  console.log('3. Check your GEMINI_API_KEY is correct and has proper permissions');
}

// Run the test
testGeminiAPI().catch(console.error);
