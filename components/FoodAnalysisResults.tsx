import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Animated,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  confidence: number;
}

export interface FoodItem {
  name: string;
  quantity: string;
  nutrition: NutritionData;
}

interface FoodAnalysisResultsProps {
  imageUri: string;
  foodItems: FoodItem[];
  isAnalyzing: boolean;
  onClose: () => void;
  onConfirm: (items: FoodItem[]) => void;
  onRetake: () => void;
}

const FoodAnalysisResults: React.FC<FoodAnalysisResultsProps> = ({
  imageUri,
  foodItems,
  isAnalyzing,
  onClose,
  onConfirm,
  onRetake,
}) => {
  // ALL HOOKS MUST BE AT THE TOP LEVEL - NO CONDITIONAL HOOKS!
  const [editingItems, setEditingItems] = useState<FoodItem[]>(foodItems);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [tempEditItem, setTempEditItem] = useState<FoodItem | null>(null);
  
  // Loading animation hooks - MOVED FROM renderLoadingAnimation function
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Analyzing your food...');
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setEditingItems(foodItems);
  }, [foodItems]);

  useEffect(() => {
    if (!isAnalyzing && foodItems.length > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isAnalyzing, foodItems]);

  // Loading animation effect - MOVED FROM renderLoadingAnimation function
  useEffect(() => {
    if (!isAnalyzing) return;

    const loadingMessages = [
      { progress: 0, message: 'Analyzing your food...', subtitle: 'Initializing AI vision analysis' },
      { progress: 15, message: 'Identifying ingredients...', subtitle: 'Recognizing food items and components' },
      { progress: 35, message: 'Analyzing nutrition...', subtitle: 'Calculating calories and macros' },
      { progress: 55, message: 'Processing cooking methods...', subtitle: 'Considering preparation and ingredients' },
      { progress: 75, message: 'Estimating portions...', subtitle: 'Determining serving sizes' },
      { progress: 90, message: 'Finalizing results...', subtitle: 'Preparing nutrition breakdown' },
      { progress: 100, message: 'Analysis complete!', subtitle: 'Ready to show your results' }
    ];

    // Reset progress when starting
    setProgress(0);
    setCurrentMessage('Analyzing your food...');

    // Simulate progress with realistic timing
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(prev + Math.random() * 15, 100);
        
        // Update message based on progress
        const currentStep = loadingMessages.find(step => next >= step.progress && next < step.progress + 20) || loadingMessages[0];
        setCurrentMessage(currentStep.message);
        
        // Animate progress
        Animated.timing(progressAnim, {
          toValue: next,
          duration: 500,
          useNativeDriver: false,
        }).start();
        
        return next;
      });
    }, 1000);

    // Pulse animation for the image
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return () => {
      clearInterval(progressInterval);
      pulseAnimation.stop();
    };
  }, [isAnalyzing]);

  const getTotalNutrition = () => {
    const totals = editingItems.reduce(
      (total, item) => ({
        calories: total.calories + item.nutrition.calories,
        protein: total.protein + item.nutrition.protein,
        carbs: total.carbs + item.nutrition.carbs,
        fat: total.fat + item.nutrition.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    
    // Round all values for clean display
    return {
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein * 10) / 10, // 1 decimal place
      carbs: Math.round(totals.carbs * 10) / 10, // 1 decimal place
      fat: Math.round(totals.fat * 10) / 10, // 1 decimal place
    };
  };

  const openEditModal = (index: number) => {
    setEditingIndex(index);
    setTempEditItem({ ...editingItems[index] });
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (tempEditItem && editingIndex >= 0) {
      const newItems = [...editingItems];
      newItems[editingIndex] = tempEditItem;
      setEditingItems(newItems);
    }
    setShowEditModal(false);
    setEditingIndex(-1);
    setTempEditItem(null);
  };

  const updateTempNutrition = (field: keyof NutritionData, value: string) => {
    if (tempEditItem) {
      const numValue = parseFloat(value) || 0;
      setTempEditItem({
        ...tempEditItem,
        nutrition: {
          ...tempEditItem.nutrition,
          [field]: numValue,
        },
      });
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#4CAF50';
    if (confidence >= 60) return '#FF9800';
    return '#F44336';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 80) return 'High confidence';
    if (confidence >= 60) return 'Medium confidence';
    return 'Low confidence';
  };

  const renderLoadingAnimation = () => {
    // NO HOOKS HERE - using state from top level
    
    const loadingMessages = [
      { progress: 0, message: 'Analyzing your food...', subtitle: 'Initializing AI vision analysis' },
      { progress: 15, message: 'Identifying ingredients...', subtitle: 'Recognizing food items and components' },
      { progress: 35, message: 'Analyzing nutrition...', subtitle: 'Calculating calories and macros' },
      { progress: 55, message: 'Processing cooking methods...', subtitle: 'Considering preparation and ingredients' },
      { progress: 75, message: 'Estimating portions...', subtitle: 'Determining serving sizes' },
      { progress: 90, message: 'Finalizing results...', subtitle: 'Preparing nutrition breakdown' },
      { progress: 100, message: 'Analysis complete!', subtitle: 'Ready to show your results' }
    ];

    // useEffect removed - now handled at top level

    const currentStep = loadingMessages.find(step => progress >= step.progress) || loadingMessages[0];
    const circumference = 2 * Math.PI * 45; // radius of 45
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <View style={styles.enhancedLoadingContainer}>
        {/* Background Image with Overlay */}
        <Image source={{ uri: imageUri }} style={styles.backgroundImage} blurRadius={10} />
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
          style={styles.loadingOverlay}
        />
        
        <ScrollView contentContainerStyle={styles.loadingScrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Loading Card */}
          <Animated.View style={[styles.loadingCard, { transform: [{ scale: fadeAnim }] }]}>
            {/* Food Image with Pulse Animation */}
            <View style={styles.foodImageContainer}>
              <Animated.View style={[styles.foodImageWrapper, { transform: [{ scale: pulseAnim }] }]}>
                <Image source={{ uri: imageUri }} style={styles.loadingFoodImage} />
                <View style={styles.imageOverlayGradient}>
                  <LinearGradient
                    colors={['transparent', 'rgba(255,111,76,0.3)']}
                    style={styles.imageGradient}
                  />
                </View>
              </Animated.View>
              
              {/* Scanning Overlay Effect */}
              <Animated.View
                style={[
                  styles.scanningOverlay,
                  {
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-200, 200],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>

            {/* Progress Ring */}
            <View style={styles.progressRingContainer}>
              <Svg width={100} height={100} style={styles.progressSvg}>
                {/* Background ring */}
                <Circle
                  cx={50}
                  cy={50}
                  r={45}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={4}
                  fill="transparent"
                />
                {/* Progress ring */}
                <Circle
                  cx={50}
                  cy={50}
                  r={45}
                  stroke="#FF6F4C"
                  strokeWidth={4}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </Svg>
              <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
            </View>

            {/* Loading Messages */}
            <View style={styles.loadingTextContainer}>
              <Text style={styles.enhancedLoadingTitle}>{currentStep.message}</Text>
              <Text style={styles.enhancedLoadingSubtitle}>{currentStep.subtitle}</Text>
            </View>

            {/* AI Analysis Steps */}
            <View style={styles.analysisSteps}>
              {loadingMessages.slice(0, 4).map((step, index) => (
                <View key={index} style={styles.analysisStep}>
                  <View style={[
                    styles.stepIndicator,
                    { backgroundColor: progress >= step.progress ? '#FF6F4C' : 'rgba(255,255,255,0.3)' }
                  ]}>
                    <Ionicons 
                      name={progress >= step.progress ? 'checkmark' : 'ellipse'} 
                      size={12} 
                      color={progress >= step.progress ? '#FFFFFF' : 'rgba(255,255,255,0.6)'} 
                    />
                  </View>
                  <Text style={[
                    styles.stepText,
                    { color: progress >= step.progress ? '#FFFFFF' : 'rgba(255,255,255,0.6)' }
                  ]}>
                    {step.message.replace('...', '')}
                  </Text>
                </View>
              ))}
            </View>

            {/* Fun Facts */}
            <View style={styles.funFactContainer}>
              <Ionicons name="bulb-outline" size={16} color="#FFD700" />
              <Text style={styles.funFactText}>
                {progress < 30 && "Our AI can identify over 10,000 food items worldwide!"}
                {progress >= 30 && progress < 60 && "We analyze different cooking methods and cuisines for accuracy"}
                {progress >= 60 && progress < 90 && "Portion estimation uses visual cues like plate size"}
                {progress >= 90 && "Results include confidence scores for transparency"}
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    );
  };

  const renderNutritionCard = (title: string, value: number, unit: string, color: string) => (
    <View style={styles.nutritionCard}>
      <View style={[styles.nutritionIcon, { backgroundColor: color }]}>
        <Text style={styles.nutritionValue}>{Math.round(value)}</Text>
      </View>
      <Text style={styles.nutritionUnit}>{unit}</Text>
      <Text style={styles.nutritionLabel}>{title}</Text>
    </View>
  );

  const renderEditModal = () => (
    <Modal visible={showEditModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.editModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Food Item</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {tempEditItem && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.editField}>
                <Text style={styles.editLabel}>Food Name</Text>
                <TextInput
                  style={styles.editInput}
                  value={tempEditItem.name}
                  onChangeText={(text) =>
                    setTempEditItem({ ...tempEditItem, name: text })
                  }
                  placeholder="Enter food name"
                />
              </View>

              <View style={styles.editField}>
                <Text style={styles.editLabel}>Quantity</Text>
                <TextInput
                  style={styles.editInput}
                  value={tempEditItem.quantity}
                  onChangeText={(text) =>
                    setTempEditItem({ ...tempEditItem, quantity: text })
                  }
                  placeholder="e.g., 1 cup, 100g"
                />
              </View>

              <Text style={styles.sectionTitle}>Nutrition (per serving)</Text>

              <View style={styles.nutritionEditGrid}>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Calories</Text>
                  <TextInput
                    style={styles.editInput}
                    value={tempEditItem.nutrition.calories.toString()}
                    onChangeText={(text) => updateTempNutrition('calories', text)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>

                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Protein (g)</Text>
                  <TextInput
                    style={styles.editInput}
                    value={tempEditItem.nutrition.protein.toString()}
                    onChangeText={(text) => updateTempNutrition('protein', text)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>

                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Carbs (g)</Text>
                  <TextInput
                    style={styles.editInput}
                    value={tempEditItem.nutrition.carbs.toString()}
                    onChangeText={(text) => updateTempNutrition('carbs', text)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>

                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Fat (g)</Text>
                  <TextInput
                    style={styles.editInput}
                    value={tempEditItem.nutrition.fat.toString()}
                    onChangeText={(text) => updateTempNutrition('fat', text)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>
            </ScrollView>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={saveEdit}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isAnalyzing) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: imageUri }} style={styles.backgroundImage} />
        <View style={styles.overlay} />
        {renderLoadingAnimation()}
      </View>
    );
  }

  const totalNutrition = getTotalNutrition();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nutrition Analysis</Text>
        <TouchableOpacity onPress={onRetake} style={styles.retakeButton}>
          <Ionicons name="camera-outline" size={24} color="#FF6F4C" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Food Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.foodImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={styles.imageOverlay}
          />
        </View>

        {/* Total Nutrition Summary */}
        <Animated.View
          style={[
            styles.totalNutritionContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.totalTitle}>Total Nutrition</Text>
          <View style={styles.nutritionGrid}>
            {renderNutritionCard('Calories', totalNutrition.calories, 'kcal', '#FF6F4C')}
            {renderNutritionCard('Protein', totalNutrition.protein, 'g', '#4CAF50')}
            {renderNutritionCard('Carbs', totalNutrition.carbs, 'g', '#2196F3')}
            {renderNutritionCard('Fat', totalNutrition.fat, 'g', '#FF9800')}
          </View>
        </Animated.View>

        {/* Individual Food Items */}
        <Animated.View
          style={[
            styles.foodItemsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.itemsTitle}>Detected Food Items</Text>
          {editingItems.map((item, index) => (
            <View key={index} style={styles.foodItem}>
              <View style={styles.foodItemHeader}>
                <View style={styles.foodItemInfo}>
                  <Text style={styles.foodItemName}>{item.name}</Text>
                  <Text style={styles.foodItemQuantity}>{item.quantity}</Text>
                </View>
                <View style={styles.foodItemActions}>
                  <View style={styles.confidenceContainer}>
                    <View
                      style={[
                        styles.confidenceDot,
                        { backgroundColor: getConfidenceColor(item.nutrition.confidence) },
                      ]}
                    />
                    <Text style={styles.confidenceText}>
                      {getConfidenceText(item.nutrition.confidence)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => openEditModal(index)}
                    style={styles.editButton}
                  >
                    <Ionicons name="pencil" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.foodItemNutrition}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionItemValue}>
                    {Math.round(item.nutrition.calories)}
                  </Text>
                  <Text style={styles.nutritionItemLabel}>cal</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionItemValue}>
                    {Math.round(item.nutrition.protein)}g
                  </Text>
                  <Text style={styles.nutritionItemLabel}>protein</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionItemValue}>
                    {Math.round(item.nutrition.carbs)}g
                  </Text>
                  <Text style={styles.nutritionItemLabel}>carbs</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionItemValue}>
                    {Math.round(item.nutrition.fat)}g
                  </Text>
                  <Text style={styles.nutritionItemLabel}>fat</Text>
                </View>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Bottom spacing for button */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => onConfirm(editingItems)}
        >
          <LinearGradient
            colors={['#FF6F4C', '#FF8A65']}
            style={styles.confirmButtonGradient}
          >
            <Text style={styles.confirmButtonText}>
              Add to Daily Intake ({Math.round(totalNutrition.calories)} cal)
            </Text>
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {renderEditModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  // Original loading styles (kept for backward compatibility)
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 40,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  scanningAnimation: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  scanningLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FF6F4C',
    shadowColor: '#FF6F4C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },

  // Enhanced loading styles
  enhancedLoadingContainer: {
    flex: 1,
    position: 'relative',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  loadingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
    maxWidth: width - 40,
    minWidth: width - 40,
  },
  foodImageContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  foodImageWrapper: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingFoodImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  imageOverlayGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  imageGradient: {
    flex: 1,
    borderRadius: 16,
  },
  scanningOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#FF6F4C',
    shadowColor: '#FF6F4C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  progressRingContainer: {
    position: 'relative',
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSvg: {
    transform: [{ rotate: '0deg' }],
  },
  progressPercentage: {
    position: 'absolute',
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6F4C',
    fontFamily: 'Poppins-Bold',
  },
  loadingTextContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  enhancedLoadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B1B1F',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  enhancedLoadingSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    lineHeight: 22,
  },
  analysisSteps: {
    width: '100%',
    marginBottom: 24,
  },
  analysisStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  stepIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
    flex: 1,
  },
  funFactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  funFactText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Poppins-Regular',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  retakeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 200,
    position: 'relative',
  },
  foodImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  totalNutritionContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  totalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionCard: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
  nutritionUnit: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  nutritionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginTop: 4,
    fontFamily: 'Poppins-Medium',
  },
  foodItemsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  foodItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 16,
    marginBottom: 16,
  },
  foodItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  foodItemInfo: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  foodItemQuantity: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  foodItemActions: {
    alignItems: 'flex-end',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodItemNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  nutritionItemLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  bottomSpacing: {
    height: 100,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    maxHeight: height * 0.8,
    width: width - 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  modalContent: {
    padding: 20,
  },
  editField: {
    marginBottom: 16,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Poppins-Medium',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#F8F9FA',
    fontFamily: 'Poppins-Regular',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  nutritionEditGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    fontFamily: 'Poppins-Medium',
  },
  saveButton: {
    backgroundColor: '#FF6F4C',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
});

export default FoodAnalysisResults;
