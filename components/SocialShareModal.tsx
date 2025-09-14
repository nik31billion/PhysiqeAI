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
      console.error('Error loading sharing limits:', error);
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
      console.error('Error recording share:', error);
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
      console.error('Error capturing card:', error);
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

      const message = `🔥 ${getMotivationalMessage()} 

✨ ${totalAura} Aura Points
🏆 Best Streak: ${bestStreak} days
💪 Current Streak: ${currentStreak} days

Get your Aura on Flex Aura! 
#FlexAura #GlowUp #FitnessJourney #AuraPoints`;

      // Try WhatsApp deep link first
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
      const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpenWhatsApp) {
        await Linking.openURL(whatsappUrl);
        await recordShareAndAura('whatsapp');
        onClose();
      } else {
        // Fall back to general sharing
        await shareToGeneral();
      }
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      Alert.alert('Error', 'Failed to share to WhatsApp');
    }
  };

  const shareToInstagram = async () => {
    // Instagram doesn't support direct sharing via deep links
    // Fall back to general sharing
    await shareToGeneral();
  };

  const shareToTwitter = async () => {
    try {
      const imageUri = await captureCard();
      if (!imageUri) {
        Alert.alert('Error', 'Failed to capture image');
        return;
      }

      const message = `🔥 ${getMotivationalMessage()} 

✨ ${totalAura} Aura Points
💪 ${currentStreak} day streak!

Get your Aura on Flex Aura! 
#FlexAura #GlowUp #FitnessJourney #AuraPoints`;

      // Try X deep link first
      const twitterUrl = `twitter://post?message=${encodeURIComponent(message)}`;
      const canOpenTwitter = await Linking.canOpenURL(twitterUrl);
      
      if (canOpenTwitter) {
        await Linking.openURL(twitterUrl);
        await recordShareAndAura('x');
        onClose();
      } else {
        // Fall back to general sharing
        await shareToGeneral();
      }
    } catch (error) {
      console.error('Error sharing to X:', error);
      Alert.alert('Error', 'Failed to share to X');
    }
  };

  const shareToFacebook = async () => {
    // Facebook doesn't support direct sharing via deep links
    // Fall back to general sharing
    await shareToGeneral();
  };

  const shareToGeneral = async () => {
    try {
      const imageUri = await captureCard();
      if (!imageUri) {
        Alert.alert('Error', 'Failed to capture image');
        return;
      }

      const message = `🔥 ${getMotivationalMessage()} 

✨ ${totalAura} Aura Points
🏆 Best Streak: ${bestStreak} days
💪 Current Streak: ${currentStreak} days

Get your Aura on Flex Aura! 
#FlexAura #GlowUp #FitnessJourney #AuraPoints`;

      const shareOptions = {
        title: `${userName}'s Glow Card`,
        message: `${message}\n\n${imageUri}`,
        url: imageUri,
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
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share');
    }
  };

  const SocialButton = ({ 
    icon, 
    label, 
    onPress, 
    color,
    iconType = 'emoji'
  }: { 
    icon: string; 
    label: string; 
    onPress: () => void; 
    color: string;
    iconType?: 'emoji' | 'text';
  }) => (
    <TouchableOpacity style={styles.socialButton} onPress={onPress}>
      <View style={[styles.socialIcon, { backgroundColor: color }]}>
        <Text style={[
          styles.socialIconText,
          iconType === 'text' && styles.socialIconTextX
        ]}>{icon}</Text>
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
                {/* Background with Professional Gradient */}
                <LinearGradient
                  colors={['#667eea', '#764ba2', '#f093fb']}
                  style={styles.cardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Decorative Elements */}
                  <View style={styles.cardDecorations}>
                    <View style={styles.decorationCircle1} />
                    <View style={styles.decorationCircle2} />
                    <View style={styles.decorationCircle3} />
                  </View>

                  {/* Header Section */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardLogoSection}>
                      <Image
                        source={require('../assets/mascot/flex_aura_logo_no_bg.png')}
                        style={styles.cardLogo}
                        resizeMode="contain"
                      />
                      <View style={styles.cardBrandText}>
                        <Text style={styles.cardAppName}>Flex Aura</Text>
                        <Text style={styles.cardTagline}>Fitness Revolution</Text>
                      </View>
                    </View>
                  </View>

                  {/* Main Stats Section */}
                  <View style={styles.cardStatsSection}>
                    <View style={styles.cardStatRow}>
                      <View style={styles.cardStatItem}>
                        <Text style={styles.cardStatLabel}>AURA POINTS</Text>
                        <Text style={[styles.cardStatValue, { color: '#FFD700' }]}>
                          {totalAura}
                        </Text>
                        <Text style={styles.cardStatSubtext}>{auraLevel.level}</Text>
                      </View>
                      <View style={styles.cardStatDivider} />
                      <View style={styles.cardStatItem}>
                        <Text style={styles.cardStatLabel}>STREAK</Text>
                        <Text style={[styles.cardStatValue, { color: '#FF6B6B' }]}>
                          {currentStreak}
                        </Text>
                        <Text style={styles.cardStatSubtext}>DAYS</Text>
                      </View>
                    </View>
                  </View>

                  {/* Motivational Section */}
                  <View style={styles.cardMotivationalSection}>
                    <Text style={styles.cardMotivationalText}>
                      {getMotivationalMessage()}
                    </Text>
                    {bestStreak > currentStreak && (
                      <Text style={styles.cardBestStreakText}>
                        Best: {bestStreak} days
                      </Text>
                    )}
                  </View>

                  {/* Footer Section */}
                  <View style={styles.cardFooter}>
                    <View style={styles.cardFooterBrand}>
                      <Image
                        source={require('../assets/mascot/flex_aura_logo_no_bg.png')}
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
                icon="W"
                label="WhatsApp"
                onPress={shareToWhatsApp}
                color="#25D366"
                iconType="text"
              />
              <SocialButton
                icon="I"
                label="Instagram"
                onPress={shareToInstagram}
                color="#E4405F"
                iconType="text"
              />
              <SocialButton
                icon="X"
                label="X"
                onPress={shareToTwitter}
                color="#000000"
                iconType="text"
              />
            </View>
            <View style={styles.socialButtonsRow}>
              <SocialButton
                icon="F"
                label="Facebook"
                onPress={shareToFacebook}
                color="#1877F2"
                iconType="text"
              />
              <SocialButton
                icon="S"
                label="Snapchat"
                onPress={shareToGeneral}
                color="#FFFC00"
                iconType="text"
              />
              <SocialButton
                icon="+"
                label="More"
                onPress={shareToGeneral}
                color="#6C757D"
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
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  cardGradient: {
    padding: 24,
    minHeight: 280,
    position: 'relative',
  },
  cardDecorations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorationCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -30,
    right: -30,
  },
  decorationCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -20,
    left: -20,
  },
  decorationCircle3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    top: '60%',
    right: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    zIndex: 1,
  },
  cardLogoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  cardBrandText: {
    flex: 1,
  },
  cardAppName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cardTagline: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  cardStatsSection: {
    marginBottom: 20,
    zIndex: 1,
  },
  cardStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  cardStatLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  cardStatValue: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cardStatSubtext: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cardStatDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  cardMotivationalSection: {
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 1,
  },
  cardMotivationalText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  cardBestStreakText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  cardFooter: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 1,
  },
  cardFooterBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardFooterLogo: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  cardFooterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardHashtag: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.8,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  socialButtonsContainer: {
    marginTop: 20,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  socialButton: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  socialIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  socialIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  socialIconTextX: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
