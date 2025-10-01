import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { 
  fetchUserProfile, 
  fetchUserActivePlan, 
  getUserDisplayName, 
  formatHeight, 
  formatWeight, 
  getDietPlanName, 
  getDietPlanPills,
  updateUserProfile,
  UserProfile,
  UserPlan
} from '../utils/profileService';
import { useInstantUserProfile, useInstantUserPlan } from '../utils/useInstantData';
import { invalidateCacheForProfile } from '../utils/universalCacheInvalidation';
import { updateUserProfile as updateGlobalUserProfile } from '../utils/instantDataManager';
import { 
  EditProfileModal, 
  ProgressPhotoModal, 
  ProgressComparisonModal
} from '../components';
import { ProgressPhoto, fetchLatestProgressPhoto } from '../utils/progressPhotoService';

const { width } = Dimensions.get('window');

const ProfileScreen: React.FC = () => {
  const { signOut, user } = useAuth();
  const navigation = useNavigation();
  
  // Use instant data hooks for zero-delay updates
  const { profile: userProfile, loading: profileLoading } = useInstantUserProfile(user?.id || null);
  const { plan: userPlan, loading: planLoading } = useInstantUserPlan(user?.id || null);
  
  const [error, setError] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [progressPhotoModalVisible, setProgressPhotoModalVisible] = useState(false);
  const [progressComparisonModalVisible, setProgressComparisonModalVisible] = useState(false);
  const [latestProgressPhoto, setLatestProgressPhoto] = useState<ProgressPhoto | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const loading = profileLoading || planLoading;

  // Load latest progress photo when user profile is available
  useEffect(() => {
    if (user?.id) {
      loadLatestProgressPhoto();
    }
  }, [user?.id]);

  const loadLatestProgressPhoto = async () => {
    if (!user?.id) return;
    
    try {
      const photo = await fetchLatestProgressPhoto(user.id);
      setLatestProgressPhoto(photo);
    } catch (error) {
      
    }
  };

  // Instant data is now handled by useInstantUserProfile and useInstantUserPlan hooks

  const handleEditProfile = () => {
    setEditModalVisible(true);
  };

  const handleSaveProfile = async (updatedData: Partial<UserProfile>) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please try again.');
      return;
    }

    try {
      // Update the profile in the database
      const updatedProfile = await updateUserProfile(user.id, updatedData);
      
      // Immediately update the global state for instant UI updates
      if (updatedProfile) {
        updateGlobalUserProfile(user.id, updatedProfile);
      }
      
      // Also invalidate cache as backup
      invalidateCacheForProfile(user.id, 'edit');
      
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleEditPlan = () => {
    navigation.navigate('EditPlanScreen' as never);
  };

  const handleUploadPhoto = () => {
    setProgressPhotoModalVisible(true);
  };

  const handleViewProgress = () => {
    setProgressComparisonModalVisible(true);
  };

  const handlePhotoUploaded = (photo: ProgressPhoto) => {
    setLatestProgressPhoto(photo);
    // Invalidate cache for profile updates
    invalidateCacheForProfile(user?.id || '', 'photo_upload');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadLatestProgressPhoto();
    } catch (error) {
      
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Navigation will automatically redirect to OnboardingScreen1
              // due to the auth state change handled in AppNavigator
            } catch (error) {
              
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
    );
  };

  // Show loading state
  if (loading) {
    return (
      <LinearGradient
        colors={['#F6FCF9', '#F6F8FC']}
        style={styles.container}
      >
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#b99bce" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </LinearGradient>
    );
  }

  // Show error state
  if (error) {
    return (
      <LinearGradient
        colors={['#F6FCF9', '#F6F8FC']}
        style={styles.container}
      >
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              // Real-time data is automatically handled by hooks
              setError(null);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
      <LinearGradient
        colors={['#F7F3EE', '#F7F3EE']} // Canvas - same as HomeScreen
        style={styles.container}
      >
      <StatusBar style="dark" />
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#937AFD', '#b99bce']}
            tintColor="#937AFD"
          />
        }
      >
        {/* Main White Card */}
        <View style={styles.mainCard}>
          
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.profileInfo}>
              <View style={styles.profileImageContainer}>
                <Image 
                  source={require('../assets/mascot/flex_aura_new_logo_no_bg_2.png')} 
                  style={styles.profileImage}
                />
              </View>
              <View style={styles.profileText}>
                <Text style={styles.name}>{getUserDisplayName(userProfile)}</Text>
                <View style={styles.subtitleContainer}>
                  <Text style={styles.subtitle}>Keep vibing!</Text>
                </View>
              </View>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => navigation.navigate('SettingsScreen' as never)}
              >
                <Ionicons name="settings-outline" size={24} color="#a2b2b7" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.statsGrid}>
              <View style={styles.statColumn}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Age:</Text>
                  <Text style={styles.statValue}>{userProfile?.age || 'N/A'}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Height:</Text>
                  <Text style={styles.statValue}>{formatHeight(userProfile?.height_cm || null)}</Text>
                </View>
              </View>
              <View style={styles.statColumn}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Current Weight:</Text>
                  <Text style={styles.statValue}>{formatWeight(userProfile?.weight_kg || null)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Goal Weight:</Text>
                  <Text style={styles.statValue}>{formatWeight(userProfile?.target_weight_kg || null)}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.planSection}>
              <Text style={styles.currentPlanLabel}>Current Plan:</Text>
              <Text style={styles.currentPlanName}>{getDietPlanName(userPlan)}</Text>
              
              <View style={styles.pillsContainer}>
                {getDietPlanPills(userPlan).map((pill, index) => (
                  <View key={index} style={styles.pill}>
                    <Text style={styles.pillText}>{pill}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Photo Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Your Progress</Text>
              {latestProgressPhoto && (
                <TouchableOpacity 
                  style={styles.viewProgressButton}
                  onPress={handleViewProgress}
                >
                  <Text style={styles.viewProgressButtonText}>View All</Text>
                  <Ionicons name="chevron-forward" size={16} color="#937AFD" />
                </TouchableOpacity>
              )}
            </View>
            
            {latestProgressPhoto ? (
              <View style={styles.progressPhotoContainer}>
                <Image 
                  source={{ uri: latestProgressPhoto.photo_uri }} 
                  style={styles.progressPhoto}
                />
                <View style={styles.progressPhotoInfo}>
                  <Text style={styles.progressPhotoDate}>
                    Latest: {new Date(latestProgressPhoto.taken_at).toLocaleDateString()}
                  </Text>
                  {latestProgressPhoto.notes && (
                    <Text style={styles.progressPhotoNotes} numberOfLines={2}>
                      {latestProgressPhoto.notes}
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.noProgressContainer}>
                <Ionicons name="camera" size={32} color="#ccc" />
                <Text style={styles.noProgressText}>No progress photos yet</Text>
                <Text style={styles.noProgressSubtext}>Start tracking your transformation!</Text>
              </View>
            )}
          </View>

          {/* Main Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editPlanButton} onPress={handleEditPlan}>
              <Text style={styles.editPlanButtonText}>Edit Plan</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadPhotoButton} onPress={handleUploadPhoto}>
              <Text style={styles.uploadPhotoButtonText}>Upload Progress Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#ff6b6b" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        profile={userProfile}
        onSave={handleSaveProfile}
      />

      {/* Progress Photo Modal */}
      <ProgressPhotoModal
        visible={progressPhotoModalVisible}
        onClose={() => setProgressPhotoModalVisible(false)}
        onPhotoUploaded={handlePhotoUploaded}
        userId={user?.id || ''}
      />

      {/* Progress Comparison Modal */}
      <ProgressComparisonModal
        visible={progressComparisonModalVisible}
        onClose={() => setProgressComparisonModalVisible(false)}
        userId={user?.id || ''}
        userProfile={userProfile}
      />


      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="home-outline" size={24} color="#a2b2b7" />
          <Text style={[styles.tabLabel, { color: '#a2b2b7' }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="clipboard-outline" size={24} color="#a2b2b7" />
          <Text style={[styles.tabLabel, { color: '#a2b2b7' }]}>Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="bar-chart-outline" size={24} color="#a2b2b7" />
          <Text style={[styles.tabLabel, { color: '#a2b2b7' }]}>Progress</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, styles.activeTab]}>
          <Ionicons name="person" size={24} color="#b99bce" />
          <Text style={[styles.tabLabel, { color: '#b99bce' }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for tab navigation
  },
  mainCard: {
    backgroundColor: 'white',
    borderRadius: 28,
    margin: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 8,
  },
  
  // Header Section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
  },
  profileText: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B1F', // Ink - same as HomeScreen
    marginBottom: 6,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6A6A6A', // Ash - same as HomeScreen
  },
  mascotEmoji: {
    width: 22,
    height: 22,
    marginLeft: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 4,
    marginLeft: 8,
  },

  // Profile Details Card
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statColumn: {
    flex: 1,
  },
  statItem: {
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#6A6A6A', // Ash - same as HomeScreen
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1F', // Ink - same as HomeScreen
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 24,
  },
  planSection: {
    marginBottom: 16,
  },
  currentPlanLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1F', // Ink - same as HomeScreen
    marginBottom: 4,
  },
  currentPlanName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6F4C', // Coral accent color - same as HomeScreen
    marginBottom: 12,
  },
  pillsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  pill: {
    backgroundColor: '#F0BC2F', // Sun yellow - same as HomeScreen
    borderRadius: 20, // Pill shape
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  pillText: {
    fontSize: 12,
    color: '#6A6A6A', // Ash - same as HomeScreen
  },
  editProfileButton: {
    backgroundColor: '#FF6F4C', // Coral - same as HomeScreen
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  editProfileButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },


  // Progress Section
  progressSection: {
    backgroundColor: '#C9F3C5', // Mint tile - same as HomeScreen
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B1B1F', // Ink - same as HomeScreen
  },
  viewProgressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewProgressButtonText: {
    fontSize: 14,
    color: '#937AFD',
    fontWeight: '600',
    marginRight: 4,
  },
  progressPhotoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  progressPhotoInfo: {
    flex: 1,
  },
  progressPhotoDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A6A6A', // Ash - same as HomeScreen
    marginBottom: 4,
  },
  progressPhotoNotes: {
    fontSize: 12,
    color: '#6A6A6A', // Ash - same as HomeScreen
    lineHeight: 16,
  },
  noProgressContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A6A6A', // Ash - same as HomeScreen
    marginTop: 8,
    marginBottom: 4,
  },
  noProgressSubtext: {
    fontSize: 12,
    color: '#6A6A6A', // Ash - same as HomeScreen
    textAlign: 'center',
  },

  // Action Buttons
  actionButtons: {
    gap: 16,
  },
  editPlanButton: {
    backgroundColor: '#FF6F4C', // Coral - same as HomeScreen
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  uploadPhotoButton: {
    backgroundColor: '#C9F3C5', // Mint tile - same as HomeScreen
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  buttonMascot: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  editPlanButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF', // White on Coral - same as HomeScreen
  },
  uploadPhotoButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1B1F', // Ink - same as HomeScreen
  },

  // Logout Button
  logoutButton: {
    backgroundColor: '#FFEEF0', // Very pale pink
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b', // Red text
    marginLeft: 8,
  },

  // Tab Navigation
  tabNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    // Active tab styling handled by color props
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
  },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6A6A6A', // Ash - same as HomeScreen
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default ProfileScreen;
