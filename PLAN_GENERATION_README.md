# Personalized Plan Generation System

This document outlines the implementation of the personalized workout and diet plan generation system using Gemini AI.

## Overview

The system generates customized 7-day workout and meal plans for users based on their onboarding data, using Google's Gemini AI for intelligent plan creation.

## Architecture

### Backend Components

1. **Supabase Edge Function** (`generate-plans`)
   - Located: `supabase/functions/generate-plans/index.ts`
   - Handles plan generation requests
   - Integrates with Gemini AI API
   - Stores plans in database

2. **Database Schema**
   - **user_plans** table: Stores generated workout and diet plans
   - **user_profiles** table: Enhanced with calorie calculation columns

### Frontend Components

1. **Plan Service** (`utils/planService.ts`)
   - Functions for generating and fetching plans
   - Error handling and validation

2. **Updated PlanScreen** (`screens/PlanScreen.tsx`)
   - Displays personalized plans
   - Generate/regenerate functionality
   - Loading states and error handling

## Setup Instructions

### 1. Environment Variables

You need to set up the following environment variables in your Supabase project:

```bash
# Required for the generate-plans edge function
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key and set it as `GEMINI_API_KEY` in your Supabase environment variables

### 3. Database Setup

Run the following SQL commands in your Supabase SQL editor:

```sql
-- Add plans table
CREATE TABLE IF NOT EXISTS user_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_version INTEGER DEFAULT 1,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  user_snapshot JSONB,
  workout_plan JSONB,
  diet_plan JSONB,
  generation_status TEXT DEFAULT 'generating',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own plans" ON user_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans" ON user_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans" ON user_plans
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_active ON user_plans(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_plans_generated_at ON user_plans(generated_at);

-- Add calorie columns to user_profiles (if not already added)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS bmr INTEGER,
ADD COLUMN IF NOT EXISTS tdee INTEGER,
ADD COLUMN IF NOT EXISTS target_calories INTEGER;
```

### 4. Deploy Edge Function

Deploy the edge function to Supabase:

```bash
# Navigate to your project directory
cd Flex Aura

# Deploy the edge function
supabase functions deploy generate-plans

# Or if using Supabase CLI locally
supabase functions serve generate-plans --no-verify-jwt
```

### 5. Test the Integration

1. **Frontend Integration**: The PlanScreen will automatically fetch and display plans
2. **Plan Generation**: Users can generate plans after completing onboarding
3. **Error Handling**: Proper error messages for API failures and validation issues

## API Usage

### Generate Plan

```javascript
import { generatePlanViaEdgeFunction } from '../utils/planService';

// Generate a new plan
const response = await generatePlanViaEdgeFunction({
  userId: user.id,
  regenerate: false // Set to true to regenerate existing plan
});

if (response.success) {
  console.log('Plan generated:', response.workout, response.diet);
} else {
  console.error('Generation failed:', response.error);
}
```

### Fetch User's Plan

```javascript
import { getUserActivePlan } from '../utils/planService';

const plan = await getUserActivePlan(user.id);
if (plan) {
  console.log('Workout plan:', plan.workout_plan);
  console.log('Diet plan:', plan.diet_plan);
}
```

## Data Flow

1. **User completes onboarding** → Profile data stored in `user_profiles`
2. **User requests plan generation** → Frontend calls `generate-plans` edge function
3. **Edge function fetches user data** → Validates data completeness
4. **Creates Gemini prompt** → Inserts user data into prompt template
5. **Calls Gemini API** → Gets AI-generated plan
6. **Validates response** → Ensures proper JSON structure
7. **Stores plan in database** → Saves in `user_plans` table
8. **Returns to frontend** → Displays plan or error message

## Plan Structure

### Workout Plan
```json
{
  "day": "Monday",
  "type": "Push",
  "routine": [
    {
      "exercise": "Bench Press",
      "sets": 3,
      "reps": "8-12",
      "rest": "90 seconds",
      "notes": "Focus on form"
    }
  ]
}
```

### Diet Plan
```json
{
  "day": "Monday",
  "meals": [
    {
      "meal": "Breakfast",
      "description": "Oatmeal with berries and nuts",
      "kcal": 350,
      "protein_g": 12,
      "carbs_g": 45,
      "fat_g": 8
    }
  ]
}
```

## Error Handling

The system includes comprehensive error handling:

- **API Errors**: Gemini API failures, network issues
- **Validation Errors**: Missing user data, invalid responses
- **Database Errors**: Connection issues, permission problems
- **User-Friendly Messages**: Clear error messages for users

## Security Considerations

- **Row Level Security (RLS)**: Users can only access their own plans
- **Input Validation**: All inputs are validated before processing
- **API Key Protection**: Gemini API key stored securely in environment variables
- **Data Sanitization**: User inputs are properly sanitized

## Future Enhancements

1. **Plan Customization**: Allow users to modify generated plans
2. **Progress Tracking**: Track workout completion and adjust plans
3. **Integration with Wearables**: Sync with fitness devices
4. **Social Features**: Share achievements and compete with friends
5. **Advanced Analytics**: Detailed progress reports and insights

## Troubleshooting

### Common Issues

1. **"GEMINI_API_KEY not set"**
   - Ensure the environment variable is set in Supabase
   - Check that the API key is valid and has proper permissions

2. **"User onboarding not complete"**
   - Ensure user has completed all required onboarding screens
   - Check that `onboarding_complete` is set to `true` in database

3. **"Invalid plan structure"**
   - Gemini API may have returned malformed JSON
   - Check the prompt template and API response format

4. **"Database connection failed"**
   - Verify Supabase connection settings
   - Check database permissions and RLS policies

### Debug Mode

Enable debug logging by setting the environment variable:
```bash
DEBUG_MODE=true
```

This will provide detailed logs for troubleshooting API calls and data processing.

## Support

For issues or questions:
1. Check the error logs in Supabase dashboard
2. Verify environment variables are correctly set
3. Test the Gemini API key independently
4. Ensure database schema is properly created

The system is designed to be robust and user-friendly, with comprehensive error handling and clear user feedback throughout the plan generation process.
