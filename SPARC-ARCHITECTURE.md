# SPARC Architecture - System Design

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                            │
│  Next.js 14 (App Router) + React 18 + Tailwind + Shadcn UI    │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
┌───────────────────▼─────┐    ┌─────────────▼──────────────┐
│   Vercel Edge Functions  │    │  Next.js API Routes        │
│   - Image optimization   │    │  - Auth middleware         │
│   - CDN caching         │    │  - API proxies             │
└───────────────────┬─────┘    └─────────────┬──────────────┘
                    │                         │
        ┌───────────┴─────────────────────────┴────────┐
        │                                               │
┌───────▼──────────┐  ┌──────────────┐  ┌─────────────▼─────┐
│ Supabase         │  │  Unsplash    │  │  Anthropic Claude │
│ - PostgreSQL     │  │  API         │  │  Sonnet 4.5       │
│ - Auth           │  │              │  │                   │
│ - Storage        │  │              │  │                   │
│ - Realtime       │  │              │  │                   │
└───────┬──────────┘  └──────────────┘  └─────────────┬─────┘
        │                                              │
        │           ┌──────────────────────────────────┘
        │           │
┌───────▼───────────▼─────┐
│   Railway Services       │
│   - Background workers   │
│   - ML processing queue  │
│   - Scheduled jobs       │
└─────────────────────────┘
```

## Directory Structure

```
colores/
├── .env.local.example
├── .env.production
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── README.md
│
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   │
│   ├── (auth)/                  # Auth group
│   │   ├── login/
│   │   └── register/
│   │
│   ├── learn/                   # Learning interface
│   │   ├── page.tsx            # Level selection
│   │   ├── [level]/            # Basic/Expanded routes
│   │   │   ├── page.tsx
│   │   │   └── [colorId]/
│   │   │       └── page.tsx
│   │   └── session/
│   │       └── [sessionId]/
│   │           └── page.tsx
│   │
│   ├── quiz/                    # Quiz interface
│   │   ├── page.tsx
│   │   └── [quizId]/
│   │       └── page.tsx
│   │
│   ├── progress/                # Progress dashboard
│   │   └── page.tsx
│   │
│   ├── admin/                   # Admin panel
│   │   ├── layout.tsx
│   │   ├── annotations/
│   │   ├── images/
│   │   └── analytics/
│   │
│   └── api/                     # API Routes
│       ├── annotations/
│       │   ├── create/
│       │   └── review/
│       ├── images/
│       │   ├── fetch/
│       │   └── annotate/
│       ├── quiz/
│       │   ├── generate/
│       │   └── evaluate/
│       ├── progress/
│       └── webhooks/
│           └── unsplash/
│
├── components/                   # React components
│   ├── ui/                      # Shadcn UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   │
│   ├── learning/
│   │   ├── ColorCard.tsx
│   │   ├── ImageGallery.tsx
│   │   ├── AnnotationDisplay.tsx
│   │   └── ProgressIndicator.tsx
│   │
│   ├── quiz/
│   │   ├── QuestionCard.tsx
│   │   ├── AnswerOptions.tsx
│   │   └── ResultsFeedback.tsx
│   │
│   └── admin/
│       ├── AnnotationReviewer.tsx
│       ├── ImageManager.tsx
│       └── AnalyticsDashboard.tsx
│
├── lib/                         # Utility libraries
│   ├── supabase/
│   │   ├── client.ts           # Supabase client
│   │   ├── server.ts           # Server-side client
│   │   └── middleware.ts       # Auth middleware
│   │
│   ├── ai/
│   │   ├── claude.ts           # Claude API client
│   │   ├── annotate.ts         # Annotation logic
│   │   └── prompts.ts          # Prompt templates
│   │
│   ├── unsplash/
│   │   ├── client.ts
│   │   └── cache.ts
│   │
│   ├── learning/
│   │   ├── spaced-repetition.ts
│   │   ├── mastery.ts
│   │   └── quiz-generator.ts
│   │
│   └── utils/
│       ├── colors.ts
│       ├── validation.ts
│       └── format.ts
│
├── types/                       # TypeScript types
│   ├── database.ts             # Supabase generated types
│   ├── api.ts
│   ├── learning.ts
│   └── annotations.ts
│
├── hooks/                       # React hooks
│   ├── useColorData.ts
│   ├── useProgress.ts
│   ├── useQuiz.ts
│   └── useAnnotations.ts
│
├── supabase/                    # Supabase configuration
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_rls_policies.sql
│   │   └── 003_create_functions.sql
│   ├── seed.sql
│   └── config.toml
│
├── workers/                     # Background workers (Railway)
│   ├── annotation-processor.ts
│   ├── image-fetcher.ts
│   └── scheduler.ts
│
└── public/                      # Static assets
    ├── audio/                  # Pronunciation files
    ├── icons/
    └── images/
```

## Data Flow Diagrams

### 1. Image Fetching & Annotation Flow

```
User requests color → Next.js API → Check Supabase cache
                                           │
                                 ┌─────────┴──────────┐
                                 │                    │
                            Cache Hit           Cache Miss
                                 │                    │
                          Return images        Fetch Unsplash API
                                                      │
                                               Save to Supabase
                                                      │
                                            Queue for annotation
                                                      │
                                    Railway Worker picks up job
                                                      │
                                    Claude analyzes image
                                                      │
                                    Save annotation to DB
                                                      │
                                    Mark for admin review
                                                      │
                                    Admin approves/edits
                                                      │
                                    Available for learning
