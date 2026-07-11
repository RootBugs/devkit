import chalk from 'chalk'
import { getStagedDiff } from '../core/git.js'
import { analyzeFile } from '../core/analyzer.js'
import { formatReviewFindings } from '../utils/format.js'

export async function reviewCommand(options: { all?: boolean }): Promise<void> {
  const diffs = await getStagedDiff()

  if (diffs.length === 0) {
    console.log(chalk.yellow('⚠ No staged changes to review.'))
    console.log(chalk.dim('  Tip: Use git add to stage files, or devkit commit --all'))
    return
  }

  console.log(chalk.dim(`\n🔍 Reviewing ${diffs.length} file(s)...\n`))

  const allFindings: any[] = []
  const fileSummary: { file: string; issues: number }[] = []

  for (const diff of diffs) {
    const findings = analyzeFile(diff)
    allFindings.push(...findings)
    fileSummary.push({ file: diff.file, issues: findings.length })
  }

  // Print file overview
  console.log(chalk.bold('Files analyzed:'))
  for (const f of fileSummary) {
    const color = f.issues === 0 ? chalk.green : f.issues > 5 ? chalk.red : chalk.yellow
    console.log(`  ${f.issues > 0 ? color(`⚠ ${f.issues} issue(s)`) : chalk.green('✓ clean')} — ${f.file}`)
  }

  // Print detailed findings
  if (allFindings.length > 0) {
    console.log(chalk.bold('\n' + '─'.repeat(60)))
    console.log(formatReviewFindings(allFindings))
  }

  // Summary
  const errors = allFindings.filter(f => f.severity === 'error').length
  const warnings = allFindings.filter(f => f.severity === 'warning').length
  const infos = allFindings.filter(f => f.severity === 'info').length

  console.log(chalk.bold('\n' + '─'.repeat(60)))
  console.log(chalk.bold('📊 Summary:'))
  console.log(`  ${chalk.red(`${errors} error(s)`)} · ${chalk.yellow(`${warnings} warning(s)`)} · ${chalk.blue(`${infos} suggestion(s)`)}`)

  if (allFindings.length === 0) {
    console.log(chalk.green.bold('\n✓ Everything looks clean! Ready to commit.'))
  }
}
