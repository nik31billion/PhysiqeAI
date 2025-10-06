/**
 * LLM Request Queue System
 * Handles queuing for all LLM operations to prevent API overload
 */

interface QueuedRequest {
  id: string;
  userId: string;
  type: 'plan_generation' | 'coach_chat' | 'food_analysis';
  priority: number; // Higher number = higher priority
  data: any;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
  retries: number;
}

interface QueueStats {
  totalRequests: number;
  processedRequests: number;
  failedRequests: number;
  averageWaitTime: number;
  queueLength: number;
}

class LLMRequestQueue {
  private queues: {
    plan_generation: QueuedRequest[];
    coach_chat: QueuedRequest[];
    food_analysis: QueuedRequest[];
  } = {
    plan_generation: [],
    coach_chat: [],
    food_analysis: []
  };
  
  private processing: {
    plan_generation: boolean;
    coach_chat: boolean;
    food_analysis: boolean;
  } = {
    plan_generation: false,
    coach_chat: false,
    food_analysis: false
  };
  
  private stats: QueueStats = {
    totalRequests: 0,
    processedRequests: 0,
    failedRequests: 0,
    averageWaitTime: 0,
    queueLength: 0
  };
  
  private maxRetries = 3;
  private processingDelays = {
    plan_generation: 5000, // 5 seconds between plan generations
    coach_chat: 2000,      // 2 seconds between chats
    food_analysis: 3000    // 3 seconds between food analyses
  };
  private maxQueueSize = 50; // Per queue

