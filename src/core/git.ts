import simpleGit from 'simple-git'
import type { GitFileDiff } from '../types/index.js'

const _git = () => simpleGit({ baseDir: process.cwd() })

export async function getStagedDiff(): Promise<GitFileDiff[]> {
  const g = _git()
  const diff = await g.diff(['--cached', '--stat'])
  const files = parseDiffStat(diff)
  const results: GitFileDiff[] = []

  for (const file of files) {
    const content = await g.diff(['--cached', '--', file.file])
    results.push({ ...file, content })
  }

  return results
}

export async function detectDefaultBranch(): Promise<string> {
  try {
    const g = _git()
    const branches = await g.branchLocal()
    const candidates = ['main', 'master', 'develop'].filter(b => branches.all.includes(b))
    if (candidates.length > 0) return candidates[0]
    const current = await g.revparse(['--abbrev-ref', 'HEAD'])
    const others = branches.all.filter(b => b !== current)
    if (others.length > 0) return others[0]
  } catch {}
  return 'main'
}

export async function getBranchDiff(baseBranch: string): Promise<GitFileDiff[]> {
  const g = _git()
  const currentBranch = await g.revparse(['--abbrev-ref', 'HEAD'])

  try {
    await g.raw(['rev-parse', '--verify', baseBranch])
  } catch {
    throw new Error(`Base branch "${baseBranch}" not found. Use --base to specify a valid branch.`)
  }

  let diff: string
  try {
    diff = await g.diff([baseBranch + '...' + currentBranch, '--stat'])
  } catch (err: any) {
    if (err.message?.includes('no merge base') || err.message?.includes('no base')) {
      return []
    }
    throw err
  }

  const files = parseDiffStat(diff)
  const results: GitFileDiff[] = []

  for (const file of files) {
    const content = await g.diff([baseBranch + '...' + currentBranch, '--', file.file])
    results.push({ ...file, content })
  }

  return results
}

export async function getDiffForStaging(): Promise<GitFileDiff[]> {
  const g = _git()
  const status = await g.status()
  const results: GitFileDiff[] = []

  for (const file of status.files) {
    const content = await g.diff(['--', file.path])
    results.push({
      file: file.path,
      status: mapStatus(file.working_dir),
      additions: 0,
      deletions: 0,
      content,
    })
  }

  return results
}

export async function getGitLog(from: string, to = 'HEAD'): Promise<string> {
  try {
    const g = _git()
    const log = await g.log({ from, to, format: { hash: '%h', message: '%s', body: '%b' } })
    return log.all.map(c => `${c.hash} ${c.message}`).join('\n')
  } catch {
    return ''
  }
}

export async function getTags(): Promise<string[]> {
  const g = _git()
  const tags = await g.tags()
  return tags.all
}

export async function getCurrentBranch(): Promise<string> {
  return _git().revparse(['--abbrev-ref', 'HEAD'])
}

export async function isOrphanBranch(branch: string): Promise<boolean> {
  try {
    const g = _git()
    const log = await g.log({ branch, maxCount: 1 })
    if (log.latest?.message === undefined) return true
    const parent = await g.raw(['rev-parse', branch + '^']).catch(() => null)
    return !parent
  } catch {
    return true
  }
}

export async function hasMergeBase(branchA: string, branchB: string): Promise<boolean> {
  try {
    const g = _git()
    const result = await g.raw(['merge-base', branchA, branchB])
    return result.trim().length > 0
  } catch {
    return false
  }
}

export async function stageAllFiles(): Promise<void> {
  await _git().add('.')
}

export async function commit(message: string): Promise<void> {
  await _git().commit(message)
}

export function parseDiffStat(stat: string): { file: string; status: GitFileDiff['status']; additions: number; deletions: number }[] {
  if (!stat.trim()) return []
  const lines = stat.trim().split('\n')
  const files: { file: string; status: GitFileDiff['status']; additions: number; deletions: number }[] = []

  for (const line of lines) {
    if (!line.includes('|')) continue
    const match = line.match(/^(.+?)\s+\|\s+(\d+)\s[+-]*$/)
    if (match) {
      files.push({
        file: normalizePath(match[1].trim()),
        status: 'modified',
        additions: 0,
        deletions: 0,
      })
    }
  }

  return files
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/')
}

function mapStatus(workingDir: string): GitFileDiff['status'] {
  switch (workingDir) {
    case 'A': return 'added'
    case 'D': return 'deleted'
    case 'R': return 'renamed'
    default: return 'modified'
  }
}

export function parseConventionalCommit(message: string): { type: string; scope?: string; breaking: boolean; description: string } | null {
  const pattern = /^(feat|fix|refactor|chore|docs|style|perf|test|ci|build|revert)(\((.+?)\))?(!)?:\s*(.+)$/
  const match = message.match(pattern)
  if (!match) return null
  return {
    type: match[1],
    scope: match[3],
    breaking: match[4] === '!' || message.toLowerCase().includes('breaking change'),
    description: match[5],
  }
}
