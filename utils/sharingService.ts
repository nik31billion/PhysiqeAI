/**
 * Sharing Service for Glow Cards and Progress
 * Handles social media sharing functionality
 */

import { Share, Alert, Platform, Linking } from 'react-native';
import { UserAuraSummary } from './auraService';

export interface ShareOptions {
  title?: string;
  message?: string;
  url?: string;
  imageUri?: string;
  type?: string;
  social?: any;
}

export interface ImageShareOptions {
  imageUri: string;
  message: string;
  title: string;
  platform?: 'whatsapp' | 'instagram' | 'twitter' | 'facebook' | 'general';
}

/**
 * Share Glow Card to social media
 */
export async function shareGlowCard(
  auraSummary: UserAuraSummary | null,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const totalAura = auraSummary?.total_aura || 0;
    const currentStreak = auraSummary?.current_streak || 0;
    const bestStreak = auraSummary?.best_streak || 0;
    
    // Create motivational message based on streak
    const getStreakMessage = () => {
      if (currentStreak === 0) {
        return 'Ready to start my fitness journey!';
      } else if (currentStreak < 7) {
        return `Building momentum with ${currentStreak} days!`;
      } else if (currentStreak < 14) {
        return `On fire with ${currentStreak} days!`;
      } else if (currentStreak < 30) {
        return `Unstoppable with ${currentStreak} days!`;
      } else {
        return `Legendary commitment: ${currentStreak} days!`;
      }
    };

    const streakMessage = getStreakMessage();
    const displayName = userName || 'Champion';

    const shareMessage = `🔥 ${streakMessage} 

✨ ${totalAura} Aura Points
🏆 Best Streak: ${bestStreak} days
💪 Current Streak: ${currentStreak} days

Get your Aura on Flex Aura! 
#FlexAura #GlowUp #FitnessJourney #AuraPoints`;

    const shareOptions: ShareOptions = {
      title: `${displayName}'s Glow Card`,
      message: shareMessage,
    };

    const result = await Share.share(shareOptions);

    if (result.action === Share.sharedAction) {
      return { success: true };
    } else if (result.action === Share.dismissedAction) {
      return { success: false, error: 'Share dismissed' };
    } else {
      return { success: false, error: 'Share failed' };
    }
  } catch (error) {
    
    return { success: false, error: 'Failed to share glow card' };
  }
}

/**
 * Share progress milestone
 */
export async function shareMilestone(
  milestone: string,
  auraEarned: number,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const displayName = userName || 'Champion';
    
    const shareMessage = `🎉 ${milestone}! 

+${auraEarned} Aura Points earned!

Join me on my fitness journey with Flex Aura! 
#FlexAura #GlowUp #FitnessMilestone #AuraPoints`;

    const shareOptions: ShareOptions = {
      title: `${displayName}'s Milestone`,
      message: shareMessage,
    };

    const result = await Share.share(shareOptions);

    if (result.action === Share.sharedAction) {
      return { success: true };
    } else if (result.action === Share.dismissedAction) {
      return { success: false, error: 'Share dismissed' };
    } else {
      return { success: false, error: 'Share failed' };
    }
  } catch (error) {
    
    return { success: false, error: 'Failed to share milestone' };
  }
}

/**
 * Share achievement unlock
 */
export async function shareAchievement(
  achievementName: string,
  achievementDescription: string,
  auraEarned: number,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const displayName = userName || 'Champion';
    
    const shareMessage = `🏆 Achievement Unlocked: ${achievementName}! 

${achievementDescription}

+${auraEarned} Aura Points earned!

Level up your fitness game with Flex Aura! 
#FlexAura #GlowUp #Achievement #AuraPoints`;

    const shareOptions: ShareOptions = {
      title: `${displayName}'s Achievement`,
      message: shareMessage,
    };

    const result = await Share.share(shareOptions);

    if (result.action === Share.sharedAction) {
      return { success: true };
    } else if (result.action === Share.dismissedAction) {
      return { success: false, error: 'Share dismissed' };
    } else {
      return { success: false, error: 'Share failed' };
    }
  } catch (error) {
    
    return { success: false, error: 'Failed to share achievement' };
  }
}

/**
 * Share streak milestone
 */
