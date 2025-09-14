# Coach Glow AI Assistant - Implementation Documentation

## 🎯 Overview

Coach Glow is an AI-powered fitness assistant that serves as a motivational and accountability partner. It provides three core functionalities:

1. **Motivation & Accountability** - Encourages users, supports streaks, responds empathetically
2. **Plan Modifications** - Allows users to request swaps for meals or workouts
3. **General Fitness Queries** - Answers user fitness, nutrition, or app-related questions

## 🏗️ Architecture

### Backend Components

#### 1. Coach Glow Edge Function (`supabase/functions/coach-glow/index.ts`)
**Purpose**: Main AI conversation handler

**Key Features**:
- **Intent Detection**: Automatically routes messages to appropriate handlers
- **Context Extraction**: Intelligently extracts only necessary user data
- **Dynamic Prompt Construction**: Creates personalized prompts for Gemini API
- **Chat Logging**: Tracks all interactions for personalization
- **Response Time Tracking**: Monitors performance metrics

**Intent Detection Logic**:
```typescript
// Motivation keywords: "motivated", "unmotivated", "quitting", "struggling"
// Plan swap keywords: "change", "swap", "breakfast", "workout", "don't like"
// General: Everything else
```

**Context Extraction**:
- **Motivation**: User profile + streak data + progress stats
- **Plan Swap**: User profile + relevant plan section + dietary constraints
- **General**: User profile only

#### 2. Apply Plan Swap Edge Function (`supabase/functions/apply-plan-swap/index.ts`)
**Purpose**: Executes plan modifications when users confirm changes

**Key Features**:
- **Plan Updates**: Modifies user's active plan with new meals/workouts
- **History Tracking**: Maintains swap timestamps and original data
- **Validation**: Ensures plan integrity and user permissions
- **Error Handling**: Graceful failure with rollback capabilities

**Workflow**:
```
User Request → Coach Glow (Suggestion) → User Approval → Apply Plan Swap (Execution)
```

#### 3. Database Schema (`database/migration_add_coach_glow_chats.sql`)
**Table**: `coach_glow_chats`

**Structure**:
```sql
CREATE TABLE coach_glow_chats (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_message TEXT NOT NULL,
  coach_response TEXT NOT NULL,
  intent TEXT NOT NULL, -- 'motivation', 'plan_swap', 'general'
  context JSONB,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
);
```

**Security Features**:
- Row Level Security (RLS) enabled
- Users can only access their own chat logs
- Input validation and sanitization
- Secure API key management

### Frontend Components

#### 1. Coach Glow Service (`utils/coachGlowService.ts`)
**Purpose**: Service layer for backend communication

**Key Functions**:
- `sendMessageToCoachGlow()` - Send messages to AI assistant
- `applyPlanSwap()` - Apply confirmed plan changes
- `getCoachGlowChatHistory()` - Retrieve chat history (last 30 days)
- `getCoachGlowChatHistoryByIntent()` - Filter by intent type

#### 2. Coach Glow Hooks (`utils/useCoachGlow.ts`)
**Purpose**: React hooks for easy integration

**Available Hooks**:
- `useCoachGlow()` - General purpose hook
- `useCoachGlowMotivation()` - Motivation-specific functionality
- `useCoachGlowPlanSwaps()` - Plan modification functionality
- `useCoachGlowGeneral()` - General queries functionality

#### 3. Coach Glow Chat Component (`components/CoachGlowChat.tsx`)
**Purpose**: Full-featured chat interface

**Features**:
- Modal-based chat interface
- Message history display
- Typing indicators and loading states
- Action buttons for plan modifications
- Error handling with user-friendly messages

#### 4. Coach Glow Button Component (`components/CoachGlowButton.tsx`)
**Purpose**: Flexible button component for various use cases

**Variants**:
- **Floating**: Always-available access button
- **Inline**: Integrated into content sections
- **Motivation**: Pre-configured for encouragement
- **Plan Swap**: Pre-configured for modifications

## 🔒 Security Implementation

### Row Level Security (RLS)
```sql
-- Users can only access their own chat logs
CREATE POLICY "Users can view own chat logs" ON coach_glow_chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat logs" ON coach_glow_chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Input Validation
- All user inputs are validated and sanitized
- SQL injection prevention through parameterized queries
- XSS protection through proper escaping

### API Security
- Service role key used for backend operations
- User authentication required for all operations
- Rate limiting and abuse prevention

### Data Privacy
- Minimal context extraction (only necessary data)
- No unnecessary data sharing with AI
- User consent for data usage
- Transparent data handling

## 🚀 Usage Examples

### Basic Integration
```tsx
import { CoachGlowFloatingButton } from '../components';

// Simple floating button
<CoachGlowFloatingButton mode="general" position="bottom-right" />
```

### Motivation Integration
```tsx
import { CoachGlowMotivationButton } from '../components';

<CoachGlowMotivationButton
  variant="inline"
  size="large"
  initialMessage="I'm feeling unmotivated today"
/>
```

### Plan Swap Integration
```tsx
import { CoachGlowPlanSwapButton } from '../components';

<CoachGlowPlanSwapButton
  variant="inline"
  size="medium"
  context={{
    currentDay: 'Monday',
    mealType: 'breakfast'
  }}
  initialMessage="I want to change my breakfast"
/>
```

### Using Hooks
```tsx
import { useCoachGlow } from '../utils';

