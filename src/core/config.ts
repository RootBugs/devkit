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

let cachedConfig: DevKitConfig | null = null

function getConfigPath(): string {
  const configDir = join(homedir(), '.config', 'devkit')
  return join(configDir, 'config.json')
}

export function loadConfig(): DevKitConfig {
  if (cachedConfig) return cachedConfig
  
  const configPath = getConfigPath()
  if (!existsSync(configPath)) {
    cachedConfig = { ...DEFAULT_CONFIG }
    return cachedConfig
  }
  try {
    const raw = readFileSync(configPath, 'utf-8')
    const parsed = JSON.parse(raw)
    cachedConfig = validateConfig({ ...DEFAULT_CONFIG, ...parsed })
    return cachedConfig
  } catch {
    cachedConfig = { ...DEFAULT_CONFIG }
    return cachedConfig
  }
}

function validateConfig(config: DevKitConfig): DevKitConfig {
  if (typeof config.review?.maxLinesPerFile !== 'number') {
    config.review.maxLinesPerFile = DEFAULT_CONFIG.review.maxLinesPerFile
  }
  if (typeof config.review?.maxFunctionLines !== 'number') {
    config.review.maxFunctionLines = DEFAULT_CONFIG.review.maxFunctionLines
  }
  if (!Array.isArray(config.commitTypes)) {
    config.commitTypes = DEFAULT_CONFIG.commitTypes
  }
  if (typeof config.defaultBranch !== 'string') {
    config.defaultBranch = DEFAULT_CONFIG.defaultBranch
  }
  return config
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
