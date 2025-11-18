# Local Development Setup

## Prerequisites

Before starting, ensure you have:

- **Node.js** 18.17.0 or higher
- **npm** 9.0.0 or higher
- A **Supabase** account and project

## Initial Setup

### 1. Clone and Install

```bash
# Navigate to project directory
cd lab_visualizer

# Install dependencies
npm install
```

### 2. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Getting Supabase Credentials:**

1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Navigate to Settings > API
4. Copy the Project URL and anon/public key

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Workflow

### Running Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Code Quality

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check
```

### Building for Production

```bash
# Create production build
npm run build

# Test production build locally
npm run start
```

## IDE Setup

### VS Code

Recommended extensions:

- ESLint
- Prettier - Code formatter
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features

Settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Common Issues

### Port Already in Use

If port 3000 is already in use:

```bash
# Use a different port
PORT=3001 npm run dev
```

### Module Not Found Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Supabase Connection Issues

1. Verify your environment variables are correct
2. Check your Supabase project is running
3. Ensure your IP is not blocked (check Supabase dashboard)

## Database Setup

Once your Supabase project is ready:

```bash
# Generate TypeScript types from your schema
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

## Next Steps

- Review [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines
- Check the [Architecture Documentation](../architecture/)
- Explore the [Testing Guide](../testing/)
