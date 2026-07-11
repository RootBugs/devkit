export interface CommitSuggestion {
  type: string
  scope: string
  title: string
  body: string
  breaking: boolean
}

export interface PRInfo {
  title: string
  summary: string
  changes: PRChange[]
  breakingChanges: string[]
  testPlan: string[]
}

export interface PRChange {
  file: string
  type: 'added' | 'modified' | 'deleted' | 'renamed'
  description: string
}

export interface ReviewFinding {
  file: string
  line: number
  severity: 'error' | 'warning' | 'info'
  message: string
  code?: string
}

export interface ChangelogEntry {
  type: string
  description: string
  scope?: string
  breaking: boolean
  commit: string
}

export interface ChangelogSection {
  title: string
  entries: ChangelogEntry[]
}

export interface GitFileDiff {
  file: string
  status: 'added' | 'modified' | 'deleted' | 'renamed'
  additions: number
  deletions: number
  content: string
}

export interface ReviewConfig {
  maxLinesPerFile: number
  maxFunctionLines: number
  patterns: {
    debug: boolean
    todos: boolean
    errorHandling: boolean
    magicNumbers: boolean
    tsAny: boolean
    largeFiles: boolean
  }
}
