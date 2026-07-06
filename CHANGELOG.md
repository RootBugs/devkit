# Changelog

## v1.1.0 (2026-07-06)

### Features

- **analyzer**: add unused import detection
- **analyzer**: add error severity for console.error statements
- **analyzer**: detect empty catch blocks
- **commit**: add --dry-run flag to preview commits
- **format**: add formatError and formatSuccess helpers
- **types**: add ChangelogConfig interface
- add --verbose flag to pr, review, and changelog commands
- add init command to create default config

### Bug Fixes

- **git**: normalize Windows backslashes in file paths
- **analyzer**: handle empty file content gracefully
- **pr**: support verbose flag for detailed output

### Performance

- **config**: add in-memory config caching

### Refactoring

- **config**: add config schema validation
- **format**: extract chalk colors to COLORS constant
- **git**: add isGitRepo helper function

### Documentation

- add requirements section to README
- add CONTRIBUTING.md guide

### Chores

- add .prettierrc for consistent formatting
- bump version to 1.1.0

### CI/CD

- add GitHub Actions CI workflow

## v1.0.0 (2026-07-03)

### Features

- Initial release
- Smart commit message generation
- PR description generation
- Code review with static analysis
- Changelog generation
