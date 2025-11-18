# Colores - Spanish Color Learning App

An elegant, ML-powered web application for learning Spanish color vocabulary through immersive, image-based experiences.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)

## ✨ Features

### 🎨 Complete Learning Experience
- **Two Learning Levels**: Basic (12 colors) and Expanded (24+ colors with variations)
- **AI-Powered Annotations**: Claude Sonnet 4.5 generates contextual Spanish descriptions
- **Beautiful Imagery**: High-quality images from Unsplash showcase colors in real-world contexts
- **Interactive Learning Sessions**: Progress through colors with visual flashcards
- **Audio Pronunciation**: Text-to-speech for proper Spanish pronunciation

### 🧠 Smart Learning System
- **Spaced Repetition**: SM-2 algorithm for optimal review scheduling
- **Mastery Tracking**: Individual progress for each color (0-100%)
- **Adaptive Scheduling**: Review intervals adapt based on performance
- **Streak Tracking**: Maintain daily learning streaks

### 📝 Interactive Quizzes
- **Multiple Question Types**:
  - Image-to-text: "¿Qué color ves en esta imagen?"
  - Text-to-image: "¿Cuál imagen muestra este color?"
  - Phrase-match: Fill in the blank with color names
- **Immediate Feedback**: Learn from mistakes with contextual explanations
- **Score Tracking**: Monitor quiz performance over time

### 📊 Progress Dashboard
- **Mastery Levels**: Track basic and expanded vocabulary separately
- **Learning Statistics**: Sessions completed, quizzes taken, average scores
- **Achievement System**: Unlock badges for milestones
- **Weak/Strong Analysis**: Identify colors needing more practice

### 👨‍💼 Admin Panel
- **Annotation Review**: Review and approve ML-generated content
- **Quality Control**: Confidence scoring for AI annotations
- **Analytics Dashboard**: System health and content statistics
- **Bulk Actions**: Approve, reject, or edit annotations

## 🏗️ Tech Stack

### Frontend
- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Tailwind CSS** + Shadcn UI for styling
- **Framer Motion** for smooth animations
- **Zustand** for state management

### Backend & Services
- **Supabase**: PostgreSQL database, authentication, Row Level Security
- **Anthropic Claude Sonnet 4.5**: ML-powered image annotation with Vision API
- **Unsplash API**: High-quality, curated color imagery
- **Vercel**: Edge functions, CDN, and hosting
- **Railway**: Background workers for async ML processing

### Architecture Highlights
- **SPARC Methodology**: Properly specified, designed, and architected
- **Server Components**: Optimal data fetching with React Server Components
- **API Routes**: RESTful API design with Next.js Route Handlers
- **Real-time Updates**: Supabase Realtime for live data
- **Edge Optimization**: Vercel Edge Functions for image optimization

## 📁 Project Structure

```
colores/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Landing page
│   ├── learn/                   # Learning interface
│   │   ├── page.tsx            # Level selection
│   │   └── [level]/            # Learning session
│   ├── quiz/                    # Quiz system
│   │   ├── page.tsx            # Quiz setup
│   │   └── [quizId]/           # Active quiz
│   ├── progress/                # Progress dashboard
│   ├── admin/                   # Admin panel
│   │   ├── annotations/        # Annotation review
│   │   └── analytics/          # Analytics dashboard
│   └── api/                     # API routes
│       ├── colors/             # Color data
│       ├── images/             # Image management
│       ├── quiz/               # Quiz generation
│       └── admin/              # Admin operations
│
├── components/                   # React components
│   ├── ui/                      # Shadcn UI primitives
│   ├── learning/                # Learning components
│   │   ├── ColorCard.tsx
│   │   └── ProgressIndicator.tsx
│   └── quiz/                    # Quiz components
│
├── lib/                         # Core libraries
│   ├── supabase/               # Database clients
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client
│   │   └── middleware.ts       # Auth middleware
│   ├── ai/                      # AI integration
│   │   └── claude.ts           # Claude API
│   ├── unsplash/               # Image service
│   │   ├── client.ts           # API client
│   │   └── cache.ts            # Caching layer
│   ├── learning/               # Learning algorithms
│   │   ├── spaced-repetition.ts
│   │   └── quiz-generator.ts
│   └── utils/                   # Utilities
│       ├── colors.ts           # Color helpers
│       └── validation.ts       # Input validation
│
├── workers/                     # Background jobs
│   └── annotation-processor.ts  # ML worker (Railway)
│
├── supabase/                    # Database
│   ├── migrations/             # Schema migrations
│   └── seed.sql                # Initial data (36 colors)
│
├── types/                       # TypeScript definitions
│   ├── database.ts             # Database types
│   ├── api.ts                  # API types
│   └── supabase.ts             # Generated types
│
└── public/                      # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Anthropic API key
- Unsplash API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/colores.git
cd colores
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic Claude
ANTHROPIC_API_KEY=your-anthropic-key

# Unsplash
UNSPLASH_ACCESS_KEY=your-access-key
UNSPLASH_SECRET_KEY=your-secret-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Set up Supabase database**

Run the migration in Supabase SQL Editor:
```sql
-- Copy and paste from: supabase/migrations/001_initial_schema.sql
```

Seed the database:
```sql
-- Copy and paste from: supabase/seed.sql
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

