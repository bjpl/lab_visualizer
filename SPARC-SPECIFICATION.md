# SPARC Methodology - Colores Spanish Learning App

## S - SPECIFICATION

### Project Vision
An elegant, visually sophisticated web application for learning Spanish color vocabulary through immersive image-based experiences with ML-powered annotation capabilities.

### Core Requirements

#### 1. Learning Levels
- **Basic Level**: Core color vocabulary (10-12 primary colors)
  - rojo, azul, amarillo, verde, naranja, morado, rosa, negro, blanco, gris, marrón, celeste
- **Expanded Level**: Extended vocabulary (20+ colors + descriptive phrases)
  - Color variations, shades, patterns, textures
  - Contextual phrases: "un cielo azul brillante", "hojas verdes oscuras"

#### 2. Core Features

##### A. Image-Based Learning
- Unsplash API integration for high-quality, contextual images
- Dynamic image selection based on color queries
- Responsive, elegant image galleries
- Image caching and optimization

##### B. ML-Powered Annotation Workflow
- Real-time image annotation using Claude Sonnet 4.5
- Automatic detection of colors in images
- Generation of Spanish descriptions and phrases
- Contextual vocabulary suggestions
- Annotation validation and refinement

##### C. Interactive Learning Experience
- Visual flashcards with authentic imagery
- Interactive quizzes and matching games
- Progress tracking and spaced repetition
- Audio pronunciation (text-to-speech)
- Bookmark and favorite functionality

##### D. Content Management
- Admin interface for curating content
- Annotation review and approval workflow
- Content versioning and updates
- Analytics dashboard

### Technical Stack

#### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + Shadcn UI
- **Animations**: Framer Motion
- **State Management**: Zustand or React Context
- **Image Optimization**: Next.js Image component

#### Backend & Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for cached images)
- **Hosting**: Vercel (frontend + API routes)
- **Background Jobs**: Railway (for ML processing)
- **AI**: Anthropic Claude Sonnet 4.5 API

#### External Services
- **Images**: Unsplash API
- **AI Annotations**: Claude API
- **Analytics**: Vercel Analytics

### Database Schema (High-Level)

```sql
-- Colors table
colors (
  id, name_es, name_en, hex_code, rgb, level (basic/expanded),
  category, created_at, updated_at
)

-- Images table
images (
  id, unsplash_id, url, photographer, colors[],
  primary_color_id, annotations, status, created_at
)

-- Annotations table
annotations (
  id, image_id, color_id, description_es, phrases[],
  confidence_score, validated, validator_id, created_at
)

-- Learning Progress table
user_progress (
  id, user_id, color_id, image_id, mastery_level,
  last_reviewed, next_review, correct_count, incorrect_count
)

-- User Bookmarks
bookmarks (
  id, user_id, image_id, notes, created_at
)
```

### User Stories

1. **As a learner**, I want to see beautiful, contextual images for each color so I can associate vocabulary with real-world examples.

2. **As a learner**, I want to progress from basic to expanded vocabulary naturally so I build confidence before advancing.

3. **As a learner**, I want ML-generated descriptions and phrases so I learn colors in context, not isolation.

4. **As a content curator**, I want to review and approve ML annotations so content quality remains high.

5. **As a learner**, I want to track my progress so I can see my improvement over time.

### Success Metrics
- Annotation accuracy > 90%
- Image load time < 2s
- User engagement (session duration > 5 min)
- Vocabulary retention (quiz scores)
- Content freshness (new images weekly)

### Design Principles
1. **Visual Elegance**: Clean, modern UI with focus on imagery
2. **Progressive Enhancement**: Works without JS, enhanced with it
3. **Performance**: Fast loading, optimized images, efficient caching
4. **Accessibility**: WCAG 2.1 AA compliance, keyboard navigation
5. **Mobile-First**: Responsive design, touch-friendly interactions

### Out of Scope (v1)
- Video content
- Community features (comments, sharing)
- Native mobile apps
- Multiple language pairs (focus on Spanish only)
- Advanced grammar lessons

---

## Next Steps
1. Create detailed pseudocode for core workflows
2. Design system architecture and data flows
3. Implement MVP features iteratively
4. Refine based on testing and feedback