const MyComponent = () => {
  const coach = useCoachGlow({ userId: user?.id || '' });
  
  const handleSendMessage = async () => {
    await coach.sendMessage("I need motivation!");
  };
  
  return (
    <TouchableOpacity onPress={handleSendMessage}>
      <Text>Ask Coach Glow</Text>
    </TouchableOpacity>
  );
};
```

## 📊 API Endpoints

### Coach Glow Chat
- **URL**: `/functions/v1/coach-glow`
- **Method**: POST
- **Body**: `{ userId, message, context? }`
- **Response**: `{ success, response, intent, action_required? }`

### Apply Plan Swap
- **URL**: `/functions/v1/apply-plan-swap`
- **Method**: POST
- **Body**: `{ userId, swapType, day, mealType?, newContent }`
- **Response**: `{ success, message }`

## 🔧 Deployment

### 1. Deploy Edge Functions
```bash
supabase functions deploy coach-glow
supabase functions deploy apply-plan-swap
```

### 2. Run Database Migration
```bash
supabase db push --file database/migration_add_coach_glow_chats.sql
```

### 3. Fix Security Issue (Important!)
```bash
supabase db push --file database/migration_remove_coach_glow_view.sql
```

### 4. Set Environment Variables
```bash
supabase secrets set GEMINI_API_KEY=your_api_key_here
```

## 🎯 Integration Points

### Home Screen
- Floating Coach Glow button for quick access
- Motivation sections for encouragement
- Context-aware suggestions for current meals

### Plan Screen
- Enhanced meal/workout cards with swap options
- Quick help buttons for common questions
- Plan-specific guidance and tips

### Progress Screen
- Streak celebration and motivation
- Progress insights and improvement tips
- Achievement recognition and next-level goals

## 📈 Performance Optimizations

### Context Optimization
- Only necessary data passed to reduce API costs
- Efficient database queries with proper indexing
- Caching for frequently accessed data

### Response Time Tracking
- Monitors and optimizes response times
- Performance metrics collection
- Error rate monitoring

## 🛠️ Error Handling

### Comprehensive Error Handling
- Network failures with retry logic
- Invalid user data validation
- Plan modification conflicts
- API rate limiting
- Graceful degradation for non-critical features

### User-Friendly Error Messages
- Clear error descriptions
- Actionable error recovery
- Fallback options when possible

## 📋 Monitoring & Analytics

### Chat Analytics
- Message frequency and patterns
- Intent distribution analysis
- Response time monitoring
- User engagement metrics

### Performance Metrics
- API response times
- Error rates and types
- User satisfaction indicators
- Feature usage statistics

## 🔄 Workflow Examples

### Motivation Request
```
1. User: "I'm feeling unmotivated"
2. Coach Glow: Detects motivation intent
3. Extracts: User profile + streak data + progress
4. Generates: Empathetic, actionable response
5. Logs: Interaction for future personalization
```

### Plan Swap Request
```
1. User: "Change my breakfast"
2. Coach Glow: Detects plan_swap intent
3. Extracts: User profile + current breakfast + dietary constraints
4. Generates: Alternative breakfast suggestion
5. Returns: Suggestion with action_required flag
6. User: Clicks "Apply Change"
7. Apply Plan Swap: Updates database with new meal
```

### General Query
```
1. User: "What are good pre-workout snacks?"
2. Coach Glow: Detects general intent
3. Extracts: User profile only
4. Generates: Personalized nutrition advice
5. Logs: Interaction for analytics
```

## 🎉 Key Benefits

### For Users
- **Personalized Support**: AI coach that understands their goals
- **Easy Plan Modifications**: Simple meal and workout swaps
- **Motivation When Needed**: Encouragement during difficult times
- **Expert Advice**: Access to fitness and nutrition knowledge

### For Your App
- **Increased Engagement**: Users interact more with the app
- **Higher Retention**: AI support keeps users coming back
- **Reduced Support Load**: AI handles common questions
- **Competitive Advantage**: Unique AI fitness companion feature

## 🚨 Important Security Notes

### Fixed Security Issue
- **Problem**: `recent_coach_glow_chats` view was publicly accessible
- **Solution**: Removed the view, use main table with filtering
- **Migration**: `migration_remove_coach_glow_view.sql`

### Current Security Status
- ✅ All data protected by RLS
- ✅ Users can only access their own data
- ✅ Input validation and sanitization
- ✅ Secure API key management
- ✅ No public data exposure

## 📝 Quick Start

1. **Deploy the functions**:
   ```bash
   supabase functions deploy coach-glow
   supabase functions deploy apply-plan-swap
   ```

2. **Run migrations**:
   ```bash
   supabase db push --file database/migration_add_coach_glow_chats.sql
   supabase db push --file database/migration_remove_coach_glow_view.sql
   ```

3. **Set environment variables**:
   ```bash
   supabase secrets set GEMINI_API_KEY=your_api_key_here
   ```

4. **Import components in your screen**:
   ```tsx
   import { CoachGlowFloatingButton } from '../components';
   ```

5. **Add to your JSX**:
   ```tsx
   <CoachGlowFloatingButton mode="general" />
   ```

---

## 🏆 Summary

Coach Glow is now fully implemented as a secure, performant, and user-friendly AI fitness assistant. The system provides personalized motivation, easy plan modifications, and expert fitness advice while maintaining the highest security standards and optimal performance.

**Your users now have their very own AI fitness coach! 🎉**