6. **Run the background worker (optional)**
```bash
# In a separate terminal
npm run worker
```

## 📚 Key Features Explained

### ML-Powered Annotation Workflow

1. **Image Fetching**: Images are fetched from Unsplash based on color queries
2. **Queue System**: Images are added to annotation queue
3. **Background Processing**: Railway worker processes queue using Claude Vision
4. **AI Analysis**: Claude generates:
   - Spanish descriptions (basic & expanded)
   - Contextual example phrases
   - Color analysis and confidence scores
5. **Admin Review**: Annotations reviewed and approved before use
6. **Learning Ready**: Approved content becomes available for learners

### Spaced Repetition Algorithm

Based on SuperMemo 2 (SM-2):
- **Dynamic Intervals**: 1 day → 3 days → 1 week → 2 weeks → 1 month
- **Mastery-Based**: Review frequency adapts to mastery level (0-100%)
- **Performance Tracking**: Success rate influences scheduling
- **Priority System**: Overdue and weak items prioritized

### Quiz System

Three intelligent question types:
1. **Image Recognition**: Identify color from image
2. **Visual Matching**: Match color name to image
3. **Contextual Usage**: Complete phrases with correct color

All questions generated dynamically from approved annotations.

## 🗄️ Database Schema

### Core Tables

- **colors** (36 seeded colors)
  - 12 basic: rojo, azul, amarillo, verde, etc.
  - 24+ expanded: turquesa, coral, lavanda, etc.

- **images** (Unsplash cache)
  - Photographer attribution
  - Color associations
  - Approval status

- **annotations** (ML-generated content)
  - Spanish descriptions (2 levels)
  - Example phrases
  - Confidence scores
  - Validation status

- **user_progress** (Learning tracking)
  - Mastery levels per color
  - Review scheduling
  - Performance history

- **quiz_sessions** (Quiz history)
  - Questions and answers
  - Scores and completion

## 🔧 API Routes

### Public Endpoints

```
GET  /api/colors?level={basic|expanded}    # Get colors by level
POST /api/images/fetch                      # Fetch images for color
POST /api/quiz/generate                     # Generate new quiz
GET  /api/quiz/[quizId]                    # Get quiz data
POST /api/quiz/[quizId]/answer             # Submit answer
```

### Admin Endpoints

```
GET  /api/admin/annotations/pending         # Get pending annotations
POST /api/admin/annotations/review          # Approve/reject annotations
```

## 📦 Deployment

### Vercel (Frontend + API)

1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically on push

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Railway (Background Worker)

1. Create new project
2. Connect repository
3. Set start command: `npm run worker`
4. Add environment variables

### Supabase (Database)

1. Create project
2. Run migrations in SQL Editor
3. Seed initial data
4. Configure Row Level Security

## 🔒 Security

- **Row Level Security**: All tables protected with RLS policies
- **Authentication**: Supabase Auth with email/password
- **API Validation**: Input sanitization and type checking
- **Environment Variables**: Secrets never committed to git
- **Rate Limiting**: Prevents API abuse

## 🧪 Development

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run worker   # Run background worker
```

### Code Quality

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Git hooks for pre-commit checks

## 📖 Documentation

- [SPARC-SPECIFICATION.md](SPARC-SPECIFICATION.md) - Requirements & design
- [SPARC-PSEUDOCODE.md](SPARC-PSEUDOCODE.md) - Algorithm logic
- [SPARC-ARCHITECTURE.md](SPARC-ARCHITECTURE.md) - System design
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [SETUP-PR.md](SETUP-PR.md) - Repository setup

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Unsplash**: Beautiful, free imagery
- **Anthropic**: Claude AI for intelligent annotations
- **Supabase**: Backend infrastructure
- **Vercel**: Hosting and deployment
- **Railway**: Background job processing

## 📧 Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation
- Review deployment guides

---

**Built with ❤️ using SPARC methodology and modern web technologies.**

**Ready for production deployment!** 🚀
