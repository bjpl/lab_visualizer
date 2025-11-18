# LAB Visualizer

Interactive data visualization and analytics platform built with Next.js 14, TypeScript, and Supabase.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Testing**: Vitest + Playwright
- **Code Quality**: ESLint + Prettier

## Quick Start

### Prerequisites

- Node.js 18.17.0 or higher
- npm 9.0.0 or higher

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Configure Supabase credentials in .env.local
# NEXT_PUBLIC_SUPABASE_URL=your-project-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm run test

# Run E2E tests
npm run test:e2e

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## Project Structure

```
lab_visualizer/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Home page
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   ├── lib/                # Utility libraries
│   │   └── supabase/       # Supabase clients
│   ├── types/              # TypeScript types
│   ├── config/             # App configuration
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand stores
│   └── tests/              # Test files
│       ├── setup.ts        # Test setup
│       └── e2e/            # E2E tests
├── docs/                   # Documentation
├── public/                 # Static assets
└── config files           # ESLint, Prettier, etc.
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run unit tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Generate coverage report
- `npm run test:e2e` - Run E2E tests
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler
- `npm run format` - Format code with Prettier

## Code Quality Standards

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **Testing**: 80% coverage threshold for all code
- **Performance**: Performance budgets enforced in Next.js config
- **Security**: Security headers and best practices implemented

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and best practices.

## Documentation

- [Local Development Setup](docs/setup/local-development.md)
- [Architecture Decisions](docs/architecture/)
- [Testing Guide](docs/testing/)

## License

Proprietary - All rights reserved
