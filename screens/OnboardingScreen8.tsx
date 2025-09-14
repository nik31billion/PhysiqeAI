import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { OnboardingErrorHandler } from '../components';

const { width, height } = Dimensions.get('window');

const OnboardingScreen8: React.FC = () => {
  const navigation = useNavigation();
  const { navigateToNextStep, isSaving, error } = useOnboardingNavigation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImagePicker = async () => {
    // Request permission to access media library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to upload your photo!'
      );
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSkip = async () => {
    // Navigate to next screen without photo
    const success = await navigateToNextStep(8, {
      // No photo data to save
    });
    
    if (!success) {
      console.error('Failed to save onboarding data');
    }
  };

  const handleContinue = async () => {
    // Navigate to next screen with profile picture data
    const success = await navigateToNextStep(8, {
      profile_picture: selectedImage || undefined,
    });
    
    if (!success) {
      console.error('Failed to save onboarding data');
    }
  };

  return (
    <OnboardingErrorHandler 
      error={error} 
      loading={isSaving}
      onRetry={() => handleContinue()}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        {/* Full Screen Gradient Background */}
        <LinearGradient
          colors={['#E9F6F3', '#FCF4ED']}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Main Card */}
        <View style={styles.card}>
        {/* Heading */}
        <Text style={styles.heading}>Ready to transform?{'\n'}Upload your photo!</Text>
        
        {/* Subtext */}
        <Text style={styles.subtext}>This is private, secure, and just for you—never shared.</Text>

        {/* Upload Section */}
        <View style={styles.uploadSection}>
          {/* Avatar Circle with Upload Icon */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.defaultAvatar}>
                  {/* Default illustrated avatar */}
                  <View style={styles.avatarHead} />
                  <View style={styles.avatarBody} />
                </View>
              )}
              
              {/* Upload Icon Overlay */}
              <View style={styles.uploadIconContainer}>
                <Ionicons name="cloud-upload" size={24} color="#2D2D2D" />
              </View>
            </View>
          </View>

          {/* Upload Button */}
          <LinearGradient
            colors={['#D7F3FF', '#B9E5FF']}
            style={styles.uploadButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <TouchableOpacity 
              style={styles.uploadButton} 
              onPress={handleImagePicker}
            >
              <Text style={styles.uploadButtonText}>Upload Photo</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Skip Link */}
          <TouchableOpacity onPress={handleSkip} style={styles.skipContainer}>
            <Text style={styles.skipText}>[Skip]</Text>
          </TouchableOpacity>
        </View>

        {/* Info Text */}
        <Text style={styles.infoText}>
          We'll show your progress and even compare{'\n'}your results to a favorite celebrity's physique!
        </Text>

        {/* Privacy Assurance - Back inside card */}
        <View style={styles.privacyContainer}>
          <View style={styles.checkmarkContainer}>
            <Ionicons name="shield-checkmark" size={16} color="#007AFF" />
          </View>
          <Text style={styles.privacyText}>
            Your photo is never shared to our servers. 100% private.
          </Text>
        </View>

        {/* Continue Button */}
        <LinearGradient
          colors={['#E6FFF9', '#B9E5FF']}
          style={styles.continueButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity 
            style={styles.continueButton} 
            onPress={handleContinue}
            disabled={isSaving}
          >
            <Text style={[styles.continueButtonText, isSaving && styles.buttonTextDisabled]}>
              Continue
            </Text>
          </TouchableOpacity>
        </LinearGradient>
        </View>

      {/* Mascot with Phone */}
      <View style={styles.mascotContainer}>
        <Image
          source={require('../assets/mascot/phone no bg.png')}
          style={styles.mascotImage}
          resizeMode="contain"
        />
      </View>
      </View>
    </OnboardingErrorHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    position: 'absolute',
    top: height * 0.08,
    left: width * 0.08,
    right: width * 0.08,
    bottom: height * 0.15,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 25,
    paddingVertical: 40,
    paddingHorizontal: 30,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '400',
  },
  uploadSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  avatarContainer: {
    marginBottom: 25,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FFF5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  uploadedImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  defaultAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHead: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E8E8E8',
    marginBottom: 5,
  },
  avatarBody: {
    width: 40,
    height: 35,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
  },
  uploadIconContainer: {
    position: 'absolute',
    bottom: -5,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  uploadButtonGradient: {
    borderRadius: 30,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 15,
  },
  uploadButton: {
    paddingHorizontal: 50,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
    letterSpacing: 0.3,
  },
  skipContainer: {
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#8E8E93',
    textDecorationLine: 'underline',
    fontWeight: '400',
  },
  infoText: {
    fontSize: 15,
    color: '#2D2D2D',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
    marginBottom: 20,
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  checkmarkContainer: {
    marginRight: 8,
  },
  privacyText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '400',
    textAlign: 'center',
  },
  continueButtonGradient: {
    borderRadius: 35,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    width: '100%',
  },
  continueButton: {
    paddingHorizontal: 60,
    paddingVertical: 18,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D2D2D',
    letterSpacing: 0.5,
  },
  buttonTextDisabled: {
    color: '#8E8E93',
  },
  mascotContainer: {
    position: 'absolute',
    bottom: height * 0.02,
    right: width * 0.05,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotImage: {
    width: 140,
    height: 140,
    zIndex: 2,
  },
});

export default OnboardingScreen8;
