// Writes today's story with ONE headless Claude Code call (your Claude subscription, no API key).
//
//   npm run write                              -> reels/<next slot>.json (scripts/slot.mjs)
//   npm run write -- --id 2026-11-10-1900      a given slot
//   npm run write -- --topic "the Gimli Glider"  tell a story you choose
//
// Claude gets the brief, today's category (the one used least recently) and every past title, and returns
// JSON matching story.schema.json. The result is checked; only if it fails is Claude asked once more,
// with the exact problems.
import { nextSlot } from './slot.mjs'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import Ajv from 'ajv'
import { BRAND } from '../src/brand'
import type { Story } from '../src/types'

const ROOT = resolve(import.meta.dirname, '..')
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')
const MODEL = process.env.CLAUDE_MODEL ?? 'sonnet'
const TRIES = 2

export interface HistoryEntry { date: string, title: string, category: string, summary: string, status: 'test' | 'rendered' | 'posted' | 'failed' }
export const HISTORY = join(ROOT, 'data/history.json')
export const loadHistory = (): HistoryEntry[] => (existsSync(HISTORY) ? JSON.parse(readFileSync(HISTORY, 'utf8')) : [])
export const today = () => new Date(Date.now() + BRAND.timezone.offsetMinutes * 60e3).toISOString().slice(0, 10)

