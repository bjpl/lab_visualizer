# Colores - Spanish Color Learning App

An elegant, ML-powered web application for learning Spanish color vocabulary through immersive, image-based experiences.

## Features

- **Two Learning Levels**: Basic (12 colors) and Expanded (24+ colors)
- **AI-Powered Annotations**: Claude Sonnet 4.5 generates contextual Spanish descriptions
- **Beautiful Imagery**: High-quality images from Unsplash showcase colors in real-world contexts
- **Spaced Repetition**: Intelligent review scheduling for optimal retention
- **Interactive Quizzes**: Multiple question types to test comprehension
- **Progress Tracking**: Monitor mastery levels and learning streaks
- **Responsive Design**: Works beautifully on mobile, tablet, and desktop

## Tech Stack

### Frontend
- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Tailwind CSS** + Shadcn UI for styling
- **Framer Motion** for animations
- **Zustand** for state management

### Backend & Services
- **Supabase**: PostgreSQL database, authentication, storage
- **Anthropic Claude Sonnet 4.5**: ML-powered image annotation
- **Unsplash API**: High-quality color imagery
- **Vercel**: Frontend hosting and API routes
- **Railway**: Background workers for ML processing

## Project Structure

```
colores/
├── app/                      # Next.js App Router pages
│   ├── api/                 # API routes
│   ├── learn/               # Learning interface
│   ├── quiz/                # Quiz interface
│   ├── progress/            # Progress dashboard
│   └── admin/               # Admin panel
│
├── components/              # React components
│   ├── ui/                 # Shadcn UI components
│   ├── learning/           # Learning-specific components
│   ├── quiz/               # Quiz components
│   └── admin/              # Admin components
│
├── lib/                     # Core libraries
│   ├── supabase/           # Supabase clients
│   ├── ai/                 # Claude AI integration
│   ├── unsplash/           # Unsplash API client
│   ├── learning/           # Learning algorithms
│   └── utils/              # Utility functions
│
├── types/                   # TypeScript definitions
├── supabase/               # Database migrations & seeds
├── workers/                # Background processing workers
└── public/                 # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Anthropic API key
- Unsplash API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/colores.git
cd colores
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic Claude
ANTHROPIC_API_KEY=your-anthropic-api-key

# Unsplash
UNSPLASH_ACCESS_KEY=your-unsplash-access-key
UNSPLASH_SECRET_KEY=your-unsplash-secret-key

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Set up Supabase database:
```bash
# Run migrations in Supabase dashboard or CLI
# File: supabase/migrations/001_initial_schema.sql

# Seed the database
# File: supabase/seed.sql
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Background Worker (Railway)

The annotation processor runs as a background service on Railway:

1. Create a new Railway project
2. Add the following environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`

3. Deploy the worker:
```bash
railway up
```

Or use the worker file directly:
```bash
npm run worker
```

## Database Schema

### Core Tables

- **colors**: Color definitions (basic & expanded levels)
- **images**: Cached Unsplash images
- **annotations**: ML-generated Spanish descriptions
- **user_progress**: Learning progress & mastery levels
- **bookmarks**: User-saved images
- **quiz_sessions**: Quiz history and scores
- **learning_sessions**: Session tracking
- **annotation_queue**: Background processing queue

## SPARC Methodology

This project was designed using the SPARC methodology:

1. **Specification** (`SPARC-SPECIFICATION.md`): Requirements & features
2. **Pseudocode** (`SPARC-PSEUDOCODE.md`): Core algorithm logic
3. **Architecture** (`SPARC-ARCHITECTURE.md`): System design & data flows

## Key Features Explained

### ML-Powered Annotation Workflow

1. Images are fetched from Unsplash based on color queries
2. Images are queued for annotation
3. Background worker processes the queue using Claude Vision API
4. Claude generates:
   - Spanish descriptions (basic & expanded)
   - Contextual phrases
   - Color analysis
5. Annotations are saved and marked for admin review
6. Approved annotations become available for learning

### Spaced Repetition Algorithm

Based on SM-2 (SuperMemo 2):
- Adapts review intervals based on mastery level
- Increases intervals for correct answers
- Resets to daily review for errors
- Considers success rate and performance history

### Quiz Generation

Three question types:
1. **Image-to-text**: "What color is this?"
2. **Text-to-image**: "Which image shows this color?"
3. **Phrase-match**: Fill in the blank with color name

## Deployment

### Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set environment variables in Vercel dashboard.

### Railway (Worker)

Push to Railway or use CLI:
```bash
railway login
railway link
railway up
```

### Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Run migrations via SQL editor
3. Enable Row Level Security (RLS)
4. Configure authentication

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- **Unsplash**: Beautiful, free imagery
- **Anthropic**: Claude AI for intelligent annotations
- **Supabase**: Backend infrastructure
- **Vercel**: Hosting and deployment
- **Railway**: Background job processing

## Support

For issues or questions, please [open an issue](https://github.com/yourusername/colores/issues) on GitHub.

---

Built with ❤️ using SPARC methodology and modern web technologies.
