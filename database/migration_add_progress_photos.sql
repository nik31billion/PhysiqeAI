-- Migration: Add Progress Photos Table
-- This table stores user progress photos for tracking transformation over time

CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Photo data
  photo_uri TEXT NOT NULL, -- Local URI of the progress photo
  photo_type TEXT DEFAULT 'progress', -- 'progress', 'before', 'after', etc.
  
  -- Metadata
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT, -- Optional user notes about the photo
  
  -- Photo properties (for future AI analysis)
  weight_kg DECIMAL(5,2), -- Weight at time of photo (optional)
  body_fat_percentage DECIMAL(4,2), -- Body fat % (optional)
  
  -- Privacy and sharing
  is_private BOOLEAN DEFAULT TRUE, -- Whether photo is private
  allow_comparison BOOLEAN DEFAULT TRUE, -- Whether to use in before/after comparisons
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can only access their own progress photos
CREATE POLICY "Users can view own progress photos" ON progress_photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress photos" ON progress_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress photos" ON progress_photos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress photos" ON progress_photos
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_progress_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_progress_photos_updated_at
  BEFORE UPDATE ON progress_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_progress_photos_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_progress_photos_user_id ON progress_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_taken_at ON progress_photos(user_id, taken_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_photos_type ON progress_photos(user_id, photo_type);
CREATE INDEX IF NOT EXISTS idx_progress_photos_created_at ON progress_photos(created_at);

-- Add comment for documentation
COMMENT ON TABLE progress_photos IS 'Stores user progress photos for transformation tracking and before/after comparisons';
COMMENT ON COLUMN progress_photos.photo_uri IS 'Local URI of the progress photo (stored locally, not uploaded to server)';
COMMENT ON COLUMN progress_photos.photo_type IS 'Type of photo: progress, before, after, etc.';
COMMENT ON COLUMN progress_photos.taken_at IS 'When the photo was taken (user can set this)';
COMMENT ON COLUMN progress_photos.allow_comparison IS 'Whether this photo can be used in before/after comparisons';
