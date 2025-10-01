/**
 * Quick test to see what models are actually available in the Generative Language API
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBpvF-9b9szL0ItbbrvVBUOq_coYGUFGrY';

async function testAvailableModels() {
  console.log('🔍 Testing available models in Generative Language API...\n');

  // First, let's try to list available models
  try {
    console.log('📋 Fetching available models...');
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
        console.log(`   - ${model.name.replace('models/', '')} (${model.displayName})`);
      });
      
      // Filter for generateContent capable models
      const generateContentModels = data.models.filter(model => 
        model.supportedGenerationMethods && 
        model.supportedGenerationMethods.includes('generateContent')
      );
      
      console.log('\n🎯 Models that support generateContent:');
      generateContentModels.forEach(model => {
        const modelName = model.name.replace('models/', '');
        console.log(`   - ${modelName} (${model.displayName})`);
      });
      
       // Test the most promising models for our use case
       console.log('\n🧪 Testing promising models...');
       const modelsToTest = [
         'gemini-2.5-flash',
         'gemini-2.5-pro', 
         'gemini-2.0-flash',
         'gemini-2.0-flash-001',
         'gemini-flash-latest',
         'gemini-pro-latest',
         'gemini-1.5-flash-8b',
         'gemini-1.5-flash-8b-latest'
       ];
       
       for (const modelName of modelsToTest) {
         if (generateContentModels.find(m => m.name === `models/${modelName}`)) {
           await testModel(modelName);
         }
       }
      
    } else {
      const errorData = await response.json();
      console.log('❌ Failed to fetch models:', response.status);
      console.log('Error:', JSON.stringify(errorData, null, 2));
    }
  } catch (error) {
    console.log('❌ Error fetching models:', error.message);
  }
}

async function testModel(modelName) {
  try {
    console.log(`\n🔧 Testing ${modelName}...`);
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
              text: 'Just say "Hello" to test this model.'
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
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
      console.log(`   ✅ ${modelName} works! Response: "${text.trim()}"`);
      return true;
    } else {
      const errorData = await response.json();
      console.log(`   ❌ ${modelName} failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ${modelName} error: ${error.message}`);
    return false;
  }
}

// Run the test
testAvailableModels().catch(console.error);
