/**
 * Test script to demonstrate the LLM Request Queue System
 * Run this to test concurrent requests
 */

// Mock the improved queue system for testing
class MockLLMRequestQueue {
  constructor() {
    this.queues = {
      plan_generation: [],
      coach_chat: [],
      food_analysis: []
    };
    
    this.processing = {
      plan_generation: false,
      coach_chat: false,
      food_analysis: false
    };
    
    this.stats = {
      totalRequests: 0,
      processedRequests: 0,
      failedRequests: 0,
      averageWaitTime: 0,
      queueLength: 0
    };
    
    this.processingDelays = {
      plan_generation: 2000, // 2 seconds for demo
      coach_chat: 1000,      // 1 second for demo
      food_analysis: 1500    // 1.5 seconds for demo
    };
  }

  async addRequest(userId, type, data, priority = 1) {
    return new Promise((resolve, reject) => {
      const request = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type,
        priority,
        data,
        resolve,
        reject,
        timestamp: Date.now(),
        retries: 0
      };

      // Add to appropriate queue
      this.queues[type].push(request);
      this.stats.totalRequests++;
      this.stats.queueLength = this.getTotalQueueLength();

      console.log(`[Queue] Added ${type} request for user ${userId}. ${type} queue length: ${this.queues[type].length}`);
      
      this.processQueue(type);
    });
  }

  getTotalQueueLength() {
    return this.queues.plan_generation.length + 
           this.queues.coach_chat.length + 
           this.queues.food_analysis.length;
  }

  async processQueue(type) {
    if (this.processing[type] || this.queues[type].length === 0) return;

    this.processing[type] = true;
    console.log(`[Queue] Starting to process ${type} queue. Length: ${this.queues[type].length}`);

    while (this.queues[type].length > 0) {
      const request = this.queues[type].shift();
      if (!request) break;

      this.stats.queueLength = this.getTotalQueueLength();
      const waitTime = Date.now() - request.timestamp;
      this.stats.averageWaitTime = (this.stats.averageWaitTime + waitTime) / 2;

      try {
        console.log(`[Queue] Processing ${request.type} request for user ${request.userId}`);
        
        // Simulate processing time based on type
        const processingTime = type === 'plan_generation' ? 3000 : 
                              type === 'coach_chat' ? 1000 : 2000;
        await new Promise(resolve => setTimeout(resolve, processingTime));
        
        // Simulate success
        const result = { success: true, message: `Processed ${request.type} for user ${request.userId}` };
        
        console.log(`[Queue] Successfully processed ${request.type} request for user ${request.userId}`);
        request.resolve(result);
        this.stats.processedRequests++;

      } catch (error) {
        console.error(`[Queue] Error processing ${request.type} request for user ${request.userId}:`, error);
        request.reject(error);
        this.stats.failedRequests++;
      }

      // Wait between requests based on type
      if (this.queues[type].length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.processingDelays[type]));
      }
    }

    this.processing[type] = false;
    console.log(`[Queue] Finished processing ${type} queue. Stats:`, this.getStats());
  }

  getStats() {
    return { ...this.stats };
  }

  getQueueLength() {
    return this.queue.length;
  }

  isProcessing() {
    return this.processing;
  }
}

// Test the improved queue system
async function testQueueSystem() {
  console.log('🚀 Testing IMPROVED LLM Request Queue System (Parallel Processing)\n');

  const queue = new MockLLMRequestQueue();

  // Test 1: Demonstrate the problem with old system
  console.log('❌ OLD SYSTEM PROBLEM:');
  console.log('If 30 users generate plans + 1 user wants to chat:');
  console.log('Chat user waits: 30 × 50 seconds = 25 minutes! 😱\n');

  // Test 2: Show the solution with parallel processing
  console.log('✅ NEW SYSTEM SOLUTION:');
  console.log('Plan Generation Queue: [Plan1, Plan2, Plan3, ...] → Process every 5 seconds');
  console.log('Coach Chat Queue:     [Chat1, Chat2, Chat3, ...] → Process every 2 seconds');
  console.log('Food Analysis Queue:  [Food1, Food2, Food3, ...] → Process every 3 seconds\n');

  // Test 3: Simulate real scenario
  console.log('🧪 Test 3: Real-world scenario simulation');
  console.log('Adding 5 plan generations + 3 chats + 2 food analyses simultaneously...\n');

  const promises = [];

  // Add 5 plan generations (these will take longer)
  for (let i = 1; i <= 5; i++) {
    promises.push(
      queue.addRequest(`planUser${i}`, 'plan_generation', { test: true })
        .then(result => {
          console.log(`✅ Plan ${i} completed:`, result.message);
          return result;
        })
        .catch(error => {
          console.log(`❌ Plan ${i} failed:`, error);
          return error;
        })
    );
  }

  // Add 3 chats (these should complete faster)
  for (let i = 1; i <= 3; i++) {
    promises.push(
      queue.addRequest(`chatUser${i}`, 'coach_chat', { message: `Hello from chat user ${i}` })
        .then(result => {
          console.log(`✅ Chat ${i} completed:`, result.message);
          return result;
        })
        .catch(error => {
          console.log(`❌ Chat ${i} failed:`, error);
          return error;
        })
    );
  }

  // Add 2 food analyses
  for (let i = 1; i <= 2; i++) {
    promises.push(
      queue.addRequest(`foodUser${i}`, 'food_analysis', { image: `test${i}.jpg` })
        .then(result => {
          console.log(`✅ Food ${i} completed:`, result.message);
          return result;
        })
        .catch(error => {
          console.log(`❌ Food ${i} failed:`, error);
          return error;
        })
    );
  }

  console.log('⏱️  Watch how chats complete faster than plans!\n');

  // Wait for all requests to complete
  await Promise.all(promises);

  console.log('\n' + '='.repeat(60) + '\n');
  console.log('📊 Final Queue Statistics:');
  console.log(queue.getStats());
  console.log('\n🎉 Notice: Chat users didn\'t have to wait for all plan generations!');
}

// Run the test
testQueueSystem().catch(console.error);
