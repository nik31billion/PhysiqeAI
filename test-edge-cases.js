// Test script for edge case handling in PhysiqueAI
// This script tests both the food analysis and coach glow edge functions

const SUPABASE_URL = process.env.SUPABASE_URL || 'your-supabase-url'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

// Test cases for food analysis
const foodAnalysisTests = [
  {
    name: 'Valid Food Image Test',
    description: 'Test with actual food image (simulated)',
    data: {
      userId: 'test-user-123',
      imageBase64: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=', // Minimal valid JPEG header
      scanMode: 'food'
    },
    expectedSuccess: true
  },
  {
    name: 'Non-Food Image Test (Hand)',
    description: 'Test with hand image (simulated)',
    data: {
      userId: 'test-user-123',
      imageBase64: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      scanMode: 'food'
    },
    expectedSuccess: true, // Should succeed but with isFood: false
    expectedResponse: {
      foodItems: [{
        name: 'No Food Detected',
        isFood: false
      }]
    }
  },
  {
    name: 'Empty Image Data Test',
    description: 'Test with empty image data',
    data: {
      userId: 'test-user-123',
      imageBase64: '',
      scanMode: 'food'
    },
    expectedSuccess: false
  },
  {
    name: 'Invalid Image Format Test',
    description: 'Test with invalid base64 data',
    data: {
      userId: 'test-user-123',
      imageBase64: 'invalid-base64-data',
      scanMode: 'food'
    },
    expectedSuccess: false
  },
  {
    name: 'Missing Parameters Test',
    description: 'Test with missing required parameters',
    data: {
      userId: 'test-user-123'
      // Missing imageBase64 and scanMode
    },
    expectedSuccess: false
  }
];

// Test cases for coach glow
const coachGlowTests = [
  {
    name: 'Valid Motivation Message Test',
    description: 'Test with valid motivation request',
    data: {
      userId: 'test-user-123',
      message: "I'm struggling with my diet and feeling unmotivated. Can you help?"
    },
    expectedSuccess: true,
    expectedIntent: 'motivation'
  },
  {
    name: 'Valid Plan Swap Request Test',
    description: 'Test with valid meal swap request',
    data: {
      userId: 'test-user-123',
      message: "Can you give me an alternative to today's breakfast?",
      context: {
        currentDay: 'Monday',
        mealType: 'breakfast'
      }
    },
    expectedSuccess: true,
    expectedIntent: 'plan_swap'
  },
  {
    name: 'Empty Message Test',
    description: 'Test with empty message',
    data: {
      userId: 'test-user-123',
      message: ''
    },
    expectedSuccess: false,
    expectedError: 'Empty message'
  },
  {
    name: 'Too Short Message Test',
    description: 'Test with extremely short message',
    data: {
      userId: 'test-user-123',
      message: 'a'
    },
    expectedSuccess: false,
    expectedError: 'Message too short'
  },
  {
    name: 'Too Long Message Test',
    description: 'Test with extremely long message',
    data: {
      userId: 'test-user-123',
      message: 'a'.repeat(2500) // Very long message
    },
    expectedSuccess: false,
    expectedError: 'Message too long'
  },
  {
    name: 'Inappropriate Content Test',
    description: 'Test with inappropriate content',
    data: {
      userId: 'test-user-123',
      message: 'I want to fucking kill myself this diet sucks'
    },
    expectedSuccess: false,
    expectedError: 'Inappropriate content detected'
  },
  {
    name: 'Spam-like Behavior Test',
    description: 'Test with repetitive characters',
    data: {
      userId: 'test-user-123',
      message: 'aaaaaaaaaaaaaaaaaaaaaa help me'
    },
    expectedSuccess: false,
    expectedError: 'Spam-like behavior detected'
  },
  {
    name: 'Rate Limiting Test',
    description: 'Test rate limiting with multiple rapid requests',
    data: {
      userId: 'test-user-rate-limit',
      message: 'Help me with my diet'
    },
    isRateTest: true,
    expectedSuccess: false, // Should fail after multiple requests
    expectedError: 'Please wait'
  },
  {
    name: 'Missing User ID Test',
    description: 'Test with missing user ID',
    data: {
      message: 'Help me with my diet'
      // Missing userId
    },
    expectedSuccess: false
  }
];

