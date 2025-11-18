-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Colors table
CREATE TABLE colors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_es VARCHAR(50) NOT NULL,
  name_en VARCHAR(50) NOT NULL,
  hex_code VARCHAR(7) NOT NULL,
  rgb_r INTEGER NOT NULL CHECK (rgb_r >= 0 AND rgb_r <= 255),
  rgb_g INTEGER NOT NULL CHECK (rgb_g >= 0 AND rgb_g <= 255),
  rgb_b INTEGER NOT NULL CHECK (rgb_b >= 0 AND rgb_b <= 255),
  level VARCHAR(20) NOT NULL CHECK (level IN ('basic', 'expanded')),
  category VARCHAR(50),
  description_short TEXT,
  pronunciation_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Images table
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unsplash_id VARCHAR(50) UNIQUE NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  photographer VARCHAR(100),
  photographer_url TEXT,
  primary_color_id UUID REFERENCES colors(id),
  detected_colors UUID[] DEFAULT ARRAY[]::UUID[],
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'annotated', 'approved', 'rejected')),
  download_location TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Annotations table
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  color_id UUID REFERENCES colors(id),
  description_basic TEXT,
  description_expanded TEXT,
  phrases TEXT[] DEFAULT ARRAY[]::TEXT[],
  confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  validated BOOLEAN DEFAULT FALSE,
  validated_at TIMESTAMPTZ,
  validator_id UUID,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress table
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  color_id UUID REFERENCES colors(id) ON DELETE CASCADE,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  last_reviewed TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, color_id)
);

-- Bookmarks table
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, image_id)
);

-- Quiz sessions table
CREATE TABLE quiz_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  level VARCHAR(20) NOT NULL,
  questions JSONB NOT NULL,
  answers JSONB DEFAULT '[]',
  score INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Learning sessions table
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  level VARCHAR(20) NOT NULL,
  cards_reviewed INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Annotation queue table (for background processing)
CREATE TABLE annotation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  target_colors UUID[],
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_images_primary_color ON images(primary_color_id);
CREATE INDEX idx_images_status ON images(status);
CREATE INDEX idx_images_unsplash_id ON images(unsplash_id);
CREATE INDEX idx_annotations_image ON annotations(image_id);
CREATE INDEX idx_annotations_validated ON annotations(validated);
CREATE INDEX idx_annotations_color ON annotations(color_id);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_color ON user_progress(color_id);
CREATE INDEX idx_user_progress_next_review ON user_progress(next_review);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX idx_quiz_sessions_user ON quiz_sessions(user_id);
CREATE INDEX idx_learning_sessions_user ON learning_sessions(user_id);
CREATE INDEX idx_annotation_queue_status ON annotation_queue(status);
CREATE INDEX idx_colors_level ON colors(level);

-- Full text search index
CREATE INDEX idx_colors_search ON colors USING GIN (name_es gin_trgm_ops, name_en gin_trgm_ops);

-- Row Level Security (RLS) Policies
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

-- Public read access for colors and approved images
CREATE POLICY "Colors are viewable by everyone" ON colors FOR SELECT USING (true);
CREATE POLICY "Approved images are viewable by everyone" ON images FOR SELECT USING (status = 'approved');
CREATE POLICY "Validated annotations are viewable by everyone" ON annotations FOR SELECT USING (validated = true);

-- User-specific policies for progress
CREATE POLICY "Users can view their own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User-specific policies for bookmarks
CREATE POLICY "Users can view their own bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own bookmarks" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bookmarks" ON bookmarks FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own bookmarks" ON bookmarks FOR UPDATE USING (auth.uid() = user_id);

-- User-specific policies for quiz sessions
CREATE POLICY "Users can view their own quiz sessions" ON quiz_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own quiz sessions" ON quiz_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quiz sessions" ON quiz_sessions FOR UPDATE USING (auth.uid() = user_id);

-- User-specific policies for learning sessions
CREATE POLICY "Users can view their own learning sessions" ON learning_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own learning sessions" ON learning_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own learning sessions" ON learning_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_colors_updated_at BEFORE UPDATE ON colors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_images_updated_at BEFORE UPDATE ON images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_annotations_updated_at BEFORE UPDATE ON annotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