export async function shareStreakMilestone(
  streakDays: number,
  isNewBest: boolean,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const displayName = userName || 'Champion';
    
    let shareMessage = '';
    if (isNewBest) {
      shareMessage = `🔥 NEW BEST STREAK: ${streakDays} days! 

I'm on fire and nothing can stop me! 

Join me on my fitness journey with Flex Aura! 
#FlexAura #GlowUp #BestStreak #FitnessJourney`;
    } else {
      shareMessage = `🔥 ${streakDays}-Day Streak! 

Consistency is key! I'm building unstoppable momentum! 

Get your streak on with Flex Aura! 
#FlexAura #GlowUp #Streak #FitnessJourney`;
    }

    const shareOptions: ShareOptions = {
      title: `${displayName}'s Streak`,
      message: shareMessage,
    };

    const result = await Share.share(shareOptions);

    if (result.action === Share.sharedAction) {
      return { success: true };
    } else if (result.action === Share.dismissedAction) {
      return { success: false, error: 'Share dismissed' };
    } else {
      return { success: false, error: 'Share failed' };
    }
  } catch (error) {
    
    return { success: false, error: 'Failed to share streak milestone' };
  }
}

/**
 * Share workout completion
 */
export async function shareWorkoutCompletion(
  workoutType: string,
  auraEarned: number,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const displayName = userName || 'Champion';
    
    const shareMessage = `💪 Just crushed my ${workoutType} workout! 

+${auraEarned} Aura Points earned!

Every workout brings me closer to my goals! 

Join me on Flex Aura and start earning your Aura! 
#FlexAura #GlowUp #WorkoutComplete #AuraPoints`;

    const shareOptions: ShareOptions = {
      title: `${displayName}'s Workout`,
      message: shareMessage,
    };

    const result = await Share.share(shareOptions);

    if (result.action === Share.sharedAction) {
      return { success: true };
    } else if (result.action === Share.dismissedAction) {
      return { success: false, error: 'Share dismissed' };
    } else {
      return { success: false, error: 'Share failed' };
    }
  } catch (error) {
    
    return { success: false, error: 'Failed to share workout completion' };
  }
}

/**
 * Share meal completion
 */
export async function shareMealCompletion(
  mealName: string,
  auraEarned: number,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const displayName = userName || 'Champion';
    
    const shareMessage = `🍽️ Just finished my ${mealName}! 

+${auraEarned} Aura Points earned!

Fueling my body for success! 

Track your meals and earn Aura on Flex Aura! 
#FlexAura #GlowUp #MealComplete #AuraPoints`;

    const shareOptions: ShareOptions = {
      title: `${displayName}'s Meal`,
      message: shareMessage,
    };

    const result = await Share.share(shareOptions);

    if (result.action === Share.sharedAction) {
      return { success: true };
    } else if (result.action === Share.dismissedAction) {
      return { success: false, error: 'Share dismissed' };
    } else {
      return { success: false, error: 'Share failed' };
    }
  } catch (error) {
    
    return { success: false, error: 'Failed to share meal completion' };
  }
}

/**
 * Share referral link
 */
export async function shareReferralLink(
  referralCode: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const displayName = userName || 'Champion';
    
    const shareMessage = `🌟 Join me on Flex Aura! 

I'm transforming my fitness journey with this amazing app that gamifies workouts and meals with Aura points!

Use my referral code: ${referralCode}

Download Flex Aura and start earning your Aura today! 
#FlexAura #GlowUp #FitnessJourney #Referral`;

    const shareOptions: ShareOptions = {
      title: `Join ${displayName} on Flex Aura`,
      message: shareMessage,
    };

    const result = await Share.share(shareOptions);

    if (result.action === Share.sharedAction) {
      return { success: true };
    } else if (result.action === Share.dismissedAction) {
      return { success: false, error: 'Share dismissed' };
    } else {
      return { success: false, error: 'Share failed' };
    }
  } catch (error) {
    
    return { success: false, error: 'Failed to share referral link' };
  }
}

/**
 * Check if sharing is available on the device
 */
export function isSharingAvailable(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * Show share options dialog
 */
export function showShareOptions(
  title: string,
  message: string,
  onShare?: () => void,
  onCancel?: () => void
): void {
  Alert.alert(
    title,
    message,
    [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: 'Share',
        onPress: onShare,
      },
    ],
    { cancelable: true }
  );
}

/**
 * Share image with enhanced social media support
 */
