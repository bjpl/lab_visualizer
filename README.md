# LAB Visualizer

Interactive data visualization and analytics platform built with Next.js 14, TypeScript, and Supabase.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Testing**: Vitest + Playwright (80% coverage threshold)
- **Code Quality**: ESLint + Prettier

## Technical Overview

This project demonstrates modern Next.js application architecture with App Router, comprehensive testing infrastructure, and strict TypeScript configuration. The implementation includes performance budgets, security headers, and enforced code quality standards.

**Key Features:**
- Server and client component architecture
- Type-safe database integration with Supabase
- End-to-end testing with Playwright
- 80% code coverage requirement
- Performance monitoring and optimization

## Exploring the Code

<details>
<summary>Click to expand</summary>

**Project Structure:**
```
lab_visualizer/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/supabase/     # Supabase client setup
│   ├── types/            # TypeScript type definitions
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # Zustand state stores
│   └── tests/            # Test files (unit + E2E)
├── docs/                 # Architecture documentation
└── public/               # Static assets
```

**For Technical Review:**
- TypeScript strict mode with comprehensive type checking
- Testing setup with 80% coverage threshold enforced
- Performance budgets in Next.js configuration
- Security headers and best practices implementation

**Local Development:**
See `docs/setup/local-development.md` for setup instructions.

</details>

## License

MIT License - See LICENSE file
