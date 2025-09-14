import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { 
  getProgressPhotosForComparison,
  ProgressPhoto,
  formatPhotoDate,
} from '../utils/progressPhotoService';
import { UserProfile } from '../utils/profileService';

const { width, height } = Dimensions.get('window');

interface ProgressComparisonModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  userProfile: UserProfile | null;
}

// Character data with actual local assets (same as OnboardingScreen19)
const maleCharacters = [
  { id: 'goku', name: 'Goku', category: 'anime', gender: 'male', imageSource: require('../assets/celebrity/goku.jpg'), color: '#FFE4E6' },
  { id: 'levi', name: 'Levi Ackerman', category: 'anime', gender: 'male', imageSource: require('../assets/celebrity/levi ackerman.jpg'), color: '#E1D6FB' },
  { id: 'naruto', name: 'Naruto', category: 'anime', gender: 'male', imageSource: require('../assets/celebrity/naruto.jpg'), color: '#FFF4C4' },
  { id: 'captain-america', name: 'Captain America', category: 'superhero', gender: 'male', imageSource: require('../assets/celebrity/captain america.png'), color: '#C8F5E8' },
  { id: 'ronaldo', name: 'Cristiano Ronaldo', category: 'athlete', gender: 'male', imageSource: require('../assets/celebrity/ronaldo.png'), color: '#B9E5FF' },
  { id: 'the-rock', name: 'The Rock', category: 'celebrity', gender: 'male', imageSource: require('../assets/celebrity/the rock.png'), color: '#FFE8AD' },
  { id: 'thor', name: 'Thor', category: 'superhero', gender: 'male', imageSource: require('../assets/celebrity/thor.png'), color: '#E6D9FF' },
  { id: 'toji', name: 'Toji', category: 'anime', gender: 'male', imageSource: require('../assets/celebrity/toji.jpg'), color: '#D1F5E7' },
];

const femaleCharacters = [
  { id: 'mikasa', name: 'Mikasa Ackerman', category: 'anime', gender: 'female', imageSource: require('../assets/celebrity_female/mikasa ackerman.jpg'), color: '#FFE4E6' },
  { id: 'captain-marvel', name: 'Captain Marvel', category: 'superhero', gender: 'female', imageSource: require('../assets/celebrity_female/captain marvel.png'), color: '#E1D6FB' },
  { id: 'sakura', name: 'Sakura Haruno', category: 'anime', gender: 'female', imageSource: require('../assets/celebrity_female/sakura.jpeg'), color: '#FFF4C4' },
  { id: 'kylie-jenner', name: 'Kylie Jenner', category: 'celebrity', gender: 'female', imageSource: require('../assets/celebrity_female/kylie jenner.png'), color: '#C8F5E8' },
  { id: 'black-widow', name: 'Black Widow', category: 'superhero', gender: 'female', imageSource: require('../assets/celebrity_female/scarlett johansson black widow.jpg'), color: '#B9E5FF' },
  { id: 'wonder-woman', name: 'Wonder Woman', category: 'superhero', gender: 'female', imageSource: require('../assets/celebrity_female/wonder woman.png'), color: '#FFE8AD' },
  { id: 'zendaya', name: 'Zendaya', category: 'celebrity', gender: 'female', imageSource: require('../assets/celebrity_female/zendaya.png'), color: '#E6D9FF' },
  { id: 'anime-heroine', name: 'Anime Heroine', category: 'anime', gender: 'female', imageSource: require('../assets/celebrity_female/anime heroine.jpeg'), color: '#D1F5E7' },
];

const allCharacters = [...maleCharacters, ...femaleCharacters];

// Helper function to get character image source
const getCharacterImageSource = (characterId: string) => {
  const character = allCharacters.find(char => char.id === characterId);
  return character?.imageSource || null;
};

