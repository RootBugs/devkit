#!/usr/bin/env node
import { Command } from 'commander'
import chalk from 'chalk'
import { commitCommand } from './commands/commit.js'
import { prCommand } from './commands/pr.js'
import { reviewCommand } from './commands/review.js'
import { changelogCommand } from './commands/changelog.js'

const program = new Command()

program
  .name('devkit')
  .description(chalk.cyan('🧰 DevKit — AI-powered developer CLI toolkit'))
  .version('1.0.0')

program
  .command('commit')
  .description('Generate smart commit messages from staged changes')
  .option('-a, --all', 'Stage all changes before committing')
  .option('-t, --type <type>', 'Specify commit type (feat, fix, refactor, etc.)')
  .option('-m, --message <message>', 'Direct commit message (skip interactive)')
  .option('--dry-run', 'Show what would be committed without actually committing')
  .action(commitCommand)

program
  .command('pr')
  .description('Generate PR descriptions from branch diffs')
  .option('-b, --base <branch>', 'Base branch to compare against (default: auto-detect)')
  .option('-o, --output <file>', 'Save PR description to file')
  .option('--verbose', 'Show detailed output')
  .action(prCommand)

program
  .command('review')
  .description('Review staged changes for issues')
  .option('-a, --all', 'Review all unstaged changes too')
  .option('--verbose', 'Show detailed output')
  .action(reviewCommand)

program
  .command('changelog')
  .description('Generate changelog from git history')
  .option('-f, --from <ref>', 'Starting commit/tag')
  .option('-t, --to <ref>', 'Ending commit/tag (default: HEAD)')
  .option('-o, --output <file>', 'Output file (default: stdout)')
  .option('--verbose', 'Show detailed output')
  .action(changelogCommand)

program.addHelpText('after', `
${chalk.dim('Examples:')}
  ${chalk.cyan('devkit commit')}          ${chalk.dim('# Interactive commit with suggestions')}
  ${chalk.cyan('devkit commit --all')}    ${chalk.dim('# Stage everything then commit')}
  ${chalk.cyan('devkit pr -o pr.md')}     ${chalk.dim('# Save PR description to file')}
  ${chalk.cyan('devkit review')}          ${chalk.dim('# Review staged changes')}
  ${chalk.cyan('devkit changelog')}       ${chalk.dim('# Generate changelog')}
`)

program.parse(process.argv)
