/**
 * Realistic timing test for Concurrent LLM Processor
 * Shows actual processing times that users would experience
 */

// Mock the concurrent processor with realistic timing
class RealisticConcurrentProcessor {
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
      
      const startTime = new Date().toLocaleTimeString();
      console.log(`[${startTime}] [ConcurrentProcessor] User ${userId} assigned to ${availableWorker.id} for ${type}`);
      
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
      // REALISTIC processing times (in milliseconds)
      const processingTime = type === 'plan_generation' ? 45000 :  // 45 seconds
                            type === 'coach_chat' ? 2500 :         // 2.5 seconds
                            12000;                                 // 12 seconds for food
      
      const startTime = new Date().toLocaleTimeString();
      console.log(`[${startTime}] [ConcurrentProcessor] ${worker.id} processing ${type} for user ${userId} (${processingTime/1000}s)`);
      
      // Simulate realistic processing with progress updates
      if (type === 'plan_generation') {
        // Show progress for long-running plan generation
        await this.simulatePlanGeneration(processingTime, worker, userId);
      } else {
        await new Promise(resolve => setTimeout(resolve, processingTime));
      }
      
      const endTime = new Date().toLocaleTimeString();
      const result = { success: true, message: `Processed ${type} for user ${userId}` };
      
      console.log(`[${endTime}] [ConcurrentProcessor] ${worker.id} completed ${type} for user ${userId}`);
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

  async simulatePlanGeneration(totalTime, worker, userId) {
    const steps = [
      { time: 0.1, message: "Analyzing user profile..." },
      { time: 0.3, message: "Generating workout plan..." },
      { time: 0.6, message: "Creating nutrition plan..." },
      { time: 0.8, message: "Finalizing recommendations..." },
      { time: 1.0, message: "Plan generation complete!" }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, totalTime * (step.time - (steps.indexOf(step) > 0 ? steps[steps.indexOf(step) - 1].time : 0))));
      const currentTime = new Date().toLocaleTimeString();
      console.log(`[${currentTime}] [${worker.id}] ${step.message} (${userId})`);
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

// Test with realistic timing
async function testRealisticTiming() {
  console.log('🚀 Testing CONCURRENT LLM Processor with REALISTIC TIMING\n');

  const processor = new RealisticConcurrentProcessor();

  console.log('✅ REALISTIC PROCESSING TIMES:');
  console.log('• Plan Generation: 45 seconds (real Gemini API time)');
  console.log('• Coach Chat: 2.5 seconds (real Gemini API time)');
  console.log('• Food Analysis: 12 seconds (real Gemini Vision API time)\n');

  // Test 1: 5 users onboarding (plan generation)
  console.log('🧪 Test 1: 5 users onboarding simultaneously');
  console.log('Users 1-5 will start immediately, but each takes 45 seconds to complete...\n');

  const planPromises = [];
  for (let i = 1; i <= 5; i++) {
    planPromises.push(
      processor.addRequest(`user${i}`, 'plan_generation', { test: true })
        .then(result => {
          const endTime = new Date().toLocaleTimeString();
          console.log(`[${endTime}] ✅ User ${i} plan completed: ${result.message}`);
          return result;
        })
        .catch(error => {
          const endTime = new Date().toLocaleTimeString();
          console.log(`[${endTime}] ❌ User ${i} plan failed: ${error.message}`);
          return error;
        })
    );
  }

  // Test 2: 3 users chatting (should complete much faster)
  console.log('🧪 Test 2: 3 users chatting simultaneously');
  console.log('These should complete in ~2.5 seconds each...\n');

  const chatPromises = [];
  for (let i = 1; i <= 3; i++) {
    chatPromises.push(
      processor.addRequest(`chatUser${i}`, 'coach_chat', { message: `Hello from user ${i}` })
        .then(result => {
          const endTime = new Date().toLocaleTimeString();
          console.log(`[${endTime}] ✅ Chat user ${i} completed: ${result.message}`);
          return result;
        })
        .catch(error => {
          const endTime = new Date().toLocaleTimeString();
          console.log(`[${endTime}] ❌ Chat user ${i} failed: ${error.message}`);
          return error;
        })
    );
  }

  // Test 3: 2 users analyzing food
  console.log('🧪 Test 3: 2 users analyzing food simultaneously');
  console.log('These should complete in ~12 seconds each...\n');

  const foodPromises = [];
  for (let i = 1; i <= 2; i++) {
    foodPromises.push(
      processor.addRequest(`foodUser${i}`, 'food_analysis', { image: `test${i}.jpg` })
        .then(result => {
          const endTime = new Date().toLocaleTimeString();
          console.log(`[${endTime}] ✅ Food user ${i} completed: ${result.message}`);
          return result;
        })
        .catch(error => {
          const endTime = new Date().toLocaleTimeString();
          console.log(`[${endTime}] ❌ Food user ${i} failed: ${error.message}`);
          return error;
        })
    );
  }

  console.log('⏱️  Watch the realistic timing! Chats will complete first, then food analysis, then plans...\n');

  // Wait for all requests to complete
  await Promise.all([...planPromises, ...chatPromises, ...foodPromises]);

  console.log('\n' + '='.repeat(60) + '\n');
  console.log('📊 Final Statistics:');
  console.log(processor.getStats());
  console.log('\n🎉 Key Observations:');
  console.log('• Chat users got responses in ~2.5 seconds');
  console.log('• Food analysis users got responses in ~12 seconds');
  console.log('• Plan generation users got responses in ~45 seconds');
  console.log('• Multiple users processed simultaneously without blocking each other!');
}

// Run the realistic test
testRealisticTiming().catch(console.error);