  /**
   * Add request to appropriate queue
   */
  async addRequest(
    userId: string,
    type: QueuedRequest['type'],
    data: any,
    priority: number = 1
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      // Check queue size limit for this specific type
      if (this.queues[type].length >= this.maxQueueSize) {
        reject(new Error(`${type} queue is full. Please try again later.`));
        return;
      }

      const request: QueuedRequest = {
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

      // Start processing this specific queue
      this.processQueue(type);
    });
  }

  /**
   * Process specific queue type
   */
  private async processQueue(type: QueuedRequest['type']): Promise<void> {
    if (this.processing[type] || this.queues[type].length === 0) {
      return;
    }

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
        
        // Process the request based on type
        const result = await this.processRequest(request);
        
        console.log(`[Queue] Successfully processed ${request.type} request for user ${request.userId}`);
        request.resolve(result);
        this.stats.processedRequests++;

      } catch (error) {
        console.error(`[Queue] Error processing ${request.type} request for user ${request.userId}:`, error);
        
        // Retry logic
        if (request.retries < this.maxRetries) {
          request.retries++;
          console.log(`[Queue] Retrying ${request.type} request for user ${request.userId} (attempt ${request.retries})`);
          
          // Add back to the same queue for retry
          this.queues[type].unshift({ ...request, priority: request.priority + 1 });
        } else {
          console.error(`[Queue] Max retries exceeded for ${request.type} request for user ${request.userId}`);
          request.reject(error);
          this.stats.failedRequests++;
        }
      }

      // Wait between requests based on type
      if (this.queues[type].length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.processingDelays[type]));
      }
    }

    this.processing[type] = false;
    console.log(`[Queue] Finished processing ${type} queue. Stats:`, this.getStats());
  }

  /**
   * Process individual request based on type
   */
  private async processRequest(request: QueuedRequest): Promise<any> {
    switch (request.type) {
      case 'plan_generation':
        return await this.processPlanGeneration(request);
      case 'coach_chat':
        return await this.processCoachChat(request);
      case 'food_analysis':
        return await this.processFoodAnalysis(request);
      default:
        throw new Error(`Unknown request type: ${request.type}`);
    }
  }

  /**
   * Process plan generation request
   */
  private async processPlanGeneration(request: QueuedRequest): Promise<any> {
    // Import the plan generation logic dynamically
    const { generatePlanViaEdgeFunction } = await import('./planService');
    
    // Call the existing plan generation function
    return await generatePlanViaEdgeFunction(request.data);
  }

  /**
   * Process coach chat request
   */
  private async processCoachChat(request: QueuedRequest): Promise<any> {
    // Import the coach chat logic dynamically
    const { sendMessageToCoachGlow } = await import('./coachGlowService');
    
    // Call the existing coach chat function
    return await sendMessageToCoachGlow({
      userId: request.userId,
      message: request.data.message,
      context: request.data.context,
      conversationHistory: request.data.conversationHistory
    });
  }

  /**
   * Process food analysis request
   */
  private async processFoodAnalysis(request: QueuedRequest): Promise<any> {
    // Import the supabase client and call the edge function directly
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Call the analyze-food edge function
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
   * Get queue statistics
   */
  getStats(): QueueStats {
    return { ...this.stats };
  }

  /**
   * Get total queue length across all types
   */
  getQueueLength(): number {
    return this.getTotalQueueLength();
  }

  /**
   * Get total queue length across all types
   */
  private getTotalQueueLength(): number {
    return this.queues.plan_generation.length + 
           this.queues.coach_chat.length + 
           this.queues.food_analysis.length;
  }

  /**
   * Get queue length for specific type
   */
  getQueueLengthForType(type: QueuedRequest['type']): number {
    return this.queues[type].length;
  }

  /**
   * Check if any queue is processing
   */
  isProcessing(): boolean {
    return this.processing.plan_generation || 
           this.processing.coach_chat || 
           this.processing.food_analysis;
  }

  /**
   * Check if specific queue type is processing
   */
  isProcessingType(type: QueuedRequest['type']): boolean {
    return this.processing[type];
  }

  /**
   * Clear all queues (emergency use only)
   */
  clearQueue(): void {
    console.warn('[Queue] Clearing all queues - this should only be used in emergencies');
    
    Object.values(this.queues).forEach(queue => {
      queue.forEach(request => {
        request.reject(new Error('Queue cleared'));
      });
    });
    
    this.queues = {
      plan_generation: [],
      coach_chat: [],
      food_analysis: []
    };
    this.stats.queueLength = 0;
  }

  /**
   * Clear specific queue type
   */
  clearQueueType(type: QueuedRequest['type']): void {
    console.warn(`[Queue] Clearing ${type} queue`);
    this.queues[type].forEach(request => {
      request.reject(new Error(`${type} queue cleared`));
    });
    this.queues[type] = [];
    this.stats.queueLength = this.getTotalQueueLength();
  }

  /**
   * Update processing delay for specific type
   */
  setProcessingDelay(type: QueuedRequest['type'], delay: number): void {
    this.processingDelays[type] = Math.max(100, delay); // Minimum 100ms
    console.log(`[Queue] Processing delay for ${type} updated to ${this.processingDelays[type]}ms`);
  }

  /**
   * Update max queue size
   */
  setMaxQueueSize(size: number): void {
    this.maxQueueSize = Math.max(10, size); // Minimum 10
    console.log(`[Queue] Max queue size updated to ${this.maxQueueSize}`);
  }

  /**
   * Get detailed queue statistics
   */
  getDetailedStats() {
    return {
      ...this.stats,
      queues: {
        plan_generation: {
          length: this.queues.plan_generation.length,
          processing: this.processing.plan_generation,
          delay: this.processingDelays.plan_generation
        },
        coach_chat: {
          length: this.queues.coach_chat.length,
          processing: this.processing.coach_chat,
          delay: this.processingDelays.coach_chat
        },
        food_analysis: {
          length: this.queues.food_analysis.length,
          processing: this.processing.food_analysis,
          delay: this.processingDelays.food_analysis
        }
      }
    };
  }
}

// Create singleton instance
export const llmRequestQueue = new LLMRequestQueue();

// Export types for use in other files
export type { QueuedRequest, QueueStats };