async function testFoodAnalysis(test) {
  console.log(`\n🧪 Testing: ${test.name}`);
  console.log(`📝 Description: ${test.description}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-food`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(test.data)
    });

    const result = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(result, null, 2));
    
    // Validate results
    if (test.expectedSuccess && !result.success) {
      console.log(`❌ FAIL: Expected success but got failure`);
      return false;
    } else if (!test.expectedSuccess && result.success) {
      console.log(`❌ FAIL: Expected failure but got success`);
      return false;
    } else if (test.expectedResponse) {
      // Check specific response content
      if (test.expectedResponse.foodItems) {
        const expectedItem = test.expectedResponse.foodItems[0];
        const actualItem = result.foodItems?.[0];
        
        if (expectedItem.name && actualItem?.name !== expectedItem.name) {
          console.log(`❌ FAIL: Expected name '${expectedItem.name}' but got '${actualItem?.name}'`);
          return false;
        }
        
        if (expectedItem.isFood !== undefined && actualItem?.isFood !== expectedItem.isFood) {
          console.log(`❌ FAIL: Expected isFood ${expectedItem.isFood} but got ${actualItem?.isFood}`);
          return false;
        }
      }
    }
    
    console.log(`✅ PASS: Test completed as expected`);
    return true;
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

async function testCoachGlow(test) {
  console.log(`\n🤖 Testing: ${test.name}`);
  console.log(`📝 Description: ${test.description}`);
  
  try {
    // For rate limiting test, send multiple requests
    if (test.isRateTest) {
      console.log('📡 Sending multiple rapid requests for rate limit test...');
      const promises = [];
      for (let i = 0; i < 15; i++) { // Send 15 requests (more than the 10 limit)
        promises.push(
          fetch(`${SUPABASE_URL}/functions/v1/coach-glow`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              ...test.data,
              message: `${test.data.message} - Request ${i + 1}`
            })
          })
        );
      }
      
      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));
      
      // Check if any were rate limited
      const rateLimited = responses.find((response, index) => {
        console.log(`Request ${index + 1}: Status ${response.status}`);
        return response.status === 429;
      });
      
      if (rateLimited) {
        console.log(`✅ PASS: Rate limiting worked - got 429 status`);
        return true;
      } else {
        console.log(`❌ FAIL: Expected rate limiting but all requests succeeded`);
        return false;
      }
    }
    
    // Regular test
    const response = await fetch(`${SUPABASE_URL}/functions/v1/coach-glow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(test.data)
    });

    const result = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(result, null, 2));
    
    // Validate results
    if (test.expectedSuccess && !result.success) {
      console.log(`❌ FAIL: Expected success but got failure`);
      return false;
    } else if (!test.expectedSuccess && result.success) {
      console.log(`❌ FAIL: Expected failure but got success`);
      return false;
    } else if (test.expectedIntent && result.intent !== test.expectedIntent) {
      console.log(`❌ FAIL: Expected intent '${test.expectedIntent}' but got '${result.intent}'`);
      return false;
    } else if (test.expectedError && !result.error?.includes(test.expectedError)) {
      console.log(`❌ FAIL: Expected error containing '${test.expectedError}' but got '${result.error}'`);
      return false;
    }
    
    console.log(`✅ PASS: Test completed as expected`);
    return true;
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log(`🚀 Starting PhysiqueAI Edge Case Tests\n`);
  console.log(`🔧 Configuration:`);
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   Using Anon Key: ${SUPABASE_ANON_KEY ? 'Yes' : 'No'}`);
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Test Food Analysis
  console.log(`\n🍎 === FOOD ANALYSIS TESTS ===`);
  for (const test of foodAnalysisTests) {
    totalTests++;
    const result = await testFoodAnalysis(test);
    if (result) passedTests++;
    
    // Add delay between tests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test Coach Glow
  console.log(`\n💪 === COACH GLOW TESTS ===`);
  for (const test of coachGlowTests) {
    totalTests++;
    const result = await testCoachGlow(test);
    if (result) passedTests++;
    
    // Add delay between tests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log(`\n📋 === TEST SUMMARY ===`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${totalTests - passedTests} ❌`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log(`\n🎉 ALL TESTS PASSED! Edge case handling is working correctly.`);
  } else {
    console.log(`\n⚠️  Some tests failed. Please review the output above.`);
  }
}

// Check if running directly
if (require.main === module) {
  // Check environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('❌ Missing environment variables!');
    console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY');
    console.error('Example: SUPABASE_URL=https://your-project.supabase.co SUPABASE_ANON_KEY=your-key node test-edge-cases.js');
    process.exit(1);
  }
  
  runAllTests()
    .then(() => {
      console.log('\n✨ Test run completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test run failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testFoodAnalysis,
  testCoachGlow,
  foodAnalysisTests,
  coachGlowTests
};
