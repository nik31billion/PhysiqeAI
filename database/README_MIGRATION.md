# Database Migration Instructions

## Adding Missing Onboarding Columns

To fix the "Could not find the 'target_timeline_weeks' column" and other similar errors, you need to run the migration script to add all missing columns to your Supabase database.

### Steps:

1. **Open your Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Migration Script**
   - Copy the contents of `migration_add_physique_columns.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the migration

3. **Verify the Migration**
   - Go to Table Editor
   - Select the `user_profiles` table
   - Verify that the new columns are added:
     - `physique_inspiration`
     - `physique_character_id` 
     - `physique_uploaded_image`
     - `physique_category`
     - `target_timeline_weeks`
     - `fitness_obstacles`
     - `meal_frequency`

### Alternative: Use Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db reset
```

This will apply the updated schema from `schema.sql`.

### What This Fixes:

- ✅ Allows saving character selections from OnboardingScreen9
- ✅ Enables storing uploaded custom reference images
- ✅ Supports the new physique inspiration feature
- ✅ Fixes target timeline saving from OnboardingScreen12
- ✅ Fixes fitness obstacles saving from OnboardingScreen16
- ✅ Fixes meal frequency saving from OnboardingScreen15
- ✅ Resolves all PGRST204 errors about missing columns

### Complete Migration SQL:

```sql
-- Add physique inspiration columns
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS physique_inspiration TEXT,
ADD COLUMN IF NOT EXISTS physique_character_id TEXT,
ADD COLUMN IF NOT EXISTS physique_uploaded_image TEXT,
ADD COLUMN IF NOT EXISTS physique_category TEXT;

-- Add missing onboarding columns
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS target_timeline_weeks INTEGER,
ADD COLUMN IF NOT EXISTS fitness_obstacles TEXT[],
ADD COLUMN IF NOT EXISTS meal_frequency TEXT;
```
