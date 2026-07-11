import type { GitFileDiff, CommitSuggestion } from '../types/index.js'

export function buildCommitPrompt(diffs: GitFileDiff[]): string {
  const filesContext = diffs
    .map(d => `File: ${d.file} (${d.status})
\`\`\`diff
${d.content.slice(0, 3000)}
\`\`\``)
    .join('\n\n')

  return `You are a senior developer writing precise git commit messages.

Given the following git diff, generate 3 conventional commit message options.
Each must follow: \`type(scope): description\`

Types: feat, fix, refactor, chore, docs, style, perf, test, ci
If there are breaking changes, add \`!\` after the type/scope.

For each option, provide:
- type
- scope (component/area)
- title (short description, max 72 chars)
- body (2-3 sentence explanation of WHY)
- breaking (true/false)

Format your response as JSON array:
[
  { "type": "feat", "scope": "api", "title": "add user login endpoint", "body": "...", "breaking": false }
]

Changes to analyze:
${filesContext}`
}

export function buildPRPrompt(diffs: GitFileDiff[], branch: string, baseBranch: string): string {
  const filesContext = diffs
    .map(d => `File: ${d.file} (${d.status})
\`\`\`diff
${d.content.slice(0, 2000)}
\`\`\``)
    .join('\n\n')

  return `You are a senior engineer writing a PR description.

Branch: ${branch}
Base: ${baseBranch}

Given these changes, generate a PR description in this exact JSON format:
{
  "title": "Short PR title under 70 chars",
  "summary": "2-3 paragraph summary explaining what and why",
  "changes": [
    { "file": "path/to/file.ts", "type": "modified", "description": "what changed here" }
  ],
  "breakingChanges": ["list or empty array"],
  "testPlan": ["test step 1", "test step 2"]
}

Changes:
${filesContext}`
}

export function buildChangelogPrompt(commits: string): string {
  return `Given these git commits, group them into a changelog by type.
Return JSON array:
[{ "type": "Features", "entries": [{ "type": "feat", "description": "...", "scope": "api", "breaking": false, "commit": "abc1234" }] }]

Types to group by: Features, Bug Fixes, Performance, Refactoring, Documentation, Other

Commits:
${commits}`
}

export function buildReviewPrompt(diffs: GitFileDiff[]): string {
  const filesContext = diffs
    .map(d => `File: ${d.file}
\`\`\`diff
${d.content.slice(0, 2000)}
\`\`\``)
    .join('\n\n')

  return `Review these code changes as a senior engineer. Find:
1. Logic errors or bugs
2. Security vulnerabilities
3. Performance issues
4. Code quality problems
5. Missing error handling

Return JSON array:
[{ "file": "path", "line": 10, "severity": "error|warning|info", "message": "description", "code": "relevant snippet" }]

Changes:
${filesContext}`
}

export function generateCommitMessages(diffs: GitFileDiff[]): CommitSuggestion[] {
  const files = diffs.map(d => d.file)
  const types = new Set<string>()

  for (const d of diffs) {
    if (d.content.includes('function') || d.content.includes('class ')) types.add('feat')
    if (d.content.includes('fix') || d.content.includes('bug') || d.content.includes('error')) types.add('fix')
    if (d.content.includes('refactor') || d.content.includes('rename')) types.add('refactor')
  }

  const primaryType = types.has('feat') ? 'feat' : types.has('fix') ? 'fix' : 'refactor'
  const scope = inferScope(files)
  const fileList = files.map(f => f.split('/').pop()).join(', ')

  return [
    {
      type: primaryType,
      scope,
      title: `update ${fileList}`,
      body: `Changes to ${files.length} file(s): ${fileList}. ${generateDescription(diffs)}`,
      breaking: diffs.some(d => d.content.includes('BREAKING') || d.content.includes('breaking')),
    },
    {
      type: primaryType === 'feat' ? 'refactor' : primaryType === 'fix' ? 'chore' : 'fix',
      scope,
      title: `improve ${scope || 'code'}: ${fileList}`,
      body: `Refactored and updated ${files.length} file(s) in ${scope || 'the codebase'}.`,
      breaking: false,
    },
    {
      type: 'chore',
      scope,
      title: `update ${scope || 'dependencies'}`,
      body: `Routine updates to ${files.length} file(s).`,
      breaking: false,
    },
  ]
}

function inferScope(files: string[]): string {
  if (files.some(f => f.includes('api') || f.includes('route') || f.includes('endpoint'))) return 'api'
  if (files.some(f => f.includes('component') || f.includes('ui') || f.includes('page'))) return 'ui'
  if (files.some(f => f.includes('db') || f.includes('model') || f.includes('schema'))) return 'db'
  if (files.some(f => f.includes('test') || f.includes('spec') || f.includes('.test.'))) return 'tests'
  if (files.some(f => f.includes('config') || f.includes('docker') || f.includes('ci'))) return 'config'
  if (files.some(f => f.includes('doc') || f.includes('readme'))) return 'docs'
  return ''
}

function generateDescription(diffs: GitFileDiff[]): string {
  const additions = diffs.reduce((sum, d) => sum + d.additions, 0)
  const deletions = diffs.reduce((sum, d) => sum + d.deletions, 0)
  return `${additions} additions, ${deletions} deletions across ${diffs.length} file(s).`
}
