#!/usr/bin/env node
import { readFileSync } from 'fs'
import { createRequire } from 'module'
import { resolve, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

try {
  const distPath = resolve(__dirname, '..', 'dist', 'index.js')
  await import(pathToFileURL(distPath).href)
} catch {
  try {
    const srcPath = resolve(__dirname, '..', 'src', 'index.ts')
    await import(pathToFileURL(srcPath).href)
  } catch {
    console.error('❌ Failed to load devkit. Run "npm run build" first, or use "npx tsx src/index.ts"')
    process.exit(1)
  }
}
