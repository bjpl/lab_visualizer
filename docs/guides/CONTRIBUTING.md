# Contributing to LAB Visualizer

## Development Guidelines

### Code Style

- Follow TypeScript strict mode requirements
- Use functional components with hooks
- Prefer composition over inheritance
- Keep components small and focused (< 300 lines)
- Use meaningful variable and function names

### TypeScript Guidelines

```typescript
// ✅ Good: Explicit types, type imports
import type { User } from '@/types';

interface Props {
  user: User;
  onUpdate: (user: User) => void;
}

// ✅ Good: Proper error handling
async function fetchData(): Promise<Result<Data, Error>> {
  try {
    const response = await api.getData();
    return { ok: true, value: response };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}

// ❌ Bad: Using 'any'
function processData(data: any) {
  // Don't do this
}
```

### Component Guidelines

```tsx
// ✅ Good: Proper component structure
import type { FC } from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
};
```

### Testing Requirements

1. **Unit Tests**: All utility functions and hooks must have unit tests
2. **Component Tests**: All components must have rendering and interaction tests
3. **E2E Tests**: Critical user flows must have E2E tests
4. **Coverage**: Maintain 80%+ code coverage

```typescript
// Example unit test
import { describe, it, expect } from 'vitest';
import { formatDate } from './utils';

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2024-01-01');
    expect(formatDate(date)).toBe('January 1, 2024');
  });
});

// Example component test
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button label="Click me" onClick={onClick} />);

    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

### Git Workflow

1. Create a feature branch from `main`
2. Make your changes following the guidelines
3. Write/update tests
4. Run `npm run typecheck` and `npm run lint`
5. Run `npm run test` to ensure all tests pass
6. Commit with conventional commit messages
7. Push and create a pull request

### Commit Message Format

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Example:**
```
feat(dashboard): add data filtering component

Implement a reusable filtering component for the dashboard
that supports multiple filter types and operators.

Closes #123
```

### Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Request review from at least one team member
4. Address review comments
5. Squash commits if needed
6. Merge after approval

### Performance Guidelines

- Lazy load components when appropriate
- Optimize images (use Next.js Image component)
- Minimize bundle size (check with `npm run build`)
- Use React.memo() for expensive renders
- Implement virtualization for long lists

### Security Guidelines

- Never commit secrets or API keys
- Validate all user inputs
- Sanitize data before rendering
- Use parameterized queries for database operations
- Follow OWASP best practices

## Questions?

If you have questions about contributing, please open an issue or reach out to the team.