// ---- checks the schema can't express ----------------------------------------------------------
const SCHEMA = JSON.parse(read('story.schema.json'))
const validate = new Ajv({ allErrors: true, strict: false }).compile(SCHEMA)
const SLOP = [/\bturns out\b/i, /\bgame[- ]?changer/i, /\blittle did (he|she|they) know\b/i, /\bunbelievable\b/i, /\byou won'?t believe\b/i, /\bshocking\b/i, /\blegend has it\b/i, /\bjourney\b/i, /\bdelve/i, /\btestament\b/i, /—/, /\bdid you know\b/i, /\bin this video\b/i]
const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9']+/g, '')
const count = (s: string) => s.split(/\s+/).filter(Boolean).length

// Small caption slips aren't worth a second Claude call: a chunk with no *word gets its longest word starred,
// and a chunk with several keeps only the first.
export function fixCaps(s: Story) {
  for (const l of s.lines ?? []) {
    l.caps = l.caps.split('|').map((c) => {
      const ws = c.trim().split(/\s+/).filter(Boolean)
      const starred = ws.filter(w => w.startsWith('*')).length
      if (starred === 1 || !ws.length) return c.trim()
      if (starred > 1) { let seen = false; return ws.map(w => (w.startsWith('*') ? (seen ? w.slice(1) : ((seen = true), w)) : w)).join(' ') }
      const k = ws.reduce((b, w, j) => (w.replace(/[^\p{L}\p{N}]/gu, '').length > ws[b].replace(/[^\p{L}\p{N}]/gu, '').length ? j : b), 0)
      return ws.map((w, j) => (j === k ? `*${w}` : w)).join(' ')
    }).join(' | ')
  }
}

// Props are SVG drawn by Claude. They are only ever drawn as images in the renderer (scripts never run there), but
// anything that isn't plain shapes is refused anyway, and they must be used.
const SVG_BAD = /<\s*(script|foreignObject|image|img|iframe|style|text|a|use|filter|animate|set)\b|\bon[a-z]+\s*=|\b(?:xlink:)?href\s*=|url\(\s*['"]?(?!#)|javascript:|@import|<!/i
export function checkProps(s: Story): string[] {
  const errors: string[] = []
  const names = new Set(s.props.map(p => p.name))
  const used = new Set<string>()
  for (const p of s.props) {
    const svg = p.svg.trim()
    if (!/^<svg\b[^>]*viewBox="0 0 400 400"/.test(svg) || !svg.endsWith('</svg>'))
      errors.push(`prop "${p.name}": must be one <svg viewBox="0 0 400 400">…</svg>`)
    const bad = svg.match(SVG_BAD)
    if (bad) errors.push(`prop "${p.name}": "${bad[0]}" is not allowed; use plain shapes only`)
    const opens = (svg.match(/<[a-zA-Z][^>]*[^/]>|<[a-zA-Z]>/g) ?? []).length, closes = (svg.match(/<\/[a-zA-Z]+\s*>/g) ?? []).length
    if (opens !== closes) errors.push(`prop "${p.name}": the SVG tags don't balance (${opens} open, ${closes} closed)`)
  }
  s.lines.forEach((l, i) => {
    const sc: any = l.scene
    for (const ref of [sc?.object, sc?.item, ...(sc?.actors ?? []).map((a: any) => a.art)]) {
      if (typeof ref !== 'string' || !ref.startsWith('prop:')) continue
      if (!names.has(ref.slice(5))) errors.push(`line ${i + 1}: "${ref}" is not one of your props`)
      used.add(ref.slice(5))
    }
  })
  for (const n of names) if (!used.has(n)) errors.push(`prop "${n}" is never shown; use it in a scene or drop it`)
  return errors
}

// the hook must open on the strange fact, not on scene-setting
const HOOK_SLOW = /^(in|on|back in|during|once|one day|years ago|long ago|there (was|were|is)|it (was|is)|this is|meet)\b/i
const YEAR_WORDS = /\b(eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)[ -](hundred|oh|o'|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\b|\btwo thousand\b/i

export function checkStory(x: unknown): string[] {
  if (!validate(x))
    return (validate.errors ?? []).slice(0, 12).map(e => `${e.instancePath || '/'} ${e.message}`)
  const s = x as Story
  const errors: string[] = []
  const words = s.lines.reduce((n, l) => n + count(l.text), 0)
  if (words < 62 || words > 95)
    errors.push(`the narration is ${words} words; write 70-85`)
  const first = s.lines[0]
  if (!first.scene)
    errors.push('line 1 needs a scene')
  else if (!['action', 'people', 'object'].includes(first.scene.type))
    errors.push(`line 1 is the frame people decide on: make it an "action" scene of the most dramatic moment (or people/object), not "${first.scene.type}"`)
  if (count(first.text) > 16)
    errors.push('the first line (the hook) is too long; 16 words at most')
  if (HOOK_SLOW.test(first.text.trim()) || YEAR_WORDS.test(first.text))
    errors.push(`line 1 starts slow ("${first.text.split(/\s+/).slice(0, 4).join(' ')}…"): open with the strange fact itself, and give the year or place in line 2`)
  const actions = s.lines.filter(l => l.scene?.type === 'action').length
  if (actions < 2)
    errors.push(`only ${actions} "action" scene(s); show the 2-3 big moments of the story as action scenes`)
  s.lines.forEach((l, i) => {
    const n = count(l.text)
    if (n > 18)
      errors.push(`line ${i + 1} has ${n} words; split it into two lines`)
    if (/\d/.test(l.text))
      errors.push(`line ${i + 1}: write numbers as words in "text" (digits are fine in "caps")`)
    for (const c of l.caps.split('|')) {
      const stars = (c.match(/\*/g) ?? []).length
      if (stars !== 1)
        errors.push(`line ${i + 1}: caption chunk "${c.trim()}" needs exactly one *word`)
    }
    const sc: any = l.scene
    const said = l.text.split(/\s+/).map(norm)
    const spoken = { has: (w: string) => !!w && said.some(x => x.startsWith(w)) }
    for (const a of sc?.type === 'action' ? sc.actors : [])
      if (a.on && !spoken.has(norm(a.on.split(/\s+/)[0])))
        errors.push(`line ${i + 1}: actor on "${a.on}" is not a word in that line`)
    for (const k of ['on', 'subOn'])
      if (sc?.[k] && !spoken.has(norm(sc[k].split(/\s+/)[0])))
        errors.push(`line ${i + 1}: "${k}": "${sc[k]}" is not a word in that line`)
    for (const it of sc?.type === 'count' ? sc.items : [])
      if (it.on && !spoken.has(norm(it.on.split(/\s+/)[0])))
        errors.push(`line ${i + 1}: count item on "${it.on}" is not a word in that line`)
    if (sc?.type === 'map' && sc.focus && !sc.places.some((p: any) => p.name.toLowerCase() === sc.focus.toLowerCase()))
      errors.push(`line ${i + 1}: map focus "${sc.focus}" is not one of its places`)
    if (sc?.type === 'timeline' && sc.active != null && sc.active >= sc.years.length)
      errors.push(`line ${i + 1}: timeline active ${sc.active} is past its last year`)
  })
  errors.push(...checkProps(s))
  const types = s.lines.map(l => l.scene?.type).filter(Boolean) as string[]
  if (new Set(types).size < 4)
    errors.push(`only ${new Set(types).size} different scene types; use at least 4`)
  for (let i = 2; i < types.length; i++)
    if (types[i] === types[i - 1] && types[i] === types[i - 2])
      errors.push(`three "${types[i]}" scenes in a row; vary the pictures`)
  if (!s.post.hashtags.some(h => h.toLowerCase() === BRAND.hashtag.toLowerCase()))
    errors.push(`hashtags must include ${BRAND.hashtag}`)
  const all = [...s.lines.map(l => l.text), s.post.caption, s.post.youtubeTitle, s.post.xText].join('\n')
  for (const re of SLOP) {
    const m = all.match(re)
    if (m) errors.push(`"${m[0]}" sounds like clickbait or AI writing; say it plainly`)
  }
  return errors
}

// ---- novelty -----------------------------------------------------------------------------------
const STOP = new Set('a an the and or but of to in on at for with who was were his her their that this from by how why what one man woman'.split(' '))
const bag = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)))
function similar(a: string, b: string) {
  const A = bag(a), B = bag(b)
  if (!A.size || !B.size) return 0
  let n = 0
  for (const w of A) if (B.has(w)) n++
  return n / (A.size + B.size - n)
}
function noveltyErrors(s: Story, history: HistoryEntry[]) {
  return history.filter(h => similar(`${s.title} ${s.summary}`, `${h.title} ${h.summary}`) > 0.4)
    .map(h => `too close to a past video, "${h.title}" (${h.date}): pick a different story`)
}

// ---- prompt --------------------------------------------------------------------------------------
function fill(text: string) {
  const vars: Record<string, string> = { name: BRAND.name, handle: BRAND.handle, hashtag: BRAND.hashtag, pitch: BRAND.pitch, audience: BRAND.audience }
  return text.replace(/\{\{(\w+)\}\}/g, (all, k: string) => vars[k] ?? all)
}
function pickCategory(history: HistoryEntry[], date: string) {
  const cats: Array<{ id: string, brief: string }> = JSON.parse(read('brand/topics.json'))
  const last = (id: string) => history.filter(h => h.category === id).map(h => h.date).sort().at(-1) ?? ''
  const seed = Number(date.replaceAll('-', ''))
  return [...cats].sort((a, b) => last(a.id).localeCompare(last(b.id)) || ((cats.indexOf(a) + seed) % cats.length) - ((cats.indexOf(b) + seed) % cats.length))[0]
}
function buildPrompt(date: string, cat: { id: string, brief: string }, history: HistoryEntry[], topic?: string) {
  return [
    `# Today\n\nVideo: ${date} (date and post time). Category: **${cat.id}**: ${cat.brief}\nSet "category" to exactly "${cat.id}".`,
    ...(topic ? [`Tell this story: ${topic}`] : []),
    '# Past videos (never repeat these stories, people or events)',
    history.length ? history.slice(-300).reverse().map(h => `- ${h.title}`).join('\n') : '(none yet: this is the first one)',
  ].join('\n\n')
}

function askClaude(prompt: string, system: string): { out?: Story, error?: string, tokens?: string } {
  const r = spawnSync('claude', ['-p', '--model', MODEL, '--tools', '', '--no-session-persistence', '--strict-mcp-config', '--disable-slash-commands',
    '--output-format', 'json', '--json-schema', JSON.stringify(SCHEMA), '--system-prompt', system],
  { input: prompt, encoding: 'utf8', cwd: ROOT, timeout: 300_000, maxBuffer: 20 * 1024 * 1024 })
  if (r.error) return { error: `could not run claude: ${r.error.message}` }
  let out: any
  try { out = JSON.parse(r.stdout) }
  catch { return { error: `claude exited ${r.status}: ${(r.stderr || r.stdout).slice(0, 400)}` } }
  if (out.is_error || !out.structured_output)
    return { error: `claude returned nothing usable (${out.subtype ?? 'error'}): ${String(out.result ?? '').slice(0, 300)}` }
  const u = out.usage ?? {}
  const n = (k: string) => u[k] ?? 0
  const total = n('input_tokens') + n('cache_creation_input_tokens') + n('cache_read_input_tokens') + n('output_tokens')
  return { out: out.structured_output, tokens: `${total} tokens (${n('output_tokens')} out), ${Math.round((out.duration_ms ?? 0) / 1000)}s` }
}

export async function write(date: string, topic?: string): Promise<{ ok: true, file: string, story: Story } | { ok: false, errors: string[] }> {
  const history = loadHistory().filter(h => h.date < date)
  const cat = pickCategory(history, date)
  const base = buildPrompt(date, cat, history, topic)
  const system = fill(read('prompts/writer.md'))
  console.log(`Writing ${date}: category "${cat.id}" (${MODEL})`)
  let prompt = base
  let errors: string[] = []
  for (let attempt = 1; attempt <= TRIES; attempt++) {
    const res = askClaude(prompt, system)
    if (!res.out) {
      errors = [res.error!]
      console.log(`  attempt ${attempt}: ${res.error}`)
      if (/authenticat|401|invalid api key|oauth/i.test(res.error!)) break
      continue
    }
    const story = res.out
    story.category = cat.id
    fixCaps(story)
    errors = [...checkStory(story), ...noveltyErrors(story, history)]
    console.log(`  attempt ${attempt}: "${story.title}" (${res.tokens})${errors.length ? `, rejected:\n    ${errors.join('\n    ')}` : ''}`)
    if (!errors.length) {
      mkdirSync(join(ROOT, 'reels'), { recursive: true })
      const file = join(ROOT, 'reels', `${date}.json`)
      writeFileSync(file, `${JSON.stringify(story, null, 2)}\n`)
      return { ok: true, file, story }
    }
    prompt = `${base}\n\n# Your previous attempt was rejected\n\n${errors.map(e => `- ${e}`).join('\n')}\n\nPrevious attempt:\n${JSON.stringify(story)}\n\nFix every problem and return the complete story.`
  }
  return { ok: false, errors }
}

export function record(date: string, s: Story, status: HistoryEntry['status']) {
  const history = loadHistory().filter(h => h.date !== date)
  history.push({ date, title: s.title, category: s.category, summary: s.summary, status })
  history.sort((a, b) => a.date.localeCompare(b.date))
  mkdirSync(join(ROOT, 'data'), { recursive: true })
  writeFileSync(HISTORY, `${JSON.stringify(history, null, 2)}\n`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const i = Math.max(process.argv.indexOf('--id'), process.argv.indexOf('--date'))
  const date = i > 0 ? process.argv[i + 1] : nextSlot({ any: true })
  if (process.argv.includes('--check')) {
    const errors = checkStory(JSON.parse(readFileSync(process.argv.at(-1)!, 'utf8')))
    console.log(errors.length ? `✗ ${errors.join('\n  ')}` : '✓ story passes the checks')
    process.exit(errors.length ? 1 : 0)
  }
  const t = process.argv.indexOf('--topic')
  const r = await write(date, t > 0 ? process.argv[t + 1] : undefined)
  if (!r.ok) {
    console.error(`✗ no usable story:\n  ${r.errors.join('\n  ')}`)
    process.exit(1)
  }
  console.log(`✓ ${r.file}`)
}
