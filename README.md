# DevKit 🧰

AI-powered developer CLI toolkit — **smart commits, PR descriptions, code review, and changelogs**, all local-first.

```bash
npx devkit commit    # Smart commit messages from staged changes
npx devkit pr        # Auto-generate PR descriptions
npx devkit review    # Static analysis on staged changes
npx devkit changelog # Generate changelogs from git history
```

## Features

### `devkit commit` — Smart commit messages
Analyzes staged `git diff` and suggests **3 conventional commit messages** with an interactive picker. Supports `--all`, `--type`, and `--message` flags for non-interactive use.

### `devkit pr` — PR descriptions in seconds
Compares your branch against the base branch and generates a structured PR description with summary, changes list, and test plan.

### `devkit review` — Catch issues before pushing
Static analysis that detects:
- Debug statements (`console.log`, `debugger`)
- Incomplete work (`TODO`, `FIXME`, `HACK`)
- Magic numbers
- TypeScript `any` usage
- Large changes that should be split

### `devkit changelog` — Auto-changelogs
Reads `git log` between refs, groups commits by conventional commit type (features, fixes, performance, etc.), and outputs clean markdown.

## Installation

```bash
# Install globally
npm install -g devkit

# Or run without installing
npx devkit commit
```

## Usage

```bash
cd your-project

# Stage some changes first
git add .

# Interactive commit
devkit commit

# Generate PR description
devkit pr -o PR.md

# Review staged changes
devkit review

# Generate changelog
devkit changelog -o CHANGELOG.md
```

## Configuration

Config lives at `~/.config/devkit/config.json`:

```json
{
  "review": {
    "maxLinesPerFile": 300,
    "patterns": {
      "debug": true,
      "todos": true,
      "errorHandling": true,
      "magicNumbers": true,
      "tsAny": true,
      "largeFiles": true
    }
  },
  "commitTypes": ["feat", "fix", "refactor", "chore", "docs", "style", "perf", "test", "ci"],
  "defaultBranch": "main"
}
```

## Platform Support

- **Windows**: Full support (ESM path handling for drive-letter paths)
- **macOS / Linux**: Full support

## Known Behaviors

- `devkit pr` gracefully handles orphan branches (no shared commit history) with a clear message instead of crashing.
- `devkit pr` detects when comparing a branch to itself and exits early.

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **CLI**: Commander.js
- **Git**: simple-git
- **UI**: Inquirer, Chalk, Ora

## License

MIT © [RootBugs](https://github.com/RootBugs)
