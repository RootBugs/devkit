import chalk from 'chalk'
import type { CommitSuggestion, ReviewFinding, ChangelogSection, PRInfo } from '../types/index.js'

export function formatCommitSuggestions(suggestions: CommitSuggestion[]): string {
  return suggestions
    .map((s, i) => {
      const breaking = s.breaking ? chalk.red(' [BREAKING]') : ''
      return `${i + 1}. ${chalk.green(s.type)}${s.scope ? chalk.yellow(`(${s.scope})`) : ''}: ${s.title}${breaking}
   ${chalk.dim(s.body)}`
    })
    .join('\n\n')
}

export function formatReviewFindings(findings: ReviewFinding[]): string {
  if (findings.length === 0) {
    return chalk.green('✓ No issues found. Looks clean!')
  }

  const errors = findings.filter(f => f.severity === 'error')
  const warnings = findings.filter(f => f.severity === 'warning')
  const infos = findings.filter(f => f.severity === 'info')

  const parts: string[] = []

  if (errors.length > 0) {
    parts.push(chalk.red.bold(`\n✗ ${errors.length} Error(s):`))
    errors.forEach(f => {
      parts.push(`  ${chalk.red('✗')} ${f.file}:${f.line} — ${f.message}`)
      if (f.code) parts.push(chalk.dim(`     ${f.code}`))
    })
  }

  if (warnings.length > 0) {
    parts.push(chalk.yellow.bold(`\n⚠ ${warnings.length} Warning(s):`))
    warnings.forEach(f => {
      parts.push(`  ${chalk.yellow('⚠')} ${f.file}:${f.line} — ${f.message}`)
      if (f.code) parts.push(chalk.dim(`     ${f.code}`))
    })
  }

  if (infos.length > 0) {
    parts.push(chalk.blue.bold(`\nℹ ${infos.length} Suggestion(s):`))
    infos.forEach(f => {
      parts.push(`  ${chalk.blue('ℹ')} ${f.file}:${f.line} — ${f.message}`)
    })
  }

  return parts.join('\n')
}

export function formatChangelog(sections: ChangelogSection[]): string {
  const parts: string[] = ['# Changelog\n']

  for (const section of sections) {
    if (section.entries.length === 0) continue
    parts.push(`## ${section.title}\n`)

    for (const entry of section.entries) {
      const breaking = entry.breaking ? ' 💥' : ''
      const scope = entry.scope ? `**(${entry.scope})** ` : ''
      parts.push(`- ${scope}${entry.description}${breaking} (${entry.commit})`)
    }
    parts.push('')
  }

  return parts.join('\n')
}

export function formatPR(info: PRInfo): string {
  const parts: string[] = [
    chalk.bold(`# ${info.title}`),
    '',
    '## Summary',
    '',
    info.summary,
    '',
    '## Changes',
    '',
  ]

  for (const change of info.changes) {
    const icon = change.type === 'added' ? '✨' : change.type === 'deleted' ? '🗑' : change.type === 'renamed' ? '📝' : '🔧'
    parts.push(`- ${icon} **${change.file}** — ${change.description}`)
  }

  if (info.breakingChanges.length > 0) {
    parts.push('', '## ⚠ Breaking Changes', '')
    for (const bc of info.breakingChanges) {
      parts.push(`- ${bc}`)
    }
  }

  if (info.testPlan.length > 0) {
    parts.push('', '## Test Plan', '')
    for (const tp of info.testPlan) {
      parts.push(`- [ ] ${tp}`)
    }
  }

  return parts.join('\n')
}

export function formatFileSummary(files: { file: string; additions: number; deletions: number }[]): string {
  const parts = files.map(f => {
    const add = f.additions > 0 ? chalk.green(`+${f.additions}`) : ''
    const del = f.deletions > 0 ? chalk.red(`-${f.deletions}`) : ''
    return `  ${f.file} (${add}${add && del ? ' ' : ''}${del})`
  })
  return parts.join('\n')
}
