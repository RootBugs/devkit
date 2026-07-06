import inquirer from 'inquirer'
import chalk from 'chalk'
import { getStagedDiff, commit, stageAllFiles } from '../core/git.js'
import { generateCommitMessages } from '../utils/prompts.js'
import { formatCommitSuggestions } from '../utils/format.js'
import type { CommitSuggestion } from '../types/index.js'

export async function commitCommand(options: { all?: boolean; type?: string; message?: string; dryRun?: boolean }): Promise<void> {
  if (options.all) {
    await stageAllFiles()
  }

  const diffs = await getStagedDiff()

  if (diffs.length === 0) {
    console.log(chalk.yellow('⚠ No staged changes found.'))
    if (!options.all) {
      console.log(chalk.dim('  Tip: Use --all to stage everything, or git add first.'))
    }
    return
  }

  console.log(chalk.dim(`\n📁 ${diffs.length} file(s) staged\n`))

  // If direct message provided, use it
  if (options.message) {
    if (options.dryRun) {
      console.log(chalk.dim(`[dry-run] Would commit: ${options.message}`))
      return
    }
    await commit(options.message)
    console.log(chalk.green('✓ Committed with provided message.'))
    return
  }

  // Generate suggestions
  const suggestions = generateCommitMessages(diffs)

  if (options.type) {
    // Use first suggestion with custom type
    const suggestion = suggestions[0]
    const fullMsg = `${options.type}${suggestion.scope ? `(${suggestion.scope})` : ''}: ${suggestion.title}`
    await commit(fullMsg)
    console.log(chalk.green(`✓ Committed as: ${chalk.bold(fullMsg)}`))
    return
  }

  console.log(chalk.cyan('\n📝 Suggested commit messages:\n'))
  console.log(formatCommitSuggestions(suggestions))

  // Let user pick or customize
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Choose a message or write your own:',
      choices: [
        { name: `📌 Use #1: ${suggestions[0].type}(${suggestions[0].scope}): ${suggestions[0].title}`, value: 0 },
        { name: `📌 Use #2: ${suggestions[1].type}(${suggestions[1].scope}): ${suggestions[1].title}`, value: 1 },
        { name: `📌 Use #3: ${suggestions[2].type}(${suggestions[2].scope}): ${suggestions[2].title}`, value: 2 },
        { name: '✏️  Write custom message', value: 'custom' },
        { name: '❌ Cancel', value: 'cancel' },
      ],
    },
  ])

  if (action === 'cancel') {
    console.log(chalk.dim('Commit cancelled.'))
    return
  }

  let finalMessage: string

  if (action === 'custom') {
    const { customMsg } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customMsg',
        message: 'Enter commit message:',
        validate: (input: string) => input.trim().length > 0 || 'Message cannot be empty',
      },
    ])
    finalMessage = customMsg

    const { body } = await inquirer.prompt([
      {
        type: 'input',
        name: 'body',
        message: 'Enter commit body (optional, press Enter to skip):',
      },
    ])
    if (body.trim()) {
      finalMessage += '\n\n' + body
    }
  } else {
    const s = suggestions[action as number]
    finalMessage = `${s.type}${s.scope ? `(${s.scope})` : ''}${s.breaking ? '!' : ''}: ${s.title}\n\n${s.body}`
  }

  // Show preview
  console.log(chalk.dim('\nCommit message preview:'))
  console.log(chalk.cyan('─'.repeat(50)))
  console.log(finalMessage)
  console.log(chalk.cyan('─'.repeat(50)))

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Commit with this message?',
      default: true,
    },
  ])

  if (!confirm) {
    console.log(chalk.dim('Commit cancelled.'))
    return
  }

  if (options.dryRun) {
    console.log(chalk.dim(`\n[dry-run] Would commit with message:`))
    console.log(chalk.cyan(finalMessage))
    return
  }

  await commit(finalMessage)
  console.log(chalk.green('\n✓ Changes committed successfully!'))
}
