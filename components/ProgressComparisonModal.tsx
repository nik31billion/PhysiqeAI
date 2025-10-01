import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import { Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { 
  ProgressPhoto, 
  fetchUserProgressPhotos, 
  formatPhotoDate,
  getProgressPhotosForComparison 
} from '../utils/progressPhotoService';
import { UserProfile } from '../utils/profileService';
import { checkSharingLimits, recordShare } from '../utils/sharingLimitService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Character data for dream physique (same as onboarding)
interface Character {
  id: string;
  name: string;
  category: 'anime' | 'superhero' | 'celebrity' | 'athlete' | 'other';
  gender: 'male' | 'female' | 'mixed';
  description: string;
  imageUrl: any;
  color: string;
}

const maleCharacters: Character[] = [
  { id: 'goku', name: 'Goku', category: 'anime', gender: 'male', description: 'Legendary Saiyan warrior with incredible strength', imageUrl: require('../assets/celebrity/goku.jpg'), color: '#FFE4E6' },
  { id: 'levi', name: 'Levi Ackerman', category: 'anime', gender: 'male', description: 'Elite soldier with exceptional combat skills', imageUrl: require('../assets/celebrity/levi ackerman.jpg'), color: '#E1D6FB' },
  { id: 'naruto', name: 'Naruto', category: 'anime', gender: 'male', description: 'Determined ninja with boundless energy', imageUrl: require('../assets/celebrity/naruto.jpg'), color: '#FFF4C4' },
  { id: 'thor', name: 'Thor', category: 'superhero', gender: 'male', description: 'God of Thunder with godlike physique', imageUrl: require('../assets/celebrity/thor.png'), color: '#C8F5E8' },
  { id: 'captain-america', name: 'Captain America', category: 'superhero', gender: 'male', description: 'Super-soldier with peak human condition', imageUrl: require('../assets/celebrity/captain america.png'), color: '#B9E5FF' },
  { id: 'the-rock', name: 'The Rock', category: 'celebrity', gender: 'male', description: 'Actor and former wrestler with massive build', imageUrl: require('../assets/celebrity/the rock.png'), color: '#FFE8AD' },
  { id: 'ronaldo', name: 'Cristiano Ronaldo', category: 'athlete', gender: 'male', description: 'Football legend with incredible athleticism and dedication', imageUrl: require('../assets/celebrity/ronaldo.png'), color: '#E6D9FF' },
  { id: 'toji', name: 'Toji', category: 'anime', gender: 'male', description: 'Legendary sorcerer with unmatched physical prowess', imageUrl: require('../assets/celebrity/toji.jpg'), color: '#D1F5E7' },
];

const femaleCharacters: Character[] = [
  { id: 'mikasa', name: 'Mikasa Ackerman', category: 'anime', gender: 'female', description: 'Elite soldier with incredible strength and agility', imageUrl: require('../assets/celebrity_female/mikasa ackerman.jpg'), color: '#FFE4E6' },
  { id: 'sakura', name: 'Sakura', category: 'anime', gender: 'female', description: 'Powerful ninja with exceptional medical skills', imageUrl: require('../assets/celebrity_female/sakura.jpeg'), color: '#E1D6FB' },
  { id: 'wonder-woman', name: 'Wonder Woman', category: 'superhero', gender: 'female', description: 'Amazonian warrior with divine strength', imageUrl: require('../assets/celebrity_female/wonder woman.png'), color: '#FFF4C4' },
  { id: 'captain-marvel', name: 'Captain Marvel', category: 'superhero', gender: 'female', description: 'Cosmic-powered hero with incredible abilities', imageUrl: require('../assets/celebrity_female/captain marvel.png'), color: '#C8F5E8' },
  { id: 'zendaya', name: 'Zendaya', category: 'celebrity', gender: 'female', description: 'Actress and model with elegant, toned physique', imageUrl: require('../assets/celebrity_female/zendaya.png'), color: '#B9E5FF' },
  { id: 'kylie-jenner', name: 'Kylie Jenner', category: 'celebrity', gender: 'female', description: 'Model and actress with stunning, fit physique', imageUrl: require('../assets/celebrity_female/kylie jenner.png'), color: '#FFE8AD' },
  { id: 'scarlett-johansson', name: 'Scarlett Johansson', category: 'superhero', gender: 'female', description: 'Black Widow actress with powerful, athletic build', imageUrl: require('../assets/celebrity_female/scarlett johansson black widow.jpg'), color: '#E6D9FF' },
  { id: 'anime-heroine', name: 'Anime Heroine', category: 'other', gender: 'female', description: 'Inspiring fictional character with heroic build', imageUrl: require('../assets/celebrity_female/anime heroine.jpeg'), color: '#D1F5E7' },
];

const allCharacters = [...maleCharacters, ...femaleCharacters];

interface ProgressComparisonModalProps {
  visible: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  userId: string;
  onShareSuccess?: (platform: string, auraEarned: number) => void;
}

const ProgressComparisonModal: React.FC<ProgressComparisonModalProps> = ({
  visible,
  onClose,
  userProfile,
  userId,
  onShareSuccess,
}) => {
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeTab, setActiveTab] = useState<'comparison' | 'timeline'>('comparison');
  const viewShotRef = useRef<ViewShot>(null);

  // Get dream character from user profile
  const dreamCharacter = userProfile?.physique_character_id 
    ? allCharacters.find(char => char.id === userProfile.physique_character_id)
    : null;

  // Get before and current photos
  const beforePhoto = progressPhotos.length > 0 ? progressPhotos[progressPhotos.length - 1] : null;
  const currentPhoto = progressPhotos.length > 0 ? progressPhotos[0] : null;

  useEffect(() => {
    if (visible && userId) {
      loadProgressPhotos();
    }
  }, [visible, userId]);

  const loadProgressPhotos = async () => {
    setLoading(true);
    try {
      const photos = await fetchUserProgressPhotos(userId);
      setProgressPhotos(photos);
    } catch (error) {
      
      Alert.alert('Error', 'Failed to load progress photos');
    } finally {
      setLoading(false);
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

  const recordShareAndAura = async (platform: string) => {
    if (!userId) return;
    
    try {
      const result = await recordShare(userId, platform);
      if (result.success) {
        if (result.auraEarned && result.auraEarned > 0) {
          onShareSuccess?.(platform, result.auraEarned);
        } else {
          onShareSuccess?.(platform, 0);
        }
      }
    } catch (error) {
      
    }
  };

  const shareToWhatsApp = async () => {
    try {
      const imageUri = await captureCard();
      if (!imageUri) {
        Alert.alert('Error', 'Failed to capture image');
        return;
      }

      const message = `🔥 My fitness transformation journey! 

✨ Progress tracking with Flex Aura
💪 Building my dream physique

Check out my before vs dream vs now comparison! 

Download Flex Aura and start your own transformation journey! 
#FlexAura #Transformation #FitnessJourney #GlowUp`;

      const shareOptions = {
        title: 'My Progress Comparison',
        message: message,
        url: imageUri,
        type: 'image/jpeg',
      };

      const result = await Share.share(shareOptions);
      
      if (result.action === Share.sharedAction) {
        await recordShareAndAura('whatsapp');
        onClose();
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

      const message = `🔥 My fitness transformation journey! 

✨ Progress tracking with Flex Aura
💪 Building my dream physique

Check out my before vs dream vs now comparison! 

Download Flex Aura and start your own transformation journey! 
#FlexAura #Transformation #FitnessJourney #GlowUp`;

      const shareOptions = {
        title: 'My Progress Comparison',
        message: message,
        url: imageUri,
        type: 'image/jpeg',
      };

      const result = await Share.share(shareOptions);
      
      if (result.action === Share.sharedAction) {
        await recordShareAndAura('instagram');
        onClose();
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

      const message = `🔥 My fitness transformation journey! 

✨ Progress tracking with Flex Aura
💪 Building my dream physique

Check out my before vs dream vs now comparison! 

Download Flex Aura and start your own transformation journey! 
#FlexAura #Transformation #FitnessJourney #GlowUp`;

      const shareOptions = {
        title: 'My Progress Comparison',
        message: message,
        url: imageUri,
        type: 'image/jpeg',
      };

      const result = await Share.share(shareOptions);
      
      if (result.action === Share.sharedAction) {
        await recordShareAndAura('x');
        onClose();
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

      const message = `🔥 My fitness transformation journey! 

✨ Progress tracking with Flex Aura
💪 Building my dream physique

Check out my before vs dream vs now comparison! 

Download Flex Aura and start your own transformation journey! 
#FlexAura #Transformation #FitnessJourney #GlowUp`;

      const shareOptions = {
        title: 'My Progress Comparison',
        message: message,
        url: imageUri,
        type: 'image/jpeg',
      };

      const result = await Share.share(shareOptions);
      
      if (result.action === Share.sharedAction) {
        await recordShareAndAura('facebook');
        onClose();
      }
    } catch (error) {
      
      Alert.alert('Error', 'Failed to share to Facebook');
    }
  };

  const downloadCard = async () => {
    try {
      const imageUri = await captureCard();
      if (!imageUri) {
        Alert.alert('Error', 'Failed to capture image');
        return;
      }

      // Check if we're in Expo Go
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
        'Your Progress Comparison has been saved to your gallery! You can now share it anywhere you want.',
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

  const renderComparisonCard = () => (
    <ViewShot
      ref={viewShotRef}
      options={{ format: 'jpg', quality: 0.9 }}
      style={styles.cardContainer}
    >
      <View style={styles.comparisonCard}>
        {/* Background with gradient */}
        <LinearGradient
          colors={['#FFE8F5', '#E8F6FF', '#F0FFF4']}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Header with prominent logo */}
          <View style={styles.cardHeader}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/mascot/flex_aura_new_logo_no_bg_2.png')}
                style={styles.mainLogo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.cardTitle}>Progress Comparison</Text>
            <Text style={styles.cardSubtitle}>Your transformation journey</Text>
          </View>

          {/* Main comparison section */}
          <View style={styles.comparisonSection}>
            <Text style={styles.comparisonTitle}>Your Progress Journey</Text>
            
            <View style={styles.photosContainer}>
              {/* Before Photo */}
              <View style={styles.photoColumn}>
                <Text style={styles.photoLabel}>Before</Text>
                <View style={styles.photoCircle}>
                  {beforePhoto ? (
                    <Image 
                      source={{ uri: beforePhoto.photo_uri }} 
                      style={styles.photoImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.placeholderPhoto}>
                      <Ionicons name="person" size={40} color="#ccc" />
                    </View>
                  )}
                </View>
                <Text style={styles.photoDate}>
                  {beforePhoto ? formatPhotoDate(beforePhoto.taken_at) : 'Start'}
                </Text>
              </View>

              {/* Dream Physique */}
              <View style={styles.photoColumn}>
                <Text style={styles.photoLabel}>Your Dream</Text>
                <View style={styles.photoCircle}>
                  {dreamCharacter ? (
                    <Image 
                      source={dreamCharacter.imageUrl} 
                      style={styles.photoImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.placeholderPhoto}>
                      <Ionicons name="star" size={40} color="#FFD700" />
                    </View>
                  )}
                </View>
                <Text style={styles.photoDate}>
                  {dreamCharacter ? dreamCharacter.name : 'Your inspiration'}
                </Text>
              </View>

              {/* Current Photo */}
              <View style={styles.photoColumn}>
                <Text style={styles.photoLabel}>Now</Text>
                <View style={styles.photoCircle}>
                  {currentPhoto ? (
                    <Image 
                      source={{ uri: currentPhoto.photo_uri }} 
                      style={styles.photoImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.placeholderPhoto}>
                      <Ionicons name="person" size={40} color="#ccc" />
                    </View>
                  )}
                </View>
                <Text style={styles.photoDate}>
                  {currentPhoto ? formatPhotoDate(currentPhoto.taken_at) : 'Today'}
                </Text>
              </View>
            </View>
          </View>

          {/* Footer with branding */}
          <View style={styles.cardFooter}>
            <View style={styles.footerBrand}>
              <Text style={styles.footerText}>Download Flex Aura</Text>
            </View>
            <Text style={styles.footerHashtag}>#FlexAura #Transformation #GlowUp</Text>
          </View>
        </LinearGradient>
      </View>
    </ViewShot>
  );

  const renderTimelineView = () => (
    <ScrollView style={styles.timelineContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.timelineTitle}>Your Progress Timeline</Text>
      {progressPhotos.length === 0 ? (
        <View style={styles.noPhotosContainer}>
          <Ionicons name="camera-outline" size={48} color="#ccc" />
          <Text style={styles.noPhotosText}>No progress photos yet</Text>
          <Text style={styles.noPhotosSubtext}>Upload your first progress photo to start tracking your transformation!</Text>
        </View>
      ) : (
        <View style={styles.timelinePhotos}>
          {progressPhotos.map((photo, index) => (
            <View key={photo.id} style={styles.timelinePhotoItem}>
              <Image 
                source={{ uri: photo.photo_uri }} 
                style={styles.timelinePhoto}
                resizeMode="cover"
              />
              <View style={styles.timelinePhotoInfo}>
                <Text style={styles.timelinePhotoDate}>{formatPhotoDate(photo.taken_at)}</Text>
                {photo.notes && (
                  <Text style={styles.timelinePhotoNotes}>{photo.notes}</Text>
                )}
                {photo.weight_kg && (
                  <Text style={styles.timelinePhotoWeight}>{photo.weight_kg} kg</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
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
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Progress Comparison</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'comparison' && styles.activeTab]}
              onPress={() => setActiveTab('comparison')}
            >
              <Text style={[styles.tabText, activeTab === 'comparison' && styles.activeTabText]}>
                Comparison
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'timeline' && styles.activeTab]}
              onPress={() => setActiveTab('timeline')}
            >
              <Text style={[styles.tabText, activeTab === 'timeline' && styles.activeTabText]}>
                Timeline
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#937AFD" />
              <Text style={styles.loadingText}>Loading your progress...</Text>
            </View>
          ) : activeTab === 'comparison' ? (
            <View style={styles.comparisonContainer}>
              {renderComparisonCard()}
              
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
            </View>
          ) : (
            renderTimelineView()
          )}

          {isCapturing && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Preparing your comparison card...</Text>
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
    width: screenWidth * 0.95,
    maxWidth: 400,
    maxHeight: screenHeight * 0.95,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#333',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  comparisonContainer: {
    alignItems: 'center',
  },
  cardContainer: {
    width: screenWidth * 0.85,
    maxWidth: 400,
    marginBottom: 20,
  },
  comparisonCard: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  cardGradient: {
    padding: 20,
    minHeight: 480,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    marginBottom: 8,
  },
  mainLogo: {
    width: 240,
    height: 120,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: '#1B1B1F',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A',
    textAlign: 'center',
  },
  comparisonSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  comparisonTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#1B1B1F',
    textAlign: 'center',
    marginBottom: 16,
  },
  photosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  photoColumn: {
    alignItems: 'center',
    flex: 1,
  },
  photoLabel: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#1B1B1F',
    marginBottom: 14,
  },
  photoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  placeholderPhoto: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoDate: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A',
    textAlign: 'center',
  },
  cardFooter: {
    alignItems: 'center',
    paddingTop: 8,
  },
  footerBrand: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    width: '100%',
  },
  footerText: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#1B1B1F',
    textAlign: 'center',
  },
  footerHashtag: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A',
    textAlign: 'center',
  },
  socialButtonsContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    flexWrap: 'wrap',
  },
  socialButton: {
    alignItems: 'center',
    width: '18%',
    marginHorizontal: 2,
    marginBottom: 8,
  },
  socialIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
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
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  socialLabel: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 12,
  },
  timelineContainer: {
    maxHeight: 400,
  },
  timelineTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#1B1B1F',
    marginBottom: 20,
    textAlign: 'center',
  },
  noPhotosContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noPhotosText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
  },
  noPhotosSubtext: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  timelinePhotos: {
    paddingHorizontal: 8,
  },
  timelinePhotoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  timelinePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  timelinePhotoInfo: {
    flex: 1,
  },
  timelinePhotoDate: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#1B1B1F',
    marginBottom: 4,
  },
  timelinePhotoNotes: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginBottom: 2,
  },
  timelinePhotoWeight: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#999',
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
});

export default ProgressComparisonModal;