/**
 * Concurrent LLM Processor with Rate Limiting
 * Processes multiple requests simultaneously while respecting API limits
 */

interface ProcessingRequest {
  id: string;
  userId: string;
  type: 'plan_generation' | 'coach_chat' | 'food_analysis';
  data: any;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
  retries: number;
}

interface WorkerPool {
  plan_generation: Worker[];
  coach_chat: Worker[];
  food_analysis: Worker[];
}

interface Worker {
  id: string;
  busy: boolean;
  currentRequest: ProcessingRequest | null;
  lastRequestTime: number;
}

interface RateLimits {
  plan_generation: {
    maxConcurrent: number;
    requestsPerMinute: number;
    processingTime: number; // ms
  };
  coach_chat: {
    maxConcurrent: number;
    requestsPerMinute: number;
    processingTime: number; // ms
  };
  food_analysis: {
    maxConcurrent: number;
    requestsPerMinute: number;
    processingTime: number; // ms
  };
}

interface UserRateLimits {
  [userId: string]: {
    plan_generation: {
      inProgress: number;
      lastRequest: number;
      requestsThisMinute: number;
    };
    coach_chat: {
      inProgress: number;
      lastRequest: number;
      requestsThisMinute: number;
    };
    food_analysis: {
      inProgress: number;
      lastRequest: number;
      requestsThisMinute: number;
    };
  };
}

class ConcurrentLLMProcessor {
  private requestQueues: {
    plan_generation: ProcessingRequest[];
    coach_chat: ProcessingRequest[];
    food_analysis: ProcessingRequest[];
  } = {
    plan_generation: [],
    coach_chat: [],
    food_analysis: []
  };

  private workerPools: WorkerPool = {
    plan_generation: [],
    coach_chat: [],
    food_analysis: []
  };

  private userRateLimits: UserRateLimits = {};

  private globalRateLimits = {
    requestsThisMinute: 0,
    lastMinuteReset: Date.now()
  };

  private rateLimits: RateLimits = {
    plan_generation: {
      maxConcurrent: 12,       // 12 plan generations at once (increased from 3)
      requestsPerMinute: 60,   // 60 plan generations per minute (increased from 20)
      processingTime: 50000    // 50 seconds per plan
    },
    coach_chat: {
      maxConcurrent: 15,       // 15 chats at once
      requestsPerMinute: 60,   // 60 chats per minute
      processingTime: 3000     // 3 seconds per chat
    },
    food_analysis: {
      maxConcurrent: 8,        // 8 food analyses at once
      requestsPerMinute: 40,   // 40 analyses per minute
      processingTime: 15000    // 15 seconds per analysis
    }
  };

  private stats = {
    totalRequests: 0,
    processedRequests: 0,
    failedRequests: 0,
    activeWorkers: 0,
    queueLengths: {
      plan_generation: 0,
      coach_chat: 0,
      food_analysis: 0
    }
  };

  constructor() {
    this.initializeWorkerPools();
    this.startProcessingLoops();
    this.startRateLimitReset();
  }

  /**
   * Initialize worker pools for each operation type
   */
  private initializeWorkerPools(): void {
    // Plan Generation Workers (12 workers for high onboarding volume)
    for (let i = 0; i < this.rateLimits.plan_generation.maxConcurrent; i++) {
      this.workerPools.plan_generation.push({
        id: `plan_worker_${i}`,
        busy: false,
        currentRequest: null,
        lastRequestTime: 0
      });
    }

    // Coach Chat Workers
    for (let i = 0; i < this.rateLimits.coach_chat.maxConcurrent; i++) {
      this.workerPools.coach_chat.push({
        id: `chat_worker_${i}`,
        busy: false,
        currentRequest: null,
        lastRequestTime: 0
      });
    }

    // Food Analysis Workers
    for (let i = 0; i < this.rateLimits.food_analysis.maxConcurrent; i++) {
      this.workerPools.food_analysis.push({
        id: `food_worker_${i}`,
        busy: false,
        currentRequest: null,
        lastRequestTime: 0
      });
    }

    console.log(`[ConcurrentProcessor] Initialized workers: Plan(${this.workerPools.plan_generation.length}), Chat(${this.workerPools.coach_chat.length}), Food(${this.workerPools.food_analysis.length})`);
  }

