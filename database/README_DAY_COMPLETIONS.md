# Day Completions Feature Setup

This document explains how to set up the day completions tracking feature for the Flex Aura app.

## 🎯 **What This Feature Does**

- **Tracks daily plan completion** - Users can mark their workout/meal plans as completed
- **Calculates streaks** - Shows current streak and best streak
- **Weekly progress** - Displays completion percentage for the current week
- **Real-time stats** - Updates progress screen with actual completion data

## 🗄️ **Database Setup**

### 1. Run the Migration

Execute the SQL migration file in your Supabase SQL editor:

```sql
-- Run this in Supabase SQL Editor
\i migration_add_day_completions.sql
```

Or copy and paste the contents of `migration_add_day_completions.sql` into the Supabase SQL editor.

### 2. Verify Table Creation

Check that the `day_completions` table was created successfully:

```sql
-- Verify table exists
SELECT * FROM day_completions LIMIT 1;
```

## 📱 **How It Works**

### PlanScreen Features:
1. **Day Completion Button** - Green button to mark today as complete
2. **Completion Badge** - Shows "Completed today!" when day is done
3. **Prevents Duplicates** - Can't complete the same day twice

### ProgressScreen Features:
1. **Real Streak Data** - Shows actual current streak (not hardcoded)
2. **Total Days Completed** - Displays in the glow ring
3. **Weekly Progress** - Shows percentage of days completed this week
4. **Best Streak** - Tracks the longest streak achieved

## 🔧 **Technical Details**

### Database Schema:
```sql
day_completions (
  id: UUID (primary key)
  user_id: UUID (references auth.users)
  plan_id: UUID (references user_plans)
  completed_date: DATE (YYYY-MM-DD)
  completed_at: TIMESTAMP
  is_active: BOOLEAN
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
)
```

### Key Features:
- **Unique constraint** on (user_id, completed_date) - one completion per day
- **Row Level Security** - users can only see their own completions
- **Soft deletes** - uses is_active flag instead of hard deletes
- **Automatic timestamps** - tracks when completions were recorded

## 🚀 **Usage**

### For Users:
1. **Complete daily plans** - Use the green "Mark Day as Complete" button
2. **Track progress** - View streaks and stats in the Progress tab
3. **Stay motivated** - See completion badges and progress indicators

### For Developers:
1. **Fetch completions** - Use the `fetchCompletedDays()` function
2. **Calculate stats** - Use the `calculateStats()` function in ProgressScreen
3. **Add new features** - Extend the completion tracking as needed

## 🎨 **UI Components**

### PlanScreen:
- `completedBadge` - Green badge showing completion status
- `completeDayButton` - Green button to mark completion
- `completionSection` - Container for completion UI

### ProgressScreen:
- `streakDots` - Visual representation of current streak
- `scoreNumber` - Shows total days completed
- `weeklyProgress` - Shows weekly completion percentage

## 🔮 **Future Enhancements**

Potential features to add:
- **Achievement badges** - Unlock badges for milestones
- **Social sharing** - Share streaks and achievements
- **Goal setting** - Set weekly/monthly completion goals
- **Analytics** - Detailed completion patterns and insights
- **Reminders** - Push notifications for incomplete days

## 🐛 **Troubleshooting**

### Common Issues:

1. **"Table doesn't exist" error**
   - Run the migration SQL in Supabase
   - Check table permissions

2. **"Permission denied" error**
   - Verify RLS policies are enabled
   - Check user authentication

3. **Streak calculation wrong**
   - Check date format consistency
   - Verify completion dates are correct

### Debug Commands:
```sql
-- Check completions for a user
SELECT * FROM day_completions WHERE user_id = 'your-user-id';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'day_completions';
```

## 📊 **Data Flow**

1. **User completes plan** → `markDayAsCompleted()` called
2. **Insert into database** → `day_completions` table updated
3. **Local state updated** → UI shows completion badge
4. **Progress screen refreshes** → Stats recalculated
5. **Streak updated** → Visual indicators updated

This creates a complete feedback loop that motivates users to maintain their fitness journey! 🎉
