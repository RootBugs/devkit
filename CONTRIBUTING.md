# Contributing to DevKit

Thank you for your interest in contributing to DevKit!

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feat/my-feature`

## Development

```bash
# Watch mode for TypeScript
npm run dev

# Build
npm run build

# Type check
npx tsc --noEmit
```

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `refactor:` — Code restructuring
- `docs:` — Documentation
- `chore:` — Build/dependencies
- `style:` — Formatting
- `perf:` — Performance
- `test:` — Tests

## Pull Requests

1. Ensure all tests pass
2. Update documentation if needed
3. Add a clear description of changes
4. Reference any related issues

## Code Style

- Use TypeScript
- Follow existing patterns
- Keep functions small and focused
- Add types where possible
