import type { ReviewFinding, GitFileDiff } from '../types/index.js'
import { loadConfig } from './config.js'

const DEBUG_PATTERN = /console\.\w+\s*\(|debugger\s*;?/
const CONSOLE_ERROR_PATTERN = /console\.error\s*\(/
const TODO_PATTERN = /\b(TODO|FIXME|HACK|XXX)\b/i
const MAGIC_NUMBER = /(?<![.\w])[0-9]{3,}(?![.\w])/
const TS_ANY = /:\s*any\b/
const UNUSED_IMPORT = /import\s+(?:type\s+)?{([^}]+)}\s+from/
const EMPTY_CATCH = /catch\s*\([^)]*\)\s*\{\s*\}/
const FUNCTION_START = /(function\s+\w*\s*\(|=>\s*\{|^\s*\w+\s*\([^)]*\)\s*\{)/gm

function countLines(content: string): number {
  return content.split('\n').length
}

function extractLineNumber(content: string, index: number): number {
  return content.substring(0, index).split('\n').length
}

function checkUnusedImports(content: string, file: string): ReviewFinding[] {
  const findings: ReviewFinding[] = []
  const importMatch = content.match(UNUSED_IMPORT)
  if (!importMatch) return findings

  const imports = importMatch[1].split(',').map(i => i.trim().split(/\s+as\s+/)[0].trim())
  const body = content.slice(importMatch.index! + importMatch[0].length)

  for (const imp of imports) {
    if (!body.includes(imp)) {
      findings.push({
        file,
        line: extractLineNumber(content, importMatch.index!),
        severity: 'warning',
        message: `Unused import: "${imp}"`,
        code: importMatch[0],
      })
    }
  }
  return findings
}

export function analyzeFile(file: GitFileDiff): ReviewFinding[] {
  const findings: ReviewFinding[] = []
  
  if (!file.content.trim()) {
    return findings
  }

  const config = loadConfig()
  if (!config.review.patterns) return findings

  const diff = file.content

  // Check for debug statements
  if (config.review.patterns.debug) {
    let match: RegExpExecArray | null
    const debugRegex = new RegExp(DEBUG_PATTERN.source, 'g')
    while ((match = debugRegex.exec(diff)) !== null) {
      findings.push({
        file: file.file,
        line: extractLineNumber(diff, match.index),
        severity: 'warning',
        message: `Debug statement left in code: "${match[0].trim()}"`,
        code: match[0].trim(),
      })
    }
  }

  // Check for console.error statements
  if (config.review.patterns.debug) {
    let match: RegExpExecArray | null
    const errorRegex = new RegExp(CONSOLE_ERROR_PATTERN.source, 'g')
    while ((match = errorRegex.exec(diff)) !== null) {
      findings.push({
        file: file.file,
        line: extractLineNumber(diff, match.index),
        severity: 'error',
        message: `console.error left in code — use proper error handling`,
        code: match[0].trim(),
      })
    }
  }

  // Check for TODOs
  if (config.review.patterns.todos) {
    let match: RegExpExecArray | null
    const todoRegex = new RegExp(TODO_PATTERN.source, 'g')
    while ((match = todoRegex.exec(diff)) !== null) {
      findings.push({
        file: file.file,
        line: extractLineNumber(diff, match.index),
        severity: 'info',
        message: `Incomplete work item: ${match[0]}`,
        code: match[0],
      })
    }
  }

  // Check for magic numbers
  if (config.review.patterns.magicNumbers) {
    const lines = diff.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.startsWith('+') || line.startsWith('-')) {
        const numMatch = line.match(MAGIC_NUMBER)
        if (numMatch && !line.includes('//') && !line.includes('*')) {
          findings.push({
            file: file.file,
            line: i + 1,
            severity: 'warning',
            message: `Magic number ${numMatch[0]} — consider extracting to a named constant`,
            code: line.trim(),
          })
        }
      }
    }
  }

  // Check for TypeScript `any`
  if (config.review.patterns.tsAny && file.file.endsWith('.ts')) {
    let match: RegExpExecArray | null
    const anyRegex = new RegExp(TS_ANY.source, 'g')
    while ((match = anyRegex.exec(diff)) !== null) {
      findings.push({
        file: file.file,
        line: extractLineNumber(diff, match.index),
        severity: 'warning',
        message: `Using \`any\` type — consider using \`unknown\` or a proper type`,
        code: match[0].trim(),
      })
    }
  }

  // Check file size
  if (config.review.patterns.largeFiles) {
    const addLines = diff.split('\n').filter(l => l.startsWith('+')).length
    if (addLines > config.review.maxLinesPerFile) {
      findings.push({
        file: file.file,
        line: 1,
        severity: 'warning',
        message: `Large change (${addLines} lines added) — consider splitting into smaller PRs`,
      })
    }
  }

  // Check for unused imports
  findings.push(...checkUnusedImports(diff, file.file))

  // Check for empty catch blocks
  if (config.review.patterns.errorHandling) {
    let match: RegExpExecArray | null
    const catchRegex = new RegExp(EMPTY_CATCH.source, 'g')
    while ((match = catchRegex.exec(diff)) !== null) {
      findings.push({
        file: file.file,
        line: extractLineNumber(diff, match.index),
        severity: 'warning',
        message: `Empty catch block — errors are being silently swallowed`,
        code: match[0].trim(),
      })
    }
  }

  return findings
}

export function analyzeCommits(log: string): { type: string; count: number }[] {
  const typeCount: Record<string, number> = {}
  const lines = log.split('\n')

  for (const line of lines) {
    const match = line.match(/^(feat|fix|refactor|chore|docs|style|perf|test|ci)/)
    if (match) {
      typeCount[match[1]] = (typeCount[match[1]] || 0) + 1
    }
  }

  return Object.entries(typeCount).map(([type, count]) => ({ type, count }))
}
