/**
 * Queue Monitor Component
 * Shows queue status and statistics for debugging
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { llmRequestQueue } from '../utils/llmRequestQueue';

interface QueueMonitorProps {
  visible?: boolean;
}

export const QueueMonitor: React.FC<QueueMonitorProps> = ({ visible = false }) => {
  const [detailedStats, setDetailedStats] = useState(llmRequestQueue.getDetailedStats());

  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setDetailedStats(llmRequestQueue.getDetailedStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LLM Queue Monitor</Text>
      
      <View style={styles.statsContainer}>
        <Text style={styles.statText}>Total Queue: {detailedStats.queueLength}</Text>
        <Text style={styles.statText}>Total Requests: {detailedStats.totalRequests}</Text>
        <Text style={styles.statText}>Processed: {detailedStats.processedRequests}</Text>
        <Text style={styles.statText}>Failed: {detailedStats.failedRequests}</Text>
        <Text style={styles.statText}>Avg Wait: {Math.round(detailedStats.averageWaitTime)}ms</Text>
      </View>

      <View style={styles.queueContainer}>
        <Text style={styles.queueTitle}>Plan Generation</Text>
        <Text style={styles.queueText}>
          Length: {detailedStats.queues.plan_generation.length} | 
          Processing: {detailedStats.queues.plan_generation.processing ? 'Yes' : 'No'} | 
          Delay: {detailedStats.queues.plan_generation.delay}ms
        </Text>
      </View>

      <View style={styles.queueContainer}>
        <Text style={styles.queueTitle}>Coach Chat</Text>
        <Text style={styles.queueText}>
          Length: {detailedStats.queues.coach_chat.length} | 
          Processing: {detailedStats.queues.coach_chat.processing ? 'Yes' : 'No'} | 
          Delay: {detailedStats.queues.coach_chat.delay}ms
        </Text>
      </View>

      <View style={styles.queueContainer}>
        <Text style={styles.queueTitle}>Food Analysis</Text>
        <Text style={styles.queueText}>
          Length: {detailedStats.queues.food_analysis.length} | 
          Processing: {detailedStats.queues.food_analysis.processing ? 'Yes' : 'No'} | 
          Delay: {detailedStats.queues.food_analysis.delay}ms
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.clearButton}
        onPress={() => {
          llmRequestQueue.clearQueue();
          setDetailedStats(llmRequestQueue.getDetailedStats());
        }}
      >
        <Text style={styles.clearButtonText}>Clear All Queues</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 12,
    borderRadius: 8,
    minWidth: 280,
    maxWidth: 320,
    zIndex: 1000,
  },
  title: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  statsContainer: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  statText: {
    color: 'white',
    fontSize: 11,
    marginBottom: 2,
  },
  queueContainer: {
    marginBottom: 8,
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },
  queueTitle: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  queueText: {
    color: 'white',
    fontSize: 10,
  },
  clearButton: {
    backgroundColor: '#FF4444',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
