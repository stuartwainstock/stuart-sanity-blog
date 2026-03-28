#!/usr/bin/env node
/**
 * Runs axe-core (via Puppeteer) + Lighthouse (accessibility only) against production Next.
 *
 * Prerequisites: `npm run build` (this script runs `next start` for you).
 * Uses Puppeteer’s bundled Chromium (set CHROME_PATH to override).
 *
 * Env:
 *   AUDIT_PORT=3010           — port for Next (default 3010)
 *   AUDIT_PATHS=/,/journal    — comma-separated paths
 *   BASE_URL=http://...       — do not start Next; audit this origin
 *   CHROME_PATH=...           — Chromium/Chrome binary (Puppeteer default if unset)
 *   SKIP_LIGHTHOUSE=1         — axe only
 *   AUDIT_STRICT=0            — do not exit 1 when axe finds violations
 */

import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const reportDir = join(root, 'reports', 'a11y')
const axeJs = join(root, 'node_modules', 'axe-core', 'axe.js')

const PORT = process.env.AUDIT_PORT || '3010'
const DEFAULT_PATHS = '/,/journal,/about,/reading-list,/blog'
const PATHS = (process.env.AUDIT_PATHS || DEFAULT_PATHS)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const BASE =
  process.env.BASE_URL?.replace(/\/$/, '') || `http://127.0.0.1:${PORT}`
const strict = process.env.AUDIT_STRICT !== '0'
const skipLh = process.env.SKIP_LIGHTHOUSE === '1'

const lhCli = join(root, 'node_modules', 'lighthouse', 'cli', 'index.js')
const nextBin = join(root, 'node_modules', 'next', 'dist', 'bin', 'next')

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForServer(url, attempts = 90) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { redirect: 'follow' })
      if (res.status < 500) return
    } catch {
      /* retry */
    }
    await sleep(1000)
  }
  throw new Error(`Server did not become ready: ${url}`)
}

function runNode(scriptPath, args, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, ...env },
    })
    child.on('error', (err) => {
      console.error(err)
      resolve(1)
    })
    child.on('close', (code) => resolve(code ?? 1))
  })
}

function slugify(path) {
  return path.replace(/\//g, '_').replace(/^_|_$/g, '') || 'home'
}

async function runAxeInPage(browser, url, savePath) {
  const page = await browser.newPage()
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 120000 })
    await page.addScriptTag({ path: axeJs })
    const results = await page.evaluate(async () => {
      const a = globalThis.axe
      if (!a?.run) throw new Error('axe not available on page')
      return a.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      })
    })
    await writeFile(savePath, JSON.stringify(results, null, 2))
    const v = results.violations?.length ?? 0
    return v === 0 ? 0 : 1
  } finally {
    await page.close()
  }
}

async function printSummary() {
  console.log('\n━━ Summary\n')
  for (const p of PATHS) {
    const slug = slugify(p)
    const axeFile = join(reportDir, `axe-${slug}.json`)
    if (!existsSync(axeFile)) continue
    try {
      const raw = await readFile(axeFile, 'utf8')
      const data = JSON.parse(raw)
      const violations = Array.isArray(data?.violations) ? data.violations : []
      const vCount = violations.reduce((n, v) => n + (v.nodes?.length || 0), 0)
      console.log(
        `  ${p}  axe: ${violations.length} rule(s), ${vCount} failing node(s), ${data.passes?.length ?? 0} pass group(s)`
      )
      for (const v of violations.slice(0, 5)) {
        console.log(`    - ${v.id} (${v.impact}): ${v.help}`)
      }
      if (violations.length > 5) console.log(`    … +${violations.length - 5} more rules`)
    } catch {
      console.log(`  ${p}  axe: (could not parse ${axeFile})`)
    }
  }

  for (const p of PATHS.slice(0, 4)) {
    const slug = slugify(p)
    const lhFile = join(reportDir, `lighthouse-a11y-${slug}.json`)
    if (!existsSync(lhFile)) continue
    try {
      const raw = await readFile(lhFile, 'utf8')
      const data = JSON.parse(raw)
      const score = data?.categories?.accessibility?.score
      if (typeof score === 'number') {
        console.log(`  ${p}  Lighthouse accessibility: ${Math.round(score * 100)}`)
      }
    } catch {
      /* ignore */
    }
  }
}

async function main() {
  await mkdir(reportDir, { recursive: true })

  if (!existsSync(axeJs)) {
    console.error('Missing axe-core. Run: npm install')
    process.exit(1)
  }

  const puppeteer = await import('puppeteer')
  const executablePath =
    process.env.CHROME_PATH || puppeteer.default.executablePath()

  let server
  const useExternalBase = Boolean(process.env.BASE_URL)
  let browser = null

  try {
    if (!useExternalBase) {
      if (!existsSync(nextBin)) {
        console.error('Next.js binary not found. Run npm install.')
        process.exit(1)
      }
      console.log(`▶ Starting Next.js production server on port ${PORT}…`)
      server = spawn(process.execPath, [nextBin, 'start', '-p', PORT], {
        cwd: root,
        stdio: 'inherit',
      })
      server.on('error', (err) => {
        console.error(err)
        process.exit(1)
      })
      await waitForServer(BASE)
      console.log(`▶ Server ready: ${BASE}\n`)
    } else {
      console.log(`▶ Using BASE_URL=${BASE}\n`)
      await waitForServer(BASE)
    }

    console.log(`▶ Puppeteer Chromium: ${executablePath}\n`)

    browser = await puppeteer.default.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH || undefined,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    })

    const chromeEnv = { CHROME_PATH: executablePath }
    let axeFailed = false

    for (const p of PATHS) {
      const url = `${BASE}${p.startsWith('/') ? p : `/${p}`}`
      const slug = slugify(p)
      const savePath = join(reportDir, `axe-${slug}.json`)
      console.log(`\n━━ axe (Puppeteer)  ${url}`)
      try {
        const code = await runAxeInPage(browser, url, savePath)
        if (code !== 0) {
          axeFailed = true
          console.log(`   → ${code} (violations — see ${savePath})`)
        }
      } catch (e) {
        axeFailed = true
        console.error(e)
      }
    }

    if (browser) {
      await browser.close()
      browser = null
    }

    if (!skipLh && existsSync(lhCli)) {
      const lhPaths = PATHS.slice(0, 4)
      for (const p of lhPaths) {
        const url = `${BASE}${p.startsWith('/') ? p : `/${p}`}`
        const slug = slugify(p)
        const outPath = join(reportDir, `lighthouse-a11y-${slug}.json`)
        console.log(`\n━━ Lighthouse (accessibility only) ${url}`)
        const lhArgs = [
          url,
          '--only-categories=accessibility',
          '--output=json',
          `--output-path=${outPath}`,
          '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage',
          '--quiet',
        ]
        const code = await runNode(lhCli, lhArgs, chromeEnv)
        if (code !== 0) {
          console.log(`   → Lighthouse exited ${code}`)
        }
      }
    } else if (!skipLh) {
      console.log('\n○ Lighthouse skipped (cli not found).')
    }

    await printSummary()
    console.log(`\n▶ Full reports: ${reportDir}\n`)

    if (strict && axeFailed) {
      process.exitCode = 1
    }
  } finally {
    if (browser) {
      await browser.close().catch(() => {})
    }
    if (server && !server.killed) {
      server.kill('SIGTERM')
      await sleep(400)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