export async function shareImageWithSocial(
  options: ImageShareOptions
): Promise<{ success: boolean; error?: string; platform?: string }> {
  try {
    const { imageUri, message, title, platform = 'general' } = options;

    // Platform-specific sharing using deep links
    if (platform !== 'general') {
      const success = await shareToSpecificPlatform(platform, message, imageUri);
      if (success) {
        return { success: true, platform };
      }
    }

    // General sharing using React Native's Share API
    const shareOptions = {
      title,
      message: `${message}\n\n${imageUri}`,
      url: imageUri,
    };

    const result = await Share.share(shareOptions);

    if (result.action === Share.sharedAction) {
      return { success: true, platform: 'general' };
    } else if (result.action === Share.dismissedAction) {
      return { success: false, error: 'Share cancelled' };
    } else {
      return { success: false, error: 'Share failed' };
    }
  } catch (error: any) {
    
    return { success: false, error: 'Failed to share image' };
  }
}

/**
 * Share to specific platform using deep links
 */
async function shareToSpecificPlatform(
  platform: string,
  message: string,
  imageUri: string
): Promise<boolean> {
  try {
    let url = '';
    
    switch (platform) {
      case 'whatsapp':
        url = `whatsapp://send?text=${encodeURIComponent(message)}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct text sharing via deep link
        // We'll fall back to general sharing
        return false;
      case 'twitter':
        url = `twitter://post?message=${encodeURIComponent(message)}`;
        break;
      case 'facebook':
        // Facebook doesn't support direct text sharing via deep link
        // We'll fall back to general sharing
        return false;
      default:
        return false;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    } else {
      // If the app is not installed, fall back to general sharing
      return false;
    }
  } catch (error) {
    
    return false;
  }
}

/**
 * Share Glow Card with image
 */
export async function shareGlowCardWithImage(
  imageUri: string,
  auraSummary: UserAuraSummary | null,
  userName?: string,
  platform: 'whatsapp' | 'instagram' | 'twitter' | 'facebook' | 'general' = 'general'
): Promise<{ success: boolean; error?: string; platform?: string }> {
  try {
    const totalAura = auraSummary?.total_aura || 0;
    const currentStreak = auraSummary?.current_streak || 0;
    const bestStreak = auraSummary?.best_streak || 0;
    
    // Create motivational message based on streak
    const getStreakMessage = () => {
      if (currentStreak === 0) {
        return 'Ready to start my fitness journey!';
      } else if (currentStreak < 7) {
        return `Building momentum with ${currentStreak} days!`;
      } else if (currentStreak < 14) {
        return `On fire with ${currentStreak} days!`;
      } else if (currentStreak < 30) {
        return `Unstoppable with ${currentStreak} days!`;
      } else {
        return `Legendary commitment: ${currentStreak} days!`;
      }
    };

    const streakMessage = getStreakMessage();
    const displayName = userName || 'Champion';

    let shareMessage = '';
    
    // Platform-specific message formatting
    switch (platform) {
      case 'instagram':
        shareMessage = `🔥 ${streakMessage} ✨ ${totalAura} Aura Points 💪 ${currentStreak} day streak! Get your Aura on Flex Aura! #FlexAura #GlowUp #FitnessJourney #AuraPoints`;
        break;
      case 'twitter':
        shareMessage = `🔥 ${streakMessage} 

✨ ${totalAura} Aura Points
💪 ${currentStreak} day streak!

Get your Aura on Flex Aura! 
#FlexAura #GlowUp #FitnessJourney #AuraPoints`;
        break;
      default:
        shareMessage = `🔥 ${streakMessage} 

✨ ${totalAura} Aura Points
🏆 Best Streak: ${bestStreak} days
💪 Current Streak: ${currentStreak} days

Get your Aura on Flex Aura! 
#FlexAura #GlowUp #FitnessJourney #AuraPoints`;
        break;
    }

    return await shareImageWithSocial({
      imageUri,
      message: shareMessage,
      title: `${displayName}'s Glow Card`,
      platform,
    });
  } catch (error) {
    
    return { success: false, error: 'Failed to share glow card' };
  }
}

/**
 * Check if specific social platform is available
 */
export async function isSocialPlatformAvailable(
  platform: 'whatsapp' | 'instagram' | 'twitter' | 'facebook'
): Promise<boolean> {
  try {
    // This is a simplified check - in a real app you might want to check
    // if the specific app is installed on the device
    return Platform.OS === 'ios' || Platform.OS === 'android';
  } catch (error) {
    return false;
  }
}

/**
 * Get available sharing platforms
 */
export async function getAvailableSharingPlatforms(): Promise<string[]> {
  const platforms = ['whatsapp', 'instagram', 'twitter', 'facebook', 'general'];
  const availablePlatforms: string[] = [];

  for (const platform of platforms) {
    if (platform === 'general' || await isSocialPlatformAvailable(platform as any)) {
      availablePlatforms.push(platform);
    }
  }

  return availablePlatforms;
}
