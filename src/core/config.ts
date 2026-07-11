import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { homedir } from 'os'
import { join, dirname } from 'path'
import type { ReviewConfig } from '../types/index.js'

interface DevKitConfig {
  review: ReviewConfig
  commitTypes: string[]
  defaultBranch: string
}

const DEFAULT_CONFIG: DevKitConfig = {
  review: {
    maxLinesPerFile: 300,
    maxFunctionLines: 50,
    patterns: {
      debug: true,
      todos: true,
      errorHandling: true,
      magicNumbers: true,
      tsAny: true,
      largeFiles: true,
    },
  },
  commitTypes: ['feat', 'fix', 'refactor', 'chore', 'docs', 'style', 'perf', 'test', 'ci'],
  defaultBranch: 'main',
}

function getConfigPath(): string {
  const configDir = join(homedir(), '.config', 'devkit')
  return join(configDir, 'config.json')
}

export function loadConfig(): DevKitConfig {
  const configPath = getConfigPath()
  if (!existsSync(configPath)) {
    return { ...DEFAULT_CONFIG }
  }
  try {
    const raw = readFileSync(configPath, 'utf-8')
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function saveConfig(config: Partial<DevKitConfig>): void {
  const configPath = getConfigPath()
  const dir = dirname(configPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  const existing = loadConfig()
  const merged = { ...existing, ...config }
  writeFileSync(configPath, JSON.stringify(merged, null, 2), 'utf-8')
}

export function getDefaultBranch(): string {
  return loadConfig().defaultBranch
}
