import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import { Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { UserAuraSummary, getAuraLevel } from '../utils/auraService';
import { checkSharingLimits, recordShare, SharingLimitInfo } from '../utils/sharingLimitService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SocialShareModalProps {
  visible: boolean;
  onClose: () => void;
  auraSummary: UserAuraSummary | null;
  userName?: string;
  userId?: string;
  onShareSuccess?: (platform: string, auraEarned: number) => void;
}

const SocialShareModal: React.FC<SocialShareModalProps> = ({
  visible,
  onClose,
  auraSummary,
  userName = 'Champion',
  userId,
  onShareSuccess,
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [sharingLimits, setSharingLimits] = useState<SharingLimitInfo | null>(null);
  const [isLoadingLimits, setIsLoadingLimits] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  const totalAura = auraSummary?.total_aura || 0;
  const currentStreak = auraSummary?.current_streak || 0;
  const bestStreak = auraSummary?.best_streak || 0;
  const auraLevel = getAuraLevel(totalAura);

  // Load sharing limits when modal opens (for internal tracking only)
  React.useEffect(() => {
    if (visible && userId) {
      loadSharingLimits();
    }
  }, [visible, userId]);

  const loadSharingLimits = async () => {
    if (!userId) return;
    
    setIsLoadingLimits(true);
    try {
      const limits = await checkSharingLimits(userId);
      setSharingLimits(limits);
    } catch (error) {
      
    } finally {
      setIsLoadingLimits(false);
    }
  };

  const recordShareAndAura = async (platform: string) => {
    if (!userId) return;
    
    try {
      const result = await recordShare(userId, platform);
      if (result.success) {
        // Always call onShareSuccess, but only show aura if earned
        if (result.auraEarned && result.auraEarned > 0) {
          onShareSuccess?.(platform, result.auraEarned);
        } else {
          // Still show success but no aura animation
          onShareSuccess?.(platform, 0);
        }
        // Reload limits to update remaining counts
        await loadSharingLimits();
      }
    } catch (error) {
      
    }
  };

  const getMotivationalMessage = () => {
    if (currentStreak === 0) {
      return 'Ready to start your journey?';
    } else if (currentStreak < 7) {
      return 'Building momentum!';
    } else if (currentStreak < 14) {
      return 'You\'re on fire!';
    } else if (currentStreak < 30) {
      return 'Unstoppable dedication!';
    } else {
      return 'Legendary commitment!';
    }
  };


  const captureCard = async (): Promise<string | null> => {
    if (!viewShotRef.current) return null;
    
    try {
      setIsCapturing(true);
      const captureMethod = viewShotRef.current.capture;
      if (!captureMethod) return null;
      const uri = await captureMethod();
      return uri;
    } catch (error) {
      
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  const shareToWhatsApp = async () => {
    try {
      const imageUri = await captureCard();
      if (!imageUri) {
        Alert.alert('Error', 'Failed to capture image');
        return;
      }

      const message = `🔥 Check out my fitness progress! 

✨ ${totalAura} Aura Points earned
💪 ${currentStreak} day streak going strong!

Building momentum with Flex Aura - the AI-powered fitness app that tracks your glow journey! 

Download Flex Aura and start your own glow streak! 
#FlexAura #GlowUp #FitnessJourney #AuraPoints`;

      // Share with image as the primary content
      const shareOptions = {
        title: `${userName}'s Glow Card`,
        message: message,
        url: imageUri,
        type: 'image/jpeg',
      };

      const result = await Share.share(shareOptions);
      
      if (result.action === Share.sharedAction) {
        await recordShareAndAura('whatsapp');
        onClose();
      } else if (result.action === Share.dismissedAction) {
        // User cancelled, no need to show error
        return;
      }
    } catch (error) {
      
      Alert.alert('Error', 'Failed to share to WhatsApp');
    }
  };

  const shareToInstagram = async () => {
    try {
      const imageUri = await captureCard();
      if (!imageUri) {
        Alert.alert('Error', 'Failed to capture image');
        return;
      }

      const message = `🔥 Check out my fitness progress! 

✨ ${totalAura} Aura Points earned
💪 ${currentStreak} day streak going strong!

Building momentum with Flex Aura - the AI-powered fitness app! 

Download Flex Aura and start your own glow streak! 
#FlexAura #GlowUp #FitnessJourney #AuraPoints`;

      // Share with image as the primary content
      const shareOptions = {
        title: `${userName}'s Glow Card`,
        message: message,
        url: imageUri,
        type: 'image/jpeg',
      };

      const result = await Share.share(shareOptions);
      
      if (result.action === Share.sharedAction) {
        await recordShareAndAura('instagram');
        onClose();
      } else if (result.action === Share.dismissedAction) {
        // User cancelled, no need to show error
        return;
      }
    } catch (error) {
      
      Alert.alert('Error', 'Failed to share to Instagram');
    }
  };

  const shareToTwitter = async () => {
    try {
      const imageUri = await captureCard();
      if (!imageUri) {
        Alert.alert('Error', 'Failed to capture image');
        return;
      }

      const message = `🔥 Check out my fitness progress! 

✨ ${totalAura} Aura Points earned
💪 ${currentStreak} day streak going strong!

Building momentum with Flex Aura - the AI-powered fitness app! 

Download Flex Aura and start your own glow streak! 
#FlexAura #GlowUp #FitnessJourney #AuraPoints`;

      // Share with image as the primary content
      const shareOptions = {
        title: `${userName}'s Glow Card`,
        message: message,
        url: imageUri,
        type: 'image/jpeg',
      };

      const result = await Share.share(shareOptions);
      
      if (result.action === Share.sharedAction) {
        await recordShareAndAura('x');
        onClose();
      } else if (result.action === Share.dismissedAction) {
        // User cancelled, no need to show error
        return;
      }
    } catch (error) {
      
      Alert.alert('Error', 'Failed to share to X');
    }
  };

  const shareToFacebook = async () => {
    try {
      const imageUri = await captureCard();
      if (!imageUri) {
        Alert.alert('Error', 'Failed to capture image');
        return;
      }

      const message = `🔥 Check out my fitness progress! 

✨ ${totalAura} Aura Points earned
💪 ${currentStreak} day streak going strong!

Building momentum with Flex Aura - the AI-powered fitness app! 

Download Flex Aura and start your own glow streak! 
#FlexAura #GlowUp #FitnessJourney #AuraPoints`;

      // Share with image as the primary content
      const shareOptions = {
        title: `${userName}'s Glow Card`,
        message: message,
        url: imageUri,
        type: 'image/jpeg',
      };

      const result = await Share.share(shareOptions);
      
      if (result.action === Share.sharedAction) {
        await recordShareAndAura('facebook');
        onClose();
      } else if (result.action === Share.dismissedAction) {
        // User cancelled, no need to show error
        return;
      }
    } catch (error) {
      
      Alert.alert('Error', 'Failed to share to Facebook');
    }
  };

  const shareToGeneral = async () => {
    try {
      const imageUri = await captureCard();
      if (!imageUri) {
        Alert.alert('Error', 'Failed to capture image');
        return;
      }

      const message = `🔥 Check out my fitness progress! 

✨ ${totalAura} Aura Points earned
💪 ${currentStreak} day streak going strong!

Building momentum with Flex Aura - the AI-powered fitness app that tracks your glow journey! 

Download Flex Aura and start your own glow streak! 
#FlexAura #GlowUp #FitnessJourney #AuraPoints`;

      const shareOptions = {
        title: `${userName}'s Glow Card`,
        message: message,
        url: imageUri,
        type: 'image/jpeg',
      };

      const result = await Share.share(shareOptions);
      
      if (result.action === Share.sharedAction) {
        await recordShareAndAura('general');
        onClose();
      } else if (result.action === Share.dismissedAction) {
        // User cancelled, no need to show error
        return;
      }
    } catch (error: any) {
      
      Alert.alert('Error', 'Failed to share');
    }
  };

  const downloadCard = async () => {
    try {
      const imageUri = await captureCard();
      if (!imageUri) {
        Alert.alert('Error', 'Failed to capture image');
        return;
      }

      // Check if we're in Expo Go (which has limited media library access)
      const isExpoGo = __DEV__ && !(global as any).Expo?.expoVersion;
      
      if (isExpoGo) {
        Alert.alert(
          'Development Build Required',
          'To save images to your gallery, please create a development build. For now, you can share the image directly using the social media buttons.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Request permission to save to media library
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required', 
          'Please allow access to save the image to your gallery, or use the social media buttons to share directly.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Save the image to the media library
      await MediaLibrary.saveToLibraryAsync(imageUri);
      
      Alert.alert(
        'Success!', 
        'Your Glow Card has been saved to your gallery! You can now share it anywhere you want.',
        [{ text: 'OK', onPress: () => onClose() }]
      );
    } catch (error) {
      
      Alert.alert(
        'Save Failed', 
        'Failed to save image to gallery. You can still share using the social media buttons.',
        [{ text: 'OK' }]
      );
    }
  };

  const SocialButton = ({ 
    icon, 
    label, 
    onPress, 
    color,
    iconType = 'emoji',
    imageSource
  }: { 
    icon?: string; 
    label: string; 
    onPress: () => void; 
    color: string;
    iconType?: 'emoji' | 'text' | 'image';
    imageSource?: any;
  }) => (
    <TouchableOpacity style={styles.socialButton} onPress={onPress}>
      <View style={[
        styles.socialIcon, 
        iconType !== 'image' && { backgroundColor: color }
      ]}>
        {iconType === 'image' && imageSource ? (
          <Image 
            source={imageSource} 
            style={styles.socialIconImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={[
            styles.socialIconText,
            iconType === 'text' && styles.socialIconTextX
          ]}>{icon}</Text>
        )}
      </View>
      <Text style={styles.socialLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Share Your Glow Streak</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Preview Card */}
          <View style={styles.previewContainer}>
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'jpg', quality: 0.9 }}
              style={styles.cardContainer}
            >
              <View style={styles.previewCard}>
                {/* Background with Soft Pastel Gradient */}
                <LinearGradient
                  colors={['#C7F3FF', '#E8F6EF']}
                  style={styles.cardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Faint Lavender Overlay */}
                  <View style={styles.lavenderOverlay} />

                  {/* Header Section */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Flex Aura</Text>
                    <Text style={styles.cardSubtitle}>Share your glow streak</Text>
                  </View>

                  {/* Main Stats Section */}
                  <View style={styles.cardStatsSection}>
                    <View style={styles.cardStatRow}>
                      <View style={styles.cardStatItem}>
                        <Text style={styles.cardStatNumber}>{totalAura}</Text>
                        <Text style={styles.cardStatLabel}>Aura Points</Text>
                      </View>
                      <View style={styles.cardStatItem}>
                        <Text style={styles.cardStatNumber}>{currentStreak}</Text>
                        <Text style={styles.cardStatLabel}>Streak</Text>
                      </View>
                    </View>
                    <View style={styles.advancedBadge}>
                      <Text style={styles.advancedBadgeText}>{auraLevel.level}</Text>
                    </View>
                  </View>

                  {/* Motivational Section */}
                  <View style={styles.cardMotivationalSection}>
                    <Text style={styles.cardHeadline}>Building momentum!</Text>
                  </View>

                  {/* Footer Section */}
                  <View style={styles.cardFooter}>
                    <View style={styles.cardFooterBrand}>
                      <Image
                        source={require('../assets/mascot/flex_aura_new_logo_no_bg_2.png')}
                        style={styles.cardFooterLogo}
                        resizeMode="contain"
                      />
                      <Text style={styles.cardFooterText}>Download Flex Aura</Text>
                    </View>
                    <Text style={styles.cardHashtag}>#FlexAura #GlowUp #FitnessJourney</Text>
                  </View>
                </LinearGradient>
              </View>
            </ViewShot>
          </View>


          {/* Social Media Buttons */}
          <View style={styles.socialButtonsContainer}>
            <View style={styles.socialButtonsRow}>
              <SocialButton
                label="WhatsApp"
                onPress={shareToWhatsApp}
                color="#25D366"
                iconType="image"
                imageSource={require('../assets/logos/whatsapp logo.png')}
              />
              <SocialButton
                label="Instagram"
                onPress={shareToInstagram}
                color="#E4405F"
                iconType="image"
                imageSource={require('../assets/logos/instagram logo.png')}
              />
              <SocialButton
                label="X"
                onPress={shareToTwitter}
                color="#000000"
                iconType="image"
                imageSource={require('../assets/logos/x logo.webp')}
              />
              <SocialButton
                label="Facebook"
                onPress={shareToFacebook}
                color="#1877F2"
                iconType="image"
                imageSource={require('../assets/logos/facebook logo.webp')}
              />
              <SocialButton
                icon="↓"
                label="Download"
                onPress={downloadCard}
                color="#D8C5FF"
                iconType="text"
              />
            </View>
          </View>

          {isCapturing && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Preparing your Glow Card...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: screenWidth * 0.9,
    maxWidth: 400,
    maxHeight: screenHeight * 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#232323',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardContainer: {
    width: screenWidth * 0.7,
    maxWidth: 300,
  },
  previewCard: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  cardGradient: {
    padding: 24,
    minHeight: 280,
    position: 'relative',
  },
  lavenderOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    backgroundColor: '#D8C5FF',
    opacity: 0.3,
    borderRadius: 50,
    transform: [{ translateX: 30 }, { translateY: -30 }],
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
    zIndex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#1B1B1F',
    textAlign: 'center',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A',
    textAlign: 'center',
  },
  cardStatsSection: {
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 1,
  },
  cardStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  cardStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  cardStatNumber: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: '#1B1B1F',
    marginBottom: 4,
  },
  cardStatLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A',
  },
  advancedBadge: {
    backgroundColor: '#FF6F4C',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 4,
  },
  advancedBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
  },
  cardMotivationalSection: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
    zIndex: 1,
  },
  cardHeadline: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#1B1B1F',
    textAlign: 'center',
  },
  cardFooter: {
    alignItems: 'center',
    paddingTop: 16,
    zIndex: 1,
  },
  cardFooterBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardFooterLogo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  cardFooterText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#1B1B1F',
  },
  cardHashtag: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A',
    textAlign: 'center',
  },
  socialButtonsContainer: {
    marginTop: 20,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
  },
  socialButton: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  socialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  socialIconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  socialIconTextX: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  socialIconImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  socialLabel: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 2,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

export default SocialShareModal;
