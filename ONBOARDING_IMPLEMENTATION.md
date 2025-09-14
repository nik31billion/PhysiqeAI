# Onboarding Data Storage and Routing Implementation

This document explains the complete onboarding data storage and routing system that has been implemented for your Flex Aura app.

## 🗄️ Database Setup

### 1. Create Supabase Table

Run the SQL script in `database/schema.sql` in your Supabase dashboard:

```sql
-- The script creates:
-- - user_profiles table with all onboarding fields
-- - Row Level Security (RLS) policies
-- - Automatic profile creation trigger
-- - Indexes for performance
```

**Steps:**
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database/schema.sql`
4. Run the script

### 2. Environment Variables

Make sure your `.env` file contains:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
```

## 🏗️ Architecture Overview

### Core Components

1. **OnboardingService** (`utils/onboardingService.ts`)
   - Handles all Supabase operations
   - CRUD operations for user profiles
   - Onboarding completion tracking

2. **OnboardingContext** (`utils/OnboardingContext.tsx`)
   - Global state management for onboarding
   - Provides hooks for components
   - Handles loading and error states

3. **useOnboardingNavigation** (`utils/useOnboardingNavigation.ts`)
   - Custom hook for navigation logic
   - Handles data saving and navigation
   - Error handling for navigation

4. **OnboardingErrorHandler** (`components/OnboardingErrorHandler.tsx`)
   - Reusable error and loading UI component
   - Consistent error handling across screens

## 🚀 Features Implemented

### ✅ Data Storage
- **Automatic saving**: Each onboarding step saves data immediately
- **Progress tracking**: Tracks current step and completion status
- **Data persistence**: Progress is saved even if app closes
- **User privacy**: RLS ensures users only see their own data

### ✅ Routing Logic
- **Authentication check**: Redirects to login if not authenticated
- **Onboarding completion check**: Skips onboarding if already complete
- **Resume functionality**: Continues from last completed step
- **Dashboard navigation**: Goes to main app after completion

### ✅ Error Handling
- **Network error handling**: Graceful handling of connection issues
- **Loading states**: Shows spinners during save operations
- **Retry functionality**: Users can retry failed operations
- **User-friendly messages**: Clear error messages for users

### ✅ State Management
- **Global state**: Onboarding progress available throughout app
- **Real-time updates**: State updates immediately after saves
- **Context-based**: Uses React Context for state sharing

## 📱 Updated Screens

### Example Implementation

Two screens have been updated as examples:
- `OnboardingScreen3.tsx` - Primary goals selection
- `OnboardingScreen4.tsx` - Fitness goals selection

### Pattern for Other Screens

Use the template in `utils/onboardingScreenTemplate.tsx` to update remaining screens:

1. **Import required hooks and components:**
```typescript
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { OnboardingErrorHandler } from '../components';
```

2. **Add navigation hook:**
```typescript
const { navigateToNextStep, isSaving, error } = useOnboardingNavigation();
```

3. **Update handleContinue function:**
```typescript
const handleContinue = async () => {
  if (!selectedOption) return;
  
  const success = await navigateToNextStep(SCREEN_NUMBER, {
    // Map your screen's data to OnboardingData fields
    field_name: value,
  });
  
  if (!success) {
    console.error('Failed to save onboarding data');
  }
};
```

4. **Wrap with error handler:**
```typescript
return (
  <OnboardingErrorHandler 
    error={error} 
    loading={isSaving}
    onRetry={() => handleContinue()}
  >
    {/* Your existing UI */}
  </OnboardingErrorHandler>
);
```

## 🗂️ Data Field Mapping

| Screen | Fields to Save |
|--------|----------------|
| OnboardingScreen3 | `primary_goal` |
| OnboardingScreen4 | `fitness_goal`, `other_goal_description` |
| OnboardingScreen5 | `gender` |
| OnboardingScreen6 | `age` |
| OnboardingScreen7 | `height_cm` |
| OnboardingScreen8 | `weight_kg` |
| OnboardingScreen9 | `activity_level` |
| OnboardingScreen10 | `workout_frequency` |
| OnboardingScreen11 | `workout_duration` |
| OnboardingScreen12 | `preferred_workout_time` |
| OnboardingScreen13 | `fitness_experience` |
| OnboardingScreen14 | `target_weight_kg` |
| OnboardingScreen15 | `target_date` |
| OnboardingScreen16 | `motivation_level` |
| OnboardingScreen17 | `preferred_exercises` |
| OnboardingScreen18 | `dietary_preferences` |
| OnboardingScreen19 | `allergies` |
| OnboardingScreen20 | `medical_conditions` |
| OnboardingScreen21 | `equipment_available` |
| OnboardingScreen22 | `notification_preferences`, `privacy_settings`, `additional_notes` |

## 🔧 Special Cases

### Final Screen (OnboardingScreen22)
Use `completeOnboardingFlow` instead of `navigateToNextStep`:

```typescript
const { completeOnboardingFlow } = useOnboardingNavigation();
const success = await completeOnboardingFlow(finalData);
```

### Array Fields
For fields that accept arrays (like `allergies`, `preferred_exercises`):
```typescript
const stepData = {
  allergies: selectedAllergies, // Array of strings
  preferred_exercises: selectedExercises, // Array of strings
};
```

### Date Fields
For date fields:
```typescript
const stepData = {
  target_date: targetDate, // ISO date string
};
```

## 🧪 Testing

### Test Scenarios
1. **New user flow**: Sign up → Complete onboarding → Access dashboard
2. **Returning user**: Login → Skip onboarding → Access dashboard
3. **Incomplete onboarding**: Login → Resume from last step
4. **Network issues**: Test error handling and retry functionality
5. **App restart**: Close app mid-onboarding → Reopen → Resume

### Debug Information
Check the console for:
- Data saving success/failure
- Navigation events
- Error messages
- Supabase operation results

## 🚨 Troubleshooting

### Common Issues

1. **"Failed to save data"**
   - Check Supabase connection
   - Verify RLS policies
   - Check user authentication

2. **"User not authenticated"**
   - Ensure user is logged in
   - Check AuthContext implementation

3. **Navigation not working**
   - Verify screen names match navigation calls
   - Check if user has access to authenticated screens

4. **Data not persisting**
   - Check Supabase table structure
   - Verify data types match schema
   - Check for validation errors

## 📋 Next Steps

1. **Run the database script** in Supabase
2. **Update remaining onboarding screens** using the template
3. **Test the complete flow** with a new user
4. **Test error scenarios** (network issues, etc.)
5. **Customize error messages** if needed
6. **Add any additional validation** as required

## 🔐 Security Notes

- All data is protected by Row Level Security (RLS)
- Users can only access their own profile data
- Automatic profile creation on user signup
- Secure token storage using Expo SecureStore

## 📊 Performance Considerations

- Data is saved immediately after each step
- Minimal data transfer (only changed fields)
- Efficient database queries with proper indexing
- Loading states prevent multiple submissions

The system is now ready for use! Follow the template to update your remaining onboarding screens, and you'll have a fully functional onboarding system with data persistence and proper error handling.
