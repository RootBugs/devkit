import chalk from 'chalk'
import { getTags, getGitLog } from '../core/git.js'
import { formatChangelog } from '../utils/format.js'
import type { ChangelogSection, ChangelogEntry } from '../types/index.js'

export async function changelogCommand(options: { from?: string; to?: string; output?: string }): Promise<void> {
  console.log(chalk.dim('\n📋 Generating changelog...\n'))

  // Determine version range
  let from: string
  const to = options.to || 'HEAD'

  if (options.from) {
    from = options.from
  } else {
    const tags = await getTags()
    if (tags.length === 0) {
      // No tags — use all commits
      from = '--root'
    } else {
      from = tags[tags.length - 1]
      console.log(chalk.dim(`  Using tag: ${from}`))
    }
  }

  // Get commit log
  const logResult = await getGitLog(from, to)
  // simple-git returns an object, let's handle both string and object cases
  let logStr: string
  if (typeof logResult === 'string') {
    logStr = logResult
  } else {
    // It's a ListLogResult — format inline
    const all = logResult as any
    logStr = all.all?.map?.((c: any) => `${c.hash} ${c.message}`).join('\n') || ''
  }

  if (!logStr.trim()) {
    console.log(chalk.yellow('⚠ No commits found in the specified range.'))
    return
  }

  // Parse commits
  const lines = logStr.trim().split('\n')
  const allEntries = lines.map(line => {
    const match = line.match(/^(\w+)\s+(.*)$/)
    if (!match) return null as ChangelogEntry | null

    const hash = match[1]
    const msg = match[2]
    const parsed = parseConventional(msg)

    if (parsed) {
      return {
        type: parsed.type,
        description: parsed.description,
        scope: parsed.scope,
        breaking: parsed.breaking,
        commit: hash,
      }
    }

    return {
      type: 'other' as const,
      description: msg,
      scope: undefined as string | undefined,
      breaking: false,
      commit: hash,
    }
  })
  const entries: ChangelogEntry[] = allEntries.filter((e): e is ChangelogEntry => e !== null)

  // Group into sections
  const sectionMap = new Map<string, ChangelogEntry[]>()
  const typeToSection: Record<string, string> = {
    feat: 'Features',
    fix: 'Bug Fixes',
    perf: 'Performance',
    refactor: 'Refactoring',
    docs: 'Documentation',
    style: 'Styling',
    test: 'Tests',
    chore: 'Chores',
    ci: 'CI/CD',
    other: 'Other',
  }

  for (const entry of entries) {
    const sectionName = typeToSection[entry.type] || 'Other'
    if (!sectionMap.has(sectionName)) {
      sectionMap.set(sectionName, [])
    }
    sectionMap.get(sectionName)!.push(entry)
  }

  const sections: ChangelogSection[] = Array.from(sectionMap.entries()).map(([title, entryList]) => ({
    title,
    entries: entryList,
  }))

  // Sort sections by priority
  const priority = ['Features', 'Bug Fixes', 'Performance', 'Refactoring', 'Documentation', 'Tests', 'Chores', 'CI/CD', 'Styling', 'Other']
  sections.sort((a, b) => priority.indexOf(a.title) - priority.indexOf(b.title))

  const markdown = formatChangelog(sections)

  if (options.output) {
    const { writeFileSync, existsSync, readFileSync } = await import('fs')
    if (options.output === 'CHANGELOG.md' && existsSync('CHANGELOG.md')) {
      // Prepend to existing changelog
      const existing = readFileSync('CHANGELOG.md', 'utf-8')
      const header = `# Changelog\n\n`
      const content = markdown.replace(header, '')
      writeFileSync(options.output, `# Changelog\n\n${content}\n---\n${existing.replace(header, '')}`, 'utf-8')
    } else {
      writeFileSync(options.output, markdown, 'utf-8')
    }
    console.log(chalk.green(`✓ Changelog saved to ${options.output}`))
  } else {
    console.log(markdown)
    console.log(chalk.dim('\n💡 Use --output <file> to save to a file.'))
  }
}

function parseConventional(msg: string): { type: string; scope?: string; breaking: boolean; description: string } | null {
  const pattern = /^(feat|fix|refactor|chore|docs|style|perf|test|ci|build|revert)(\((.+?)\))?(!)?:\s*(.+)$/
  const match = msg.match(pattern)
  if (!match) return null
  return {
    type: match[1],
    scope: match[3],
    breaking: match[4] === '!' || msg.toLowerCase().includes('breaking change'),
    description: match[5],
  }
}
