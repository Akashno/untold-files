// Renders a story to an MP4: voice (Gemini, else Kokoro) → word timing (Whisper) → frames (headless Chrome) →
// sound (numpy) → ffmpeg. No Claude here.
//
//   npm run make -- reels/2026-11-09.json            -> out/2026-11-09.mp4
//   npm run make -- reels/2026-11-09.json --kokoro   skip Gemini
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import type { Story } from '../src/types'

const ROOT = resolve(import.meta.dirname, '..')
const ENGINE = join(ROOT, 'engine')

// Local runs read keys (GEMINI_API_KEY) from .env; in GitHub Actions they come from secrets.
const dotenv = join(ROOT, '.env')
if (existsSync(dotenv)) {
  for (const line of readFileSync(dotenv, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]])
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}

function python() {
  const c = [process.env.PYTHON, join(ROOT, '.venv/bin/python'), join(homedir(), '.faceless-shorts/venv/bin/python')]
  return c.find(p => p && existsSync(p)) ?? 'python3'
}

// Any Chrome will do; with none installed, fetch the small headless build once.
export function chrome() {
  const known = [process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(p => p && existsSync(p))
  if (known) return known
  const dir = join(homedir(), '.cache/untold-chrome')
  const find = () => {
    if (!existsSync(dir)) return undefined
    const walk = (d: string): string | undefined => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name)
        if (e.isFile() && e.name === 'chrome-headless-shell') return p
        if (e.isDirectory()) { const r = walk(p); if (r) return r }
      }
    }
    return walk(dir)
  }
  if (!find()) {
    console.log('  no Chrome found; downloading chrome-headless-shell once')
    execFileSync('npx', ['-y', '@puppeteer/browsers@2.10.5', 'install', 'chrome-headless-shell@stable', '--path', dir], { stdio: 'inherit' })
  }
  const p = find()
  if (!p) throw new Error('could not find or install Chrome')
  return p
}

const seconds = (f: string) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim())

export async function make(file: string, opts: { kokoro?: boolean } = {}): Promise<{ ok: true, mp4: string, duration: number, engine: string } | { ok: false, errors: string[] }> {
  const story: Story = JSON.parse(readFileSync(file, 'utf8'))
  const name = basename(file, '.json')
  // The engine reads script.json and data/ from its own folder.
  rmSync(join(ENGINE, 'data'), { recursive: true, force: true })
  mkdirSync(join(ENGINE, 'data'), { recursive: true })
  writeFileSync(join(ENGINE, 'script.json'), JSON.stringify({ ...story, voice: 'bm_george', speed: 1.0, lead: 0.35, outro: 2.2, gap: 0.3 }, null, 1))
  const env = { ...process.env, CHROME: chrome() }
  const run = (cmd: string, args: string[]) => {
    const r = spawnSync(cmd, args, { cwd: ENGINE, env, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 })
    const out = `${r.stdout ?? ''}${r.stderr ?? ''}`
    if (r.status !== 0) throw new Error(`${cmd} ${args[0]} failed:\n${out.slice(-1500)}`)
    return out
  }
  try {
    console.log('  voice')
    const v = run(python(), ['tools/narrate.py', '.', ...(opts.kokoro ? ['--kokoro'] : [])])
    const engine = v.match(/ENGINE (\w+)/)?.[1] ?? 'unknown'
    if (/Gemini voice failed/.test(v)) console.log(`  ${v.match(/Gemini voice failed[^\n]*/)![0]}`)
    console.log(`  frames check (voice: ${engine})`)
    const check = run('node', ['tools/capture.mjs', 'check'])
    if (!check.includes('CHECK OK')) throw new Error(`engine check failed:\n${check.slice(-1500)}`)
    run('node', ['tools/capture.mjs', 'cues'])
    console.log('  sound')
    run(python(), ['tools/mix.py', '.'])
    mkdirSync(join(ROOT, 'out'), { recursive: true })
    const mp4 = join(ROOT, 'out', `${name}.mp4`)
    console.log('  render')
    run('node', ['tools/capture.mjs', 'video', mp4])
    run('node', ['tools/capture.mjs', 'sheet', join(ROOT, 'out', `${name}-sheet.jpg`), '1', '10'])
    const duration = seconds(mp4)
    const audio = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=codec_name', '-of', 'csv=p=0', mp4]).toString().trim()
    const errors: string[] = []
    if (duration < 20 || duration > 75) errors.push(`video is ${duration.toFixed(1)}s; expected 20-75s`)
    if (!audio) errors.push('video has no audio track')
    return errors.length ? { ok: false, errors } : { ok: true, mp4, duration, engine }
  }
  catch (e) {
    return { ok: false, errors: [(e as Error).message] }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv.slice(2).find(a => !a.startsWith('--'))
  if (!file) { console.error('Usage: npm run make -- reels/<date>.json [--kokoro]'); process.exit(1) }
  const r = await make(file, { kokoro: process.argv.includes('--kokoro') })
  if (!r.ok) { console.error(`✗ ${r.errors.join('\n  ')}`); process.exit(1) }
  console.log(`✓ ${r.mp4} (${r.duration.toFixed(1)}s, voice: ${r.engine})`)
}
