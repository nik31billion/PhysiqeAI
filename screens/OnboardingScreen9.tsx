import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  ScrollView,
  FlatList,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { useOnboarding } from '../utils/OnboardingContext';
import { OnboardingData } from '../utils/onboardingService';
import { OnboardingErrorHandler } from '../components';

const { width, height } = Dimensions.get('window');

interface Character {
  id: string;
  name: string;
  category: 'anime' | 'superhero' | 'celebrity' | 'athlete' | 'other';
  gender: 'male' | 'female' | 'mixed';
  description: string;
  imageUrl: any; // Can be require() result or URI string
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

const mixedCharacters: Character[] = [
  ...maleCharacters.slice(0, 4),
  ...femaleCharacters.slice(0, 4),
];

const OnboardingScreen9: React.FC = () => {
  const navigation = useNavigation();
  const { navigateToNextStep, isSaving, error } = useOnboardingNavigation();
  const { userProfile } = useOnboarding();
   const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
   const [uploadedImage, setUploadedImage] = useState<string | null>(null);
   const [showValidationError, setShowValidationError] = useState(false);
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get user's gender from profile and set available characters
  useEffect(() => {
    if (userProfile?.gender) {
      switch (userProfile.gender) {
        case 'male':
          setAvailableCharacters(maleCharacters);
          break;
        case 'female':
          setAvailableCharacters(femaleCharacters);
          break;
        case 'other':
          setAvailableCharacters(mixedCharacters);
          break;
        default:
          setAvailableCharacters(mixedCharacters);
      }
    } else {
      setAvailableCharacters(mixedCharacters);
    }
  }, [userProfile?.gender]);

   const handleCharacterSelect = (character: Character) => {
     setSelectedCharacter(character);
     setUploadedImage(null);
   };

  const handleUploadImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

       if (!result.canceled && result.assets[0]) {
         setUploadedImage(result.assets[0].uri);
         setSelectedCharacter(null);
       }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const filteredCharacters = availableCharacters.filter(character => {
    const matchesCategory = selectedCategory === 'all' || character.category === selectedCategory;
    return matchesCategory;
  });

  const categories = [
    { id: 'all', name: 'All', count: availableCharacters.length },
    { id: 'anime', name: 'Anime', count: availableCharacters.filter(c => c.category === 'anime').length },
    { id: 'superhero', name: 'Superheroes', count: availableCharacters.filter(c => c.category === 'superhero').length },
    { id: 'celebrity', name: 'Celebrities', count: availableCharacters.filter(c => c.category === 'celebrity').length },
    { id: 'athlete', name: 'Athletes', count: availableCharacters.filter(c => c.category === 'athlete').length },
    { id: 'other', name: 'Other', count: availableCharacters.filter(c => c.category === 'other').length },
  ];

   const handleContinue = async () => {
     if (!selectedCharacter && !uploadedImage) {
       setShowValidationError(true);
       return;
     }
     
     setShowValidationError(false);
     
     const physiqueData: Partial<OnboardingData> = {
       physique_inspiration: selectedCharacter?.name || 'Custom Image',
       physique_character_id: selectedCharacter?.id || undefined,
       physique_uploaded_image: uploadedImage || undefined,
       physique_category: selectedCharacter?.category || undefined,
     };
     
     const success = await navigateToNextStep(9, physiqueData);
     
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
        
        {/* Background Gradient */}
        <LinearGradient
          colors={['#E9F6F3', '#FCF4ED']}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Main Card */}
        <View style={styles.card}>
          <ScrollView 
            style={styles.cardContent}
            contentContainerStyle={styles.cardContentContainer}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            nestedScrollEnabled={true}
          >
            {/* Heading */}
            <Text style={styles.heading}>Which physique{'\n'}inspires you?</Text>

            {/* Category Filter Section */}
            <View style={styles.categorySection}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryScrollContent}
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category.id && styles.selectedCategoryChip,
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      selectedCategory === category.id && styles.selectedCategoryChipText,
                    ]}>
                      {category.name} ({category.count})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Character Gallery Section */}
            <View style={styles.gallerySection}>
              <Text style={styles.galleryLabel}>Choose from Gallery</Text>
              
              <View style={styles.characterGrid}>
                {filteredCharacters.map((character) => (
                  <TouchableOpacity
                    key={character.id}
                    style={[
                      styles.characterCard,
                      { backgroundColor: character.color },
                      selectedCharacter?.id === character.id && styles.selectedCard,
                    ]}
                    onPress={() => handleCharacterSelect(character)}
                    activeOpacity={0.8}
                  >
                     <View style={styles.characterImageContainer}>
                       <Image 
                         source={character.imageUrl} 
                         style={styles.characterImage}
                         resizeMode="cover"
                       />
                     </View>
                    <Text style={styles.characterName}>{character.name}</Text>
                    <Text style={styles.characterCategory}>{character.category}</Text>
                    <Text style={styles.characterDescription} numberOfLines={2}>
                      {character.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

             {/* Upload Section */}
             <View style={styles.uploadSection}>
               <TouchableOpacity style={styles.uploadButton} onPress={handleUploadImage}>
                 <Ionicons name="cloud-upload-outline" size={24} color="#937AFD" />
                 <Text style={styles.uploadButtonText}>Upload your own reference image</Text>
               </TouchableOpacity>
             </View>

             {/* Preview Section */}
             {(selectedCharacter || uploadedImage) && (
               <View style={styles.previewSection}>
                 <Text style={styles.previewLabel}>Selected:</Text>
                 <View style={styles.previewContainer}>
                   {selectedCharacter && (
                     <View style={styles.previewContent}>
                       <Image 
                         source={selectedCharacter.imageUrl} 
                         style={styles.previewImage}
                         resizeMode="cover"
                       />
                       <View style={styles.previewTextContainer}>
                         <Text style={styles.previewName}>{selectedCharacter.name}</Text>
                         <Text style={styles.previewCategory}>{selectedCharacter.category}</Text>
                         <Text style={styles.previewDescription}>{selectedCharacter.description}</Text>
                       </View>
                     </View>
                   )}
                   {uploadedImage && (
                     <View style={styles.previewContent}>
                       <Image source={{ uri: uploadedImage }} style={styles.previewImage} />
                       <View style={styles.previewTextContainer}>
                         <Text style={styles.previewName}>Custom Image</Text>
                         <Text style={styles.previewCategory}>Uploaded</Text>
                       </View>
                     </View>
                   )}
                 </View>
               </View>
             )}

            {/* Privacy Note */}
            <View style={styles.privacyNote}>
              <Text style={styles.privacyText}>Your choices are private and just for you.</Text>
              <View style={styles.checkmarkShield}>
                <Ionicons name="shield-checkmark" size={16} color="#937AFD" />
              </View>
            </View>

             {/* Validation Error Message */}
             {showValidationError && (
               <Text style={styles.validationError}>
                 Please select a character or upload an image
               </Text>
             )}

          </ScrollView>
          
          {/* Continue Button - Fixed at bottom */}
          <View style={styles.continueButtonContainer}>
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
        </View>

        {/* Excited Mascot */}
        <View style={styles.mascotContainer}>
          <Image
            source={require('../assets/mascot/excited no bg.png')}
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
    top: height * 0.06,
    left: width * 0.06,
    right: width * 0.06,
    bottom: height * 0.08,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 35,
    elevation: 20,
  },
  cardContent: {
    flex: 1,
  },
  cardContentContainer: {
    paddingVertical: 25,
    paddingHorizontal: 25,
    alignItems: 'center',
    paddingBottom: 40,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2D2D2D',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 20,
  },
  categorySection: {
    width: '100%',
    marginBottom: 16,
  },
  categoryScroll: {
    maxHeight: 40,
  },
  categoryScrollContent: {
    paddingRight: 20,
  },
  categoryChip: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  selectedCategoryChip: {
    backgroundColor: '#937AFD',
    borderColor: '#937AFD',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  selectedCategoryChipText: {
    color: '#FFFFFF',
  },
  gallerySection: {
    width: '100%',
    marginBottom: 16,
  },
  galleryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'left',
    marginBottom: 12,
  },
  characterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  characterCard: {
    width: '48%', // Two cards per row with 4% gap
    height: 180,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: '#937AFD',
    shadowColor: '#937AFD',
    shadowOpacity: 0.3,
  },
  characterImageContainer: {
    marginBottom: 8,
    height: 60,
    width: 60,
    borderRadius: 30,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterImage: {
    width: '100%',
    height: '100%',
  },
  characterName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 4,
  },
  characterCategory: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666666',
    textAlign: 'center',
    textTransform: 'capitalize',
    marginBottom: 6,
  },
  characterDescription: {
    fontSize: 10,
    fontWeight: '400',
    color: '#888888',
    textAlign: 'center',
    lineHeight: 14,
    flex: 1,
  },
  uploadSection: {
    width: '100%',
    marginBottom: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#937AFD',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#937AFD',
    marginLeft: 8,
  },
  previewSection: {
    width: '100%',
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  previewContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  previewTextContainer: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 2,
  },
  previewCategory: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 11,
    fontWeight: '400',
    color: '#888888',
    lineHeight: 14,
  },
  previewIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  privacyText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  checkmarkShield: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 25,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  continueButtonGradient: {
    width: '100%',
    borderRadius: 25,
    shadowColor: '#B9E5FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  continueButton: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D2D2D',
    letterSpacing: 0.3,
  },
  buttonTextDisabled: {
    color: '#8E8E93',
  },
  validationError: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  mascotContainer: {
    position: 'absolute',
    bottom: height * 0.14,
    right: width * 0.02,
    zIndex: 10,
  },
  mascotImage: {
    width: 80,
    height: 80,
    zIndex: 2,
  },
});

export default OnboardingScreen9;