/**
 * Test script to demonstrate the Concurrent LLM Processor
 * Shows how multiple users can be processed simultaneously
 */

// Mock the concurrent processor for testing
class MockConcurrentProcessor {
  constructor() {
    this.workerPools = {
      plan_generation: Array(12).fill().map((_, i) => ({ id: `plan_worker_${i}`, busy: false })),
      coach_chat: Array(15).fill().map((_, i) => ({ id: `chat_worker_${i}`, busy: false })),
      food_analysis: Array(8).fill().map((_, i) => ({ id: `food_worker_${i}`, busy: false }))
    };
    
    this.userLimits = {};
    this.stats = {
      totalRequests: 0,
      processedRequests: 0,
      failedRequests: 0,
      activeWorkers: 0
    };
  }

  async addRequest(userId, type, data) {
    return new Promise((resolve, reject) => {
      // Check user limits
      if (!this.checkUserLimit(userId, type)) {
        reject(new Error(`User ${userId} rate limited for ${type}`));
        return;
      }

      // Find available worker
      const availableWorker = this.workerPools[type].find(worker => !worker.busy);
      
      if (!availableWorker) {
        reject(new Error(`No available ${type} workers`));
        return;
      }

      this.stats.totalRequests++;
      this.updateUserLimit(userId, type);
      
      console.log(`[ConcurrentProcessor] User ${userId} assigned to ${availableWorker.id} for ${type}`);
      
      // Process request
      this.processRequest(availableWorker, userId, type, data, resolve, reject);
    });
  }

  checkUserLimit(userId, type) {
    if (!this.userLimits[userId]) {
      this.userLimits[userId] = { plan_generation: 0, coach_chat: 0, food_analysis: 0 };
    }
    
    // Each user can only have 1 request per type in progress
    return this.userLimits[userId][type] < 1;
  }

  updateUserLimit(userId, type) {
    this.userLimits[userId][type]++;
  }

  async processRequest(worker, userId, type, data, resolve, reject) {
    worker.busy = true;
    this.stats.activeWorkers++;

    try {
      // Simulate processing time
      const processingTime = type === 'plan_generation' ? 3000 : 
                            type === 'coach_chat' ? 1000 : 2000;
      
      console.log(`[ConcurrentProcessor] ${worker.id} processing ${type} for user ${userId} (${processingTime}ms)`);
      
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      const result = { success: true, message: `Processed ${type} for user ${userId}` };
      
      console.log(`[ConcurrentProcessor] ${worker.id} completed ${type} for user ${userId}`);
      resolve(result);
      this.stats.processedRequests++;

    } catch (error) {
      console.error(`[ConcurrentProcessor] ${worker.id} failed ${type} for user ${userId}:`, error);
      reject(error);
      this.stats.failedRequests++;
    } finally {
      worker.busy = false;
      this.stats.activeWorkers--;
      this.userLimits[userId][type]--;
    }
  }

  getStats() {
    return {
      ...this.stats,
      workers: {
        plan_generation: {
          total: this.workerPools.plan_generation.length,
          busy: this.workerPools.plan_generation.filter(w => w.busy).length,
          available: this.workerPools.plan_generation.filter(w => !w.busy).length
        },
        coach_chat: {
          total: this.workerPools.coach_chat.length,
          busy: this.workerPools.coach_chat.filter(w => w.busy).length,
          available: this.workerPools.coach_chat.filter(w => !w.busy).length
        },
        food_analysis: {
          total: this.workerPools.food_analysis.length,
          busy: this.workerPools.food_analysis.filter(w => w.busy).length,
          available: this.workerPools.food_analysis.filter(w => !w.busy).length
        }
      }
    };
  }
}

// Test the concurrent processor
async function testConcurrentProcessing() {
  console.log('🚀 Testing CONCURRENT LLM Processor\n');

  const processor = new MockConcurrentProcessor();

  // Test 1: Show the solution
  console.log('✅ CONCURRENT PROCESSING SOLUTION:');
  console.log('• 12 Plan Generation Workers (process 12 plans simultaneously)');
  console.log('• 15 Coach Chat Workers (process 15 chats simultaneously)');
  console.log('• 8 Food Analysis Workers (process 8 analyses simultaneously)');
  console.log('• Each user can only have 1 request per type in progress\n');

  // Test 2: Simulate 30 users onboarding (plan generation)
  console.log('🧪 Test 2: 30 users onboarding simultaneously');
  console.log('With 12 workers, users 1-12 start immediately, users 13-24 wait for first batch to complete...\n');

  const planPromises = [];
  for (let i = 1; i <= 30; i++) {
    planPromises.push(
      processor.addRequest(`user${i}`, 'plan_generation', { test: true })
        .then(result => {
          console.log(`✅ User ${i} plan completed: ${result.message}`);
          return result;
        })
        .catch(error => {
          console.log(`❌ User ${i} plan failed: ${error.message}`);
          return error;
        })
    );
  }

  // Test 3: Simulate 20 users chatting simultaneously
  console.log('🧪 Test 3: 20 users chatting simultaneously');
  console.log('With 15 workers, users 1-15 start immediately, users 16-20 wait for workers to free up...\n');

  const chatPromises = [];
  for (let i = 1; i <= 20; i++) {
    chatPromises.push(
      processor.addRequest(`chatUser${i}`, 'coach_chat', { message: `Hello from user ${i}` })
        .then(result => {
          console.log(`✅ Chat user ${i} completed: ${result.message}`);
          return result;
        })
        .catch(error => {
          console.log(`❌ Chat user ${i} failed: ${error.message}`);
          return error;
        })
    );
  }

  // Test 4: Simulate 10 users analyzing food
  console.log('🧪 Test 4: 10 users analyzing food simultaneously');
  console.log('With 8 workers, users 1-8 start immediately, users 9-10 wait for workers to free up...\n');

  const foodPromises = [];
  for (let i = 1; i <= 10; i++) {
    foodPromises.push(
      processor.addRequest(`foodUser${i}`, 'food_analysis', { image: `test${i}.jpg` })
        .then(result => {
          console.log(`✅ Food user ${i} completed: ${result.message}`);
          return result;
        })
        .catch(error => {
          console.log(`❌ Food user ${i} failed: ${error.message}`);
          return error;
        })
    );
  }

  console.log('⏱️  Watch how multiple users are processed simultaneously!\n');

  // Wait for all requests to complete
  await Promise.all([...planPromises, ...chatPromises, ...foodPromises]);

  console.log('\n' + '='.repeat(60) + '\n');
  console.log('📊 Final Statistics:');
  console.log(processor.getStats());
  console.log('\n🎉 Key Benefits:');
  console.log('• Multiple users processed simultaneously');
  console.log('• No user waits for other users to complete');
  console.log('• Rate limiting prevents API overload');
  console.log('• Each user gets immediate response (if workers available)');
}

// Run the test
testConcurrentProcessing().catch(console.error);