```

### 2. Learning Session Flow

```
User starts session → Select level (basic/expanded)
                            │
                    Get user progress from Supabase
                            │
                    Calculate next colors (spaced repetition)
                            │
                    Fetch annotated images for colors
                            │
                    Render ColorCard components
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    View image        Hear pronunciation    Mark bookmark
        │                   │                   │
    Claude annotation   Text-to-speech      Save to DB
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                    Complete card review
                            │
                    Update mastery score
                            │
                    Update next review date
                            │
                    Return to session or finish
```

### 3. Quiz Generation & Evaluation Flow

```
User starts quiz → Select level & question count
                         │
                Generate questions (mix of types)
                         │
        ┌────────────────┼────────────────┐
        │                │                │
  Image-to-text   Text-to-image   Phrase-match
        │                │                │
        └────────────────┴────────────────┘
                         │
                  Render question
                         │
                  User answers
                         │
                  Evaluate answer
                         │
          ┌──────────────┴──────────────┐
          │                             │
      Correct                       Incorrect
          │                             │
   +5 mastery                    -3 mastery
   +1 correct count            +1 incorrect count
          │                             │
          └──────────────┬──────────────┘
                         │
                Update next review date
                         │
                  Show feedback
                         │
              Next question or results
```

## Database Schema (Detailed)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  validator_id UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress table
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, image_id)
);

-- Quiz sessions table
CREATE TABLE quiz_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
CREATE INDEX idx_annotations_image ON annotations(image_id);
CREATE INDEX idx_annotations_validated ON annotations(validated);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_next_review ON user_progress(next_review);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX idx_annotation_queue_status ON annotation_queue(status);

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

-- User-specific policies
CREATE POLICY "Users can view their own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own bookmarks" ON bookmarks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own sessions" ON quiz_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own learning sessions" ON learning_sessions FOR ALL USING (auth.uid() = user_id);
```

## API Architecture

### REST API Endpoints

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/user

GET    /api/colors                    # List all colors
GET    /api/colors/:id                # Get color details
GET    /api/colors/:id/images         # Get images for color

POST   /api/images/fetch              # Fetch new images from Unsplash
GET    /api/images/:id                # Get image details
POST   /api/images/:id/bookmark       # Bookmark image

POST   /api/annotations/create        # Create annotation (admin)
GET    /api/annotations/pending       # Get pending annotations (admin)
PUT    /api/annotations/:id/review    # Review annotation (admin)

POST   /api/learning/session          # Start learning session
PUT    /api/learning/session/:id      # Update session
GET    /api/learning/next-cards       # Get next cards to review

POST   /api/quiz/generate             # Generate quiz
POST   /api/quiz/:id/answer           # Submit answer
GET    /api/quiz/:id/results          # Get quiz results

GET    /api/progress                  # Get user progress
GET    /api/progress/stats            # Get learning statistics

POST   /api/webhooks/unsplash         # Unsplash webhook handler
```

## Component Architecture

### Key Component Patterns

```typescript
// ColorCard Component
interface ColorCardProps {
  color: Color;
  image: AnnotatedImage;
  annotation: Annotation;
  onComplete: (mastery: number) => void;
  showAudio?: boolean;
}

// ImageGallery Component
interface ImageGalleryProps {
  images: AnnotatedImage[];
  colorFilter?: string;
  layout: 'grid' | 'masonry' | 'carousel';
  onImageSelect: (image: AnnotatedImage) => void;
}

// AnnotationReviewer Component
interface AnnotationReviewerProps {
  annotation: PendingAnnotation;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onEdit: (id: string, updates: Partial<Annotation>) => void;
}

// QuizQuestion Component
interface QuizQuestionProps {
  question: QuizQuestion;
  onAnswer: (answerId: string) => void;
  showFeedback: boolean;
}
```

## State Management

Using React Context + Zustand for optimal performance:

```typescript
// Auth Store
interface AuthStore {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Learning Store
interface LearningStore {
  currentSession: LearningSession | null;
  currentCard: ColorCard | null;
  progress: UserProgress[];
  startSession: (level: Level) => Promise<void>;
  completeCard: (cardId: string, mastery: number) => void;
  fetchProgress: () => Promise<void>;
}

// Quiz Store
interface QuizStore {
  currentQuiz: Quiz | null;
  currentQuestion: number;
  answers: Answer[];
  generateQuiz: (level: Level, count: number) => Promise<void>;
  submitAnswer: (answer: Answer) => void;
  getResults: () => QuizResults;
}
```

## Security Architecture

### Authentication Flow
- Supabase Auth with email/password and magic links
- JWT tokens for API authentication
- Refresh token rotation
- RLS policies for data access control

### API Security
- Rate limiting on all endpoints
- CORS configuration
- API key validation for external services
- Input validation and sanitization

### Data Privacy
- User data encryption at rest
- HTTPS only
- Secure cookie settings
- No PII in logs or analytics

## Performance Optimization

### Caching Strategy
- Next.js static generation for color pages
- Supabase edge caching for images
- React Query for client-side caching
- Unsplash image CDN caching

### Image Optimization
- Next.js Image component with automatic optimization
- Responsive images with srcset
- Lazy loading below the fold
- WebP format with fallbacks

### Code Splitting
- Route-based code splitting
- Dynamic imports for heavy components
- Tree shaking for unused code

---

This architecture provides a solid foundation for building the application. Next step is implementation!
