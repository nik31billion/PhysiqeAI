import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { useOnboarding } from '../utils/OnboardingContext';
import { OnboardingErrorHandler } from '../components/OnboardingErrorHandler';

const { width, height } = Dimensions.get('window');

// Character data with actual local assets
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

const OnboardingScreen19: React.FC = () => {
  const navigation = useNavigation();
  const { navigateToNextStep, isSaving, error, generatePlanForUser } = useOnboardingNavigation();
  const { userProfile } = useOnboarding();
  
  
  // Animation values
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous glow animation
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    glowLoop.start();


    // Progress bar animation
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    // Shimmer animation for progress bar
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    shimmerLoop.start();

    return () => {
      glowLoop.stop();
      shimmerLoop.stop();
    };
  }, []);

  const handleContinue = async () => {
    // Start plan generation immediately when user continues from physique comparison
    console.log('🚀 Starting plan generation from OnboardingScreen19');
    generatePlanForUser();
    
    // This is a preview screen, so we just need to update the step
    const success = await navigateToNextStep(19, {});
    if (!success) {
      console.error('Failed to save onboarding data');
    }
  };

  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });


  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.7],
  });

  const shimmerTranslateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.7, width * 0.7],
  });

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
        colors={['#D6F5EC', '#DCECFD', '#F8EFFF', '#FFEADB']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      

      {/* Main Content */}
      <View style={styles.content}>
        {/* Heading */}
        <Text style={styles.heading}>
          Here's a glimpse of your journey...
        </Text>

        {/* Transformation Cards */}
        <View style={styles.cardsContainer}>
          {/* You Now Card */}
          <View style={styles.card}>
            <Animated.View 
              style={[
                styles.cardGlow,
                {
                  opacity: glowOpacity,
                }
              ]}
            />
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
              style={styles.cardGradient}
            />
            
            {/* User Profile Picture */}
            <View style={styles.avatarContainer}>
              {userProfile?.profile_picture && userProfile.profile_picture.trim() !== '' ? (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: userProfile.profile_picture }}
                    style={styles.userAvatar}
                    resizeMode="cover"
                  />
                  {/* Subtle glow effect */}
                  <Animated.View 
                    style={[
                      styles.imageGlow,
                      { opacity: glowOpacity }
                    ]}
                  />
                </View>
              ) : (
                <View style={styles.placeholderContainer}>
                  <View style={styles.placeholderAvatar}>
                    <LinearGradient
                      colors={['#E8E8E8', '#F5F5F5', '#E8E8E8']}
                      style={styles.placeholderGradient}
                    />
                    {/* Simple human silhouette */}
                    <View style={styles.silhouette}>
                      <View style={styles.silhouetteHead} />
                      <View style={styles.silhouetteBody} />
                    </View>
                  </View>
                </View>
              )}
            </View>
            
            <Text style={styles.cardLabel}>You Now</Text>
          </View>

          {/* Your Dream Physique Card */}
          <View style={styles.card}>
            <Animated.View 
              style={[
                styles.cardGlow,
                {
                  opacity: glowOpacity,
                }
              ]}
            />
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
              style={styles.cardGradient}
            />
            
            {/* Dream Physique Image */}
            <View style={styles.avatarContainer}>
              {userProfile?.physique_uploaded_image && userProfile.physique_uploaded_image.trim() !== '' ? (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: userProfile.physique_uploaded_image }}
                    style={styles.dreamAvatarImage}
                    resizeMode="cover"
                  />
                  {/* Golden glow effect */}
                  <Animated.View 
                    style={[
                      styles.dreamImageGlow,
                      { opacity: glowOpacity }
                    ]}
                  />
                </View>
              ) : userProfile?.physique_character_id ? (
                (() => {
                  const characterImageSource = getCharacterImageSource(userProfile.physique_character_id);
                  return characterImageSource ? (
                    <View style={styles.imageContainer}>
                      <Image
                        source={characterImageSource}
                        style={styles.dreamAvatarImage}
                        resizeMode="cover"
                      />
                      {/* Golden glow effect */}
                      <Animated.View 
                        style={[
                          styles.dreamImageGlow,
                          { opacity: glowOpacity }
                        ]}
                      />
                    </View>
                  ) : (
                    <View style={styles.placeholderContainer}>
                      <View style={styles.dreamPlaceholderAvatar}>
                        <LinearGradient
                          colors={['#FFD700', '#FFA500', '#FF8C00']}
                          style={styles.dreamPlaceholderGradient}
                        />
                        {/* Muscular silhouette */}
                        <View style={styles.dreamSilhouette}>
                          <View style={styles.dreamSilhouetteHead} />
                          <View style={styles.dreamSilhouetteBody} />
                        </View>
                        {/* Glow Up Loading overlay */}
                        <View style={styles.loadingOverlay}>
                          <Text style={styles.loadingText}>Glow Up Loading...</Text>
                        </View>
                      </View>
                    </View>
                  );
                })()
              ) : (
                <View style={styles.placeholderContainer}>
                  <View style={styles.dreamPlaceholderAvatar}>
                    <LinearGradient
                      colors={['#FFD700', '#FFA500', '#FF8C00']}
                      style={styles.dreamPlaceholderGradient}
                    />
                    {/* Muscular silhouette */}
                    <View style={styles.dreamSilhouette}>
                      <View style={styles.dreamSilhouetteHead} />
                      <View style={styles.dreamSilhouetteBody} />
                    </View>
                    {/* Glow Up Loading overlay */}
                    <View style={styles.loadingOverlay}>
                      <Text style={styles.loadingText}>Glow Up Loading...</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
            
            <Text style={styles.cardLabel}>Your Dream Physique</Text>
          </View>
        </View>

        {/* Glow Up Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Glow Up Loading...</Text>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarTrack}>
              <Animated.View 
                style={[
                  styles.progressBarFill,
                  {
                    width: progressWidth,
                  }
                ]}
              >
                <LinearGradient
                  colors={['#FFF4C7', '#E5D5FB', '#B7FCE7']}
                  style={styles.progressGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                {/* Shimmer effect */}
                <Animated.View 
                  style={[
                    styles.shimmer,
                    {
                      transform: [{ translateX: shimmerTranslateX }]
                    }
                  ]}
                />
              </Animated.View>
            </View>
          </View>
        </View>


        {/* Motivational Text */}
        <Text style={styles.motivationalText}>
          You're closer than you think. With Flex Aura, your{'\n'}
          journey will feel as amazing as your results.
        </Text>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={isSaving}
        >
          <LinearGradient
            colors={['#B7FCE7', '#C7F9F1']}
            style={styles.continueButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.continueButtonText}>
              Continue
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        </View>

      {/* Mascot */}
      <View style={styles.mascotContainer}>
        <Image
          source={require('../assets/mascot/dancing no bg.png')}
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
    position: 'relative',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    paddingTop: height * 0.06,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 36,
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 40,
    paddingHorizontal: 15,
    gap: 12,
  },
  card: {
    width: (width - 60) / 2,
    height: 280,
    borderRadius: 25,
    position: 'relative',
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 30,
    backgroundColor: 'rgba(183, 252, 231, 0.1)',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 25,
  },
  avatarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingTop: 20,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  userAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  dreamAvatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imageGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 55,
    backgroundColor: 'transparent',
  },
  dreamImageGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 55,
    backgroundColor: 'transparent',
  },
  placeholderContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    position: 'relative',
  },
  placeholderGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  silhouette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  silhouetteHead: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    marginBottom: 5,
  },
  silhouetteBody: {
    width: 40,
    height: 35,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dreamPlaceholderAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    position: 'relative',
  },
  dreamPlaceholderGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  dreamSilhouette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dreamSilhouetteHead: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 5,
  },
  dreamSilhouetteBody: {
    width: 45,
    height: 35,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  loadingOverlay: {
    position: 'absolute',
    bottom: -10,
    left: -10,
    right: -10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  loadingText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
  cardLabel: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    fontFamily: 'System',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  progressLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
    marginBottom: 15,
    fontFamily: 'System',
  },
  progressBarContainer: {
    width: width * 0.75,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  progressBarTrack: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  progressGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
  },
  motivationalText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    marginTop: 5,
    paddingHorizontal: 20,
    fontFamily: 'System',
    fontWeight: '500',
  },
  continueButton: {
    width: '100%',
    borderRadius: 35,
    marginBottom: 30,
    marginTop: 10,
  },
  continueButtonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 35,
  },
  continueButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
  mascotContainer: {
    position: 'absolute',
    bottom: 140,
    right: 20,
    zIndex: 10,
  },
  mascotImage: {
    width: 80,
    height: 80,
  },
});

export default OnboardingScreen19;
