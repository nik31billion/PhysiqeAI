/**
 * Concurrent Processor Monitor Component
 * Shows real-time statistics for the concurrent LLM processor
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { concurrentLLMProcessor } from '../utils/concurrentLLMProcessor';

interface ConcurrentProcessorMonitorProps {
  visible?: boolean;
}

export const ConcurrentProcessorMonitor: React.FC<ConcurrentProcessorMonitorProps> = ({ visible = false }) => {
  const [stats, setStats] = useState(concurrentLLMProcessor.getStats());
  const [queueLengths, setQueueLengths] = useState(concurrentLLMProcessor.getQueueLengths());

  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setStats(concurrentLLMProcessor.getStats());
      setQueueLengths(concurrentLLMProcessor.getQueueLengths());
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Concurrent LLM Processor</Text>
      
      <View style={styles.statsContainer}>
        <Text style={styles.statText}>Total Requests: {stats.totalRequests}</Text>
        <Text style={styles.statText}>Processed: {stats.processedRequests}</Text>
        <Text style={styles.statText}>Failed: {stats.failedRequests}</Text>
        <Text style={styles.statText}>Active Workers: {stats.activeWorkers}</Text>
      </View>

      <View style={styles.workerContainer}>
        <Text style={styles.workerTitle}>Plan Generation Workers</Text>
        <Text style={styles.workerText}>
          Total: {stats.workers.plan_generation.total} | 
          Busy: {stats.workers.plan_generation.busy} | 
          Available: {stats.workers.plan_generation.available}
        </Text>
        <Text style={styles.queueText}>Queue: {queueLengths.plan_generation}</Text>
        <Text style={styles.limitText}>
          Max Concurrent: {stats.rateLimits.plan_generation.maxConcurrent} | 
          Per Minute: {stats.rateLimits.plan_generation.requestsPerMinute}
        </Text>
      </View>

      <View style={styles.workerContainer}>
        <Text style={styles.workerTitle}>Coach Chat Workers</Text>
        <Text style={styles.workerText}>
          Total: {stats.workers.coach_chat.total} | 
          Busy: {stats.workers.coach_chat.busy} | 
          Available: {stats.workers.coach_chat.available}
        </Text>
        <Text style={styles.queueText}>Queue: {queueLengths.coach_chat}</Text>
        <Text style={styles.limitText}>
          Max Concurrent: {stats.rateLimits.coach_chat.maxConcurrent} | 
          Per Minute: {stats.rateLimits.coach_chat.requestsPerMinute}
        </Text>
      </View>

      <View style={styles.workerContainer}>
        <Text style={styles.workerTitle}>Food Analysis Workers</Text>
        <Text style={styles.workerText}>
          Total: {stats.workers.food_analysis.total} | 
          Busy: {stats.workers.food_analysis.busy} | 
          Available: {stats.workers.food_analysis.available}
        </Text>
        <Text style={styles.queueText}>Queue: {queueLengths.food_analysis}</Text>
        <Text style={styles.limitText}>
          Max Concurrent: {stats.rateLimits.food_analysis.maxConcurrent} | 
          Per Minute: {stats.rateLimits.food_analysis.requestsPerMinute}
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How It Works:</Text>
        <Text style={styles.infoText}>• Multiple workers process requests simultaneously</Text>
        <Text style={styles.infoText}>• Each user can only have 1 request per type in progress</Text>
        <Text style={styles.infoText}>• Rate limits prevent API overload</Text>
        <Text style={styles.infoText}>• No waiting for other users' requests!</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    padding: 12,
    borderRadius: 8,
    minWidth: 320,
    maxWidth: 400,
    maxHeight: 600,
    zIndex: 1000,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsContainer: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  statText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 2,
  },
  workerContainer: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
  },
  workerTitle: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  workerText: {
    color: 'white',
    fontSize: 11,
    marginBottom: 2,
  },
  queueText: {
    color: '#FFC107',
    fontSize: 11,
    marginBottom: 2,
  },
  limitText: {
    color: '#9E9E9E',
    fontSize: 10,
  },
  infoContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderRadius: 6,
  },
  infoTitle: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoText: {
    color: 'white',
    fontSize: 10,
    marginBottom: 2,
  },
});