const ProgressComparisonModal: React.FC<ProgressComparisonModalProps> = ({
  visible,
  onClose,
  userId,
  userProfile,
}) => {
  const [comparisonData, setComparisonData] = useState<{
    beforePhoto: ProgressPhoto | null;
    afterPhoto: ProgressPhoto | null;
    allPhotos: ProgressPhoto[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedView, setSelectedView] = useState<'comparison' | 'timeline'>('comparison');

  useEffect(() => {
    if (visible) {
      loadComparisonData();
    }
  }, [visible, userId]);

  const loadComparisonData = async () => {
    setLoading(true);
    try {
      const data = await getProgressPhotosForComparison(userId);
      setComparisonData(data);
    } catch (error) {
      console.error('Error loading comparison data:', error);
      Alert.alert('Error', 'Failed to load progress photos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderComparisonView = () => {
    if (!comparisonData) return null;

    const { beforePhoto, afterPhoto } = comparisonData;
    const hasProgressPhotos = beforePhoto || afterPhoto;

    return (
      <View style={styles.comparisonContainer}>
        <Text style={styles.comparisonTitle}>Your Progress Journey</Text>
        
        {hasProgressPhotos ? (
          <View style={styles.comparisonCards}>
            {/* Before Photo */}
            <View style={styles.comparisonCard}>
              <Text style={styles.cardLabel}>Before</Text>
              <View style={styles.photoContainer}>
                {beforePhoto ? (
                  <Image 
                    source={{ uri: beforePhoto.photo_uri }} 
                    style={styles.comparisonPhoto}
                  />
                ) : (
                  <View style={styles.placeholderPhoto}>
                    <Ionicons name="person" size={40} color="#ccc" />
                    <Text style={styles.placeholderText}>No before photo</Text>
                  </View>
                )}
              </View>
              {beforePhoto && (
                <Text style={styles.photoDate}>
                  {formatPhotoDate(beforePhoto.taken_at)}
                </Text>
              )}
            </View>

            {/* Dream Physique */}
            <View style={styles.comparisonCard}>
              <Text style={styles.cardLabel}>Your Dream</Text>
              <View style={styles.photoContainer}>
                {userProfile?.physique_uploaded_image ? (
                  <Image 
                    source={{ uri: userProfile.physique_uploaded_image }} 
                    style={styles.comparisonPhoto}
                  />
                ) : userProfile?.physique_character_id ? (
                  (() => {
                    const characterImageSource = getCharacterImageSource(userProfile.physique_character_id);
                    return characterImageSource ? (
                      <Image 
                        source={characterImageSource} 
                        style={styles.comparisonPhoto}
                      />
                    ) : (
                      <View style={styles.placeholderPhoto}>
                        <Ionicons name="star" size={40} color="#FFD700" />
                        <Text style={styles.placeholderText}>Dream physique</Text>
                      </View>
                    );
                  })()
                ) : (
                  <View style={styles.placeholderPhoto}>
                    <Ionicons name="star" size={40} color="#FFD700" />
                    <Text style={styles.placeholderText}>Set your goal</Text>
                  </View>
                )}
              </View>
              <Text style={styles.photoDate}>Your inspiration</Text>
            </View>

            {/* After Photo */}
            <View style={styles.comparisonCard}>
              <Text style={styles.cardLabel}>Now</Text>
              <View style={styles.photoContainer}>
                {afterPhoto ? (
                  <Image 
                    source={{ uri: afterPhoto.photo_uri }} 
                    style={styles.comparisonPhoto}
                  />
                ) : (
                  <View style={styles.placeholderPhoto}>
                    <Ionicons name="person" size={40} color="#ccc" />
                    <Text style={styles.placeholderText}>No recent photo</Text>
                  </View>
                )}
              </View>
              {afterPhoto && (
                <Text style={styles.photoDate}>
                  {formatPhotoDate(afterPhoto.taken_at)}
                </Text>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.noPhotosContainer}>
            <Ionicons name="camera" size={60} color="#ccc" />
            <Text style={styles.noPhotosTitle}>No Progress Photos Yet</Text>
            <Text style={styles.noPhotosText}>
              Start your journey by uploading your first progress photo!
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderTimelineView = () => {
    if (!comparisonData || comparisonData.allPhotos.length === 0) {
      return (
        <View style={styles.noPhotosContainer}>
          <Ionicons name="camera" size={60} color="#ccc" />
          <Text style={styles.noPhotosTitle}>No Progress Photos Yet</Text>
          <Text style={styles.noPhotosText}>
            Start your journey by uploading your first progress photo!
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.timelineContainer}>
        <Text style={styles.timelineTitle}>Your Progress Timeline</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {comparisonData.allPhotos.map((photo, index) => (
            <View key={photo.id} style={styles.timelineItem}>
              <View style={styles.timelinePhotoContainer}>
                <Image 
                  source={{ uri: photo.photo_uri }} 
                  style={styles.timelinePhoto}
                />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>
                  {formatPhotoDate(photo.taken_at)}
                </Text>
                {photo.notes && (
                  <Text style={styles.timelineNotes}>{photo.notes}</Text>
                )}
                {photo.weight_kg && (
                  <Text style={styles.timelineWeight}>
                    Weight: {photo.weight_kg} kg
                  </Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#e7f8f4', '#fce7e3']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Progress Comparison</Text>
          <View style={styles.placeholder} />
        </View>

        {/* View Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              selectedView === 'comparison' && styles.toggleButtonActive
            ]}
            onPress={() => setSelectedView('comparison')}
          >
            <Text style={[
              styles.toggleButtonText,
              selectedView === 'comparison' && styles.toggleButtonTextActive
            ]}>
              Comparison
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              selectedView === 'timeline' && styles.toggleButtonActive
            ]}
            onPress={() => setSelectedView('timeline')}
          >
            <Text style={[
              styles.toggleButtonText,
              selectedView === 'timeline' && styles.toggleButtonTextActive
            ]}>
              Timeline
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#937AFD" />
              <Text style={styles.loadingText}>Loading your progress...</Text>
            </View>
          ) : (
            <>
              {selectedView === 'comparison' ? renderComparisonView() : renderTimelineView()}
            </>
          )}
        </View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  toggleButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  comparisonContainer: {
    flex: 1,
  },
  comparisonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  comparisonCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  comparisonCard: {
    flex: 1,
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  comparisonPhoto: {
    width: '100%',
    height: '100%',
  },
  placeholderPhoto: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  placeholderText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  photoDate: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  noPhotosContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noPhotosTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  noPhotosText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  timelineContainer: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelinePhotoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: 16,
  },
  timelinePhoto: {
    width: '100%',
    height: '100%',
  },
  timelineContent: {
    flex: 1,
    justifyContent: 'center',
  },
  timelineDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  timelineNotes: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timelineWeight: {
    fontSize: 12,
    color: '#999',
  },
});

export default ProgressComparisonModal;
