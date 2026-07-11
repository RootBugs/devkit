#!/usr/bin/env node
import { readFileSync } from 'fs'
import { createRequire } from 'module'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Try loading the compiled JS first, fallback to ts source via tsx or ts-node
try {
  const distPath = resolve(__dirname, '..', 'dist', 'index.js')
  await import(distPath)
} catch {
  // Fallback: try running from source
  try {
    const srcPath = resolve(__dirname, '..', 'src', 'index.ts')
    await import(srcPath)
  } catch {
    console.error('❌ Failed to load devkit. Run "npm run build" first, or use "npx tsx src/index.ts"')
    process.exit(1)
  }
}