  /**
   * Add request to appropriate queue
   */
  async addRequest(
    userId: string,
    type: ProcessingRequest['type'],
    data: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      // Check user rate limits
      if (!this.checkUserRateLimit(userId, type)) {
        reject(new Error(`Rate limit exceeded for ${type}. Please wait a moment.`));
        return;
      }

      // Check global rate limits
      if (!this.checkGlobalRateLimit()) {
        reject(new Error('System is busy. Please try again in a moment.'));
        return;
      }

      const request: ProcessingRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type,
        data,
        resolve,
        reject,
        timestamp: Date.now(),
        retries: 0
      };

      // Add to appropriate queue
      this.requestQueues[type].push(request);
      this.stats.totalRequests++;
      this.stats.queueLengths[type] = this.requestQueues[type].length;

      // Update user rate limits
      this.updateUserRateLimit(userId, type);

      console.log(`[ConcurrentProcessor] Added ${type} request for user ${userId}. Queue length: ${this.requestQueues[type].length}`);

      // Try to process immediately
      this.tryProcessRequest(type);
    });
  }

  /**
   * Check if user can make another request of this type
   */
  private checkUserRateLimit(userId: string, type: ProcessingRequest['type']): boolean {
    if (!this.userRateLimits[userId]) {
      this.userRateLimits[userId] = {
        plan_generation: { inProgress: 0, lastRequest: 0, requestsThisMinute: 0 },
        coach_chat: { inProgress: 0, lastRequest: 0, requestsThisMinute: 0 },
        food_analysis: { inProgress: 0, lastRequest: 0, requestsThisMinute: 0 }
      };
    }

    const userLimits = this.userRateLimits[userId][type];
    const rateLimit = this.rateLimits[type];

    // Check concurrent limit
    if (userLimits.inProgress >= 1) {
      console.log(`[ConcurrentProcessor] User ${userId} has ${userLimits.inProgress} ${type} requests in progress`);
      return false;
    }

    // Check requests per minute limit
    if (userLimits.requestsThisMinute >= rateLimit.requestsPerMinute) {
      console.log(`[ConcurrentProcessor] User ${userId} exceeded ${type} requests per minute limit`);
      return false;
    }

    return true;
  }

  /**
   * Check global rate limits
   */
  private checkGlobalRateLimit(): boolean {
    const now = Date.now();
    
    // Reset counter every minute
    if (now - this.globalRateLimits.lastMinuteReset > 60000) {
      this.globalRateLimits.requestsThisMinute = 0;
      this.globalRateLimits.lastMinuteReset = now;
    }

    // Check if we're under the global limit (100 requests per minute)
    return this.globalRateLimits.requestsThisMinute < 100;
  }

  /**
   * Update user rate limits
   */
  private updateUserRateLimit(userId: string, type: ProcessingRequest['type']): void {
    const userLimits = this.userRateLimits[userId][type];
    userLimits.inProgress++;
    userLimits.lastRequest = Date.now();
    userLimits.requestsThisMinute++;
  }

  /**
   * Try to process a request immediately if workers are available
   */
  private tryProcessRequest(type: ProcessingRequest['type']): void {
    const availableWorker = this.workerPools[type].find(worker => !worker.busy);
    
    if (availableWorker && this.requestQueues[type].length > 0) {
      const request = this.requestQueues[type].shift();
      if (request) {
        this.stats.queueLengths[type] = this.requestQueues[type].length;
        this.processRequest(availableWorker, request);
      }
    }
  }

  /**
   * Process a request using a worker
   */
  private async processRequest(worker: Worker, request: ProcessingRequest): Promise<void> {
    worker.busy = true;
    worker.currentRequest = request;
    worker.lastRequestTime = Date.now();
    this.stats.activeWorkers++;

    console.log(`[ConcurrentProcessor] Worker ${worker.id} processing ${request.type} for user ${request.userId}`);

    try {
      // Process the request based on type
      const result = await this.executeRequest(request);
      
      console.log(`[ConcurrentProcessor] Worker ${worker.id} completed ${request.type} for user ${request.userId}`);
      request.resolve(result);
      this.stats.processedRequests++;

    } catch (error) {
      console.error(`[ConcurrentProcessor] Worker ${worker.id} failed ${request.type} for user ${request.userId}:`, error);
      
      // Retry logic
      if (request.retries < 2) {
        request.retries++;
        console.log(`[ConcurrentProcessor] Retrying ${request.type} for user ${request.userId} (attempt ${request.retries})`);
        
        // Add back to queue for retry
        this.requestQueues[request.type].unshift(request);
        this.stats.queueLengths[request.type] = this.requestQueues[request.type].length;
      } else {
        request.reject(error);
        this.stats.failedRequests++;
      }
    } finally {
      // Clean up worker
      worker.busy = false;
      worker.currentRequest = null;
      this.stats.activeWorkers--;

      // Update user rate limits
      this.userRateLimits[request.userId][request.type].inProgress--;

      // Try to process next request in queue
      setTimeout(() => this.tryProcessRequest(request.type), 100);
    }
  }

  /**
   * Execute the actual request
   */
  private async executeRequest(request: ProcessingRequest): Promise<any> {
    switch (request.type) {
      case 'plan_generation':
        return await this.executePlanGeneration(request);
      case 'coach_chat':
        return await this.executeCoachChat(request);
      case 'food_analysis':
        return await this.executeFoodAnalysis(request);
      default:
        throw new Error(`Unknown request type: ${request.type}`);
    }
  }

  /**
   * Execute plan generation
   */
  private async executePlanGeneration(request: ProcessingRequest): Promise<any> {
    const { generatePlanViaEdgeFunction } = await import('./planService');
    return await generatePlanViaEdgeFunction(request.data);
  }

  /**
   * Execute coach chat
   */
  private async executeCoachChat(request: ProcessingRequest): Promise<any> {
    const { sendMessageToCoachGlow } = await import('./coachGlowService');
    return await sendMessageToCoachGlow(request.data);
  }

  /**
   * Execute food analysis
   */
  private async executeFoodAnalysis(request: ProcessingRequest): Promise<any> {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase.functions.invoke('analyze-food', {
      body: request.data
    });
    
    if (error) {
      throw new Error(`Food analysis failed: ${error.message}`);
    }
    
    if (!data || !data.success) {
      throw new Error(data?.error || 'Food analysis failed');
    }
    
    return data.foodItems;
  }

  /**
   * Start processing loops for each queue
   */
  private startProcessingLoops(): void {
    // Start processing loops for each type
    setInterval(() => this.tryProcessRequest('plan_generation'), 1000);
    setInterval(() => this.tryProcessRequest('coach_chat'), 500);
    setInterval(() => this.tryProcessRequest('food_analysis'), 1000);
  }

  /**
   * Reset rate limits every minute
   */
  private startRateLimitReset(): void {
    setInterval(() => {
      const now = Date.now();
      
      // Reset user rate limits
      Object.keys(this.userRateLimits).forEach(userId => {
        Object.keys(this.userRateLimits[userId]).forEach(type => {
          this.userRateLimits[userId][type as ProcessingRequest['type']].requestsThisMinute = 0;
        });
      });

      // Reset global rate limits
      this.globalRateLimits.requestsThisMinute = 0;
      this.globalRateLimits.lastMinuteReset = now;

      console.log('[ConcurrentProcessor] Rate limits reset');
    }, 60000);
  }

  /**
   * Get detailed statistics
   */
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
      },
      rateLimits: this.rateLimits
    };
  }

  /**
   * Get queue lengths
   */
  getQueueLengths() {
    return {
      plan_generation: this.requestQueues.plan_generation.length,
      coach_chat: this.requestQueues.coach_chat.length,
      food_analysis: this.requestQueues.food_analysis.length
    };
  }
}

// Create singleton instance
export const concurrentLLMProcessor = new ConcurrentLLMProcessor();

// Export types
export type { ProcessingRequest, RateLimits };
