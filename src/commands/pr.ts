import chalk from 'chalk'
import { getBranchDiff, getCurrentBranch, detectDefaultBranch } from '../core/git.js'
import { formatPR } from '../utils/format.js'

export async function prCommand(options: { base?: string; output?: string }): Promise<void> {
  const branch = await getCurrentBranch()
  const baseBranch = options.base || await detectDefaultBranch()

  console.log(chalk.dim(`\n📂 Comparing ${chalk.bold(branch)} → ${chalk.bold(baseBranch)}\n`))

  const diffs = await getBranchDiff(baseBranch)

  if (diffs.length === 0) {
    console.log(chalk.yellow('⚠ No differences found between branches.'))
    return
  }

  console.log(chalk.dim(`📁 ${diffs.length} file(s) changed\n`))

  // Generate commit log summary
  const { execFileSync } = await import('child_process')
  let commitLog = ''
  try {
    commitLog = execFileSync('git', ['log', `${baseBranch}..${branch}`, '--oneline'], { encoding: 'utf-8' })
  } catch {}

  // Build PR info from analysis
  const fileChanges = diffs.map(d => ({
    file: d.file,
    type: d.status,
    description: describeChange(d.file, d.content),
  }))

  const title = `[${branch}] Update ${diffs.length} file(s)`
  const summary = `## Summary\n\nThis PR updates ${diffs.length} file(s) across the ${branch} branch.\n\n${
    commitLog ? `### Commits\n\n${commitLog.split('\n').map(l => `- ${l}`).join('\n')}` : ''
  }`

  const testPlan = [
    'Verify the application builds without errors',
    'Run existing tests to ensure no regressions',
    'Manually test the affected functionality',
  ]

  const prContent = formatPR({
    title,
    summary,
    changes: fileChanges,
    breakingChanges: [],
    testPlan,
  })

  if (options.output) {
    const { writeFileSync } = await import('fs')
    writeFileSync(options.output, prContent, 'utf-8')
    console.log(chalk.green(`✓ PR description saved to ${options.output}`))
  } else {
    console.log(prContent)
    console.log(chalk.dim('\n💡 Use --output <file> to save to a file.'))
  }
}

function describeChange(file: string, content: string): string {
  if (content.includes('import ') || content.includes('require(')) return 'Add new imports and dependencies'
  if (content.includes('function ') || content.includes('=>')) return 'Update function implementations'
  if (content.includes('interface ') || content.includes('type ')) return 'Update type definitions'
  if (content.includes('class ')) return 'Update class implementations'
  if (content.includes('export ')) return 'Update module exports'
  return 'Make modifications and improvements'
}
