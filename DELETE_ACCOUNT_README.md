# Delete Account Functionality

This document describes the implementation of the permanent account deletion feature in PhysiqeAI.

## Overview

The delete account functionality allows users to permanently delete their accounts and all associated data. This includes:

- User profile data
- Progress photos
- Workout completions
- Achievements
- Aura events
- Coach Glow chats
- User plans
- Authentication data

## Implementation

### Frontend (React Native)

**Settings Screen** (`screens/SettingsScreen.tsx`)
- Clean, organized settings interface
- Delete account option in "Danger Zone" section
- Two-step confirmation process with clear warnings
- Loading states and error handling

**Navigation Integration**
- Settings button added to ProfileScreen header
- Settings screen added to AppNavigator stack
- Proper navigation flow after account deletion

### Backend (Supabase Edge Function)

**Delete User Data Function** (`supabase/functions/delete-user-data/index.ts`)
- Handles complete data deletion in correct order (respecting foreign key constraints)
- Deletes from all user-related tables
- Removes authentication user
- Proper error handling and CORS support

**Deployment Script** (`deploy-delete-user-data.sh`)
- Automated deployment of the Edge Function
- Includes error checking and status reporting

## User Experience

1. **Access**: User taps settings icon in ProfileScreen header
2. **Navigation**: User scrolls to "Danger Zone" section
3. **Warning**: First confirmation dialog with clear consequences
4. **Final Confirmation**: Second confirmation with "Delete Forever" option
5. **Processing**: Loading indicator during deletion
6. **Completion**: Automatic sign-out and redirect to OnboardingScreen1

## Security Considerations

- **Two-step confirmation**: Prevents accidental deletions
- **Clear warnings**: Users understand the permanent nature
- **Admin privileges**: Edge function requires proper authentication
- **Complete cleanup**: All user data is permanently removed

## Database Tables Affected

The deletion process removes data from these tables in order:
1. `progress_photos`
2. `day_completions`
3. `individual_completions`
4. `achievements`
5. `aura_events`
6. `coach_glow_chats`
7. `user_plans`
8. `user_profiles`
9. Authentication user record

## Deployment

To deploy the delete account functionality:

```bash
# Deploy the Edge Function
./deploy-delete-user-data.sh

# Or manually
supabase functions deploy delete-user-data --project-ref $SUPABASE_PROJECT_REF
```

## Future Enhancements

The Settings screen is designed to accommodate future features:
- Terms of Service
- Privacy Policy
- Contact Us
- Help Center
- Notification preferences
- Privacy & Security settings

## Error Handling

- Network errors are caught and displayed to user
- Database errors are logged for debugging
- User is informed of any issues with clear error messages
- Loading states prevent multiple simultaneous deletion attempts
