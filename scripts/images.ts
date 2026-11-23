// Real pictures for every line of a story, from Wikipedia and Wikimedia Commons (no Claude tokens).
//
// Claude names, per line, the Wikipedia article whose picture fits (`image.wiki`), or a Commons search
// (`image.search`) when no one article does. We take the article's own lead image, which Wikipedia only offers
// when it is freely licensed, and confirm the licence on Commons (public domain, CC0, CC BY, CC BY-SA). The
// author is kept so the post can credit them.
//
//   npx tsx scripts/images.ts "Juan Pujol García" "search:Normandy landings 1944"
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Photo, Story } from '../src/types'

const UA = 'untold-files/1.0 (open-source short history video renderer)'
const LICENCE_OK = /^(public domain|pd\b|pd-|cc0|cc by(-sa)? \d)/i
const strip = (html = '') => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().replace(/^(.{3,}?)\s*\1$/, '$1')
const STOP = new Set('a an the of in on at to and or for with from by photo photograph picture image old black white'.split(' '))
const words = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w))

async function api(host: string, params: Record<string, string>) {
  const url = `https://${host}/w/api.php?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30_000) })
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      const wait = Math.min(30, Number(res.headers.get('retry-after')) || 5 * attempt)
      await new Promise(r => setTimeout(r, wait * 1000))
      continue
    }
    if (!res.ok)
      throw new Error(`${host} ${res.status}`)
    return res.json() as Promise<any>
  }
}

// Turns one Commons file page (with imageinfo) into a Photo, or null if we may not or should not use it.
function usable(p: any): Omit<Photo, 'ask'> | null {
  const ii = p?.imageinfo?.[0]
  const meta = ii?.extmetadata ?? {}
  const licence = strip(meta.LicenseShortName?.value)
  // SVGs (maps, diagrams) come back as PNG thumbnails, so they work too.
  if (!ii || !/^image\/(jpeg|png|svg\+xml)$/.test(ii.mime) || ii.width < 500 || ii.height < 350 || !LICENCE_OK.test(licence))
    return null
  if (strip(meta.Restrictions?.value))
    return null
  return {
    title: p.title,
    url: ii.thumburl ?? ii.url,
    page: ii.descriptionurl,
    width: ii.thumbwidth ?? ii.width,
    height: ii.thumbheight ?? ii.height,
    licence,
    artist: strip(meta.Artist?.value).slice(0, 80) || 'Unknown',
    description: strip(meta.ImageDescription?.value).slice(0, 200),
  }
}

const INFO = { prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1280' }

// The lead image of an English Wikipedia article, if Wikipedia marks it free and it lives on Commons.
export async function fromArticle(title: string) {
  const w = await api('en.wikipedia.org', { action: 'query', prop: 'pageimages', piprop: 'name', pilicense: 'free', titles: title, redirects: '1' })
  const page = Object.values<any>(w?.query?.pages ?? {})[0]
  if (!page || page.missing !== undefined || !page.pageimage)
    return null
  const c = await api('commons.wikimedia.org', { action: 'query', titles: `File:${page.pageimage}`, ...INFO })
  const photo = usable(Object.values<any>(c?.query?.pages ?? {})[0])
  // Some lead images are about something else (a modern office for a wartime agency); the picture has to
  // mention the subject, or we search Commons instead.
  return photo && hits(page.title ?? title, `${photo.title} ${photo.description}`) > 0 ? photo : null
}

// Share of the subject's words that a picture's title and description mention.
function hits(subject: string, text: string) {
  const q = words(subject)
  const have = new Set(words(text))
  return q.length ? q.filter(w => have.has(w) || have.has(`${w}s`) || have.has(w.replace(/s$/, ''))).length / q.length : 0
}

// The first Commons search result that is about most of the search words.
export async function fromSearch(query: string) {
  const c = await api('commons.wikimedia.org', { action: 'query', generator: 'search', gsrsearch: `${query} filetype:bitmap|drawing`, gsrnamespace: '6', gsrlimit: '12', ...INFO })
  const pages = Object.values<any>(c?.query?.pages ?? {}).sort((a, b) => a.index - b.index)
  for (const p of pages) {
    const photo = usable(p)
    if (!photo)
      continue
    if (hits(query, `${p.title} ${photo.description}`) >= 0.6)
      return photo
  }
  return null
}

// One picture per line: the article's image, else a search for the article title or the given search, else none
// (the line keeps the previous picture).
export async function resolveImages(s: Story): Promise<Array<Photo | null>> {
  const cache = new Map<string, Promise<Photo | null>>()
  const find = (ask: string, how: () => Promise<Omit<Photo, 'ask'> | null>) => {
    if (!cache.has(ask))
      cache.set(ask, how().then(p => (p ? { ask, ...p } : null)).catch(() => null))
    return cache.get(ask)!
  }
  const out: Array<Photo | null> = []
  for (const l of s.lines) {
    const img = l.image
    let p: Photo | null = null
    if (img?.wiki)
      p = await find(`wiki:${img.wiki}`, () => fromArticle(img.wiki!)) ?? await find(`search:${img.wiki}`, () => fromSearch(img.wiki!))
    if (!p && img?.search)
      p = await find(`search:${img.search}`, () => fromSearch(img.search!)) ?? await find(`search:${words(img.search).slice(0, 3).join(' ')}`, () => fromSearch(words(img.search!).slice(0, 3).join(' ')))
    out.push(p)
  }
  return out
}

// Problems worth asking Claude to fix: the first frame needs a picture, and most lines should have one.
export function imageErrors(s: Story, photos: Array<Photo | null>) {
  const errors: string[] = []
  const asked = s.lines.filter(l => l.image).length
  const found = photos.filter(Boolean).length
  if (!photos[0])
    errors.push(`line 1 has no usable picture${s.lines[0].image ? ` for ${JSON.stringify(s.lines[0].image)}` : ''}: name a Wikipedia article with a free lead image (the person, event, place or object itself)`)
  if (found < Math.ceil(s.lines.length / 2))
    errors.push(`only ${found} of ${s.lines.length} lines got a picture: ${s.lines.map((l, i) => (l.image && !photos[i] ? `line ${i + 1} ${JSON.stringify(l.image)}` : '')).filter(Boolean).join('; ')} found nothing usable. Name other articles (people, places, ships, battles, buildings)`)
  if (asked && new Set(photos.filter(Boolean).map(p => p!.title)).size < 3)
    errors.push('fewer than 3 different pictures: name different articles so the picture changes as the story moves')
  return errors
}

// One credit line for the post caption (CC BY and CC BY-SA require it).
export function credits(photos: Array<Photo | null>) {
  const seen = new Map<string, Photo>()
  for (const p of photos) if (p) seen.set(p.title, p)
  if (!seen.size)
    return ''
  return `Images: Wikimedia Commons (${[...seen.values()].map(p => (/public domain|^pd|cc0/i.test(p.licence) ? `${p.artist}, public domain` : `${p.artist}, ${p.licence}`)).join('; ')})`
}

// The picture's bytes; the image servers rate-limit bursts, so wait and retry.
async function fetchFile(p: Photo) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(p.url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60_000) }).catch((e: Error) => {
      if (attempt >= 5)
        throw new Error(`could not download ${p.title}: ${e.message}`)
      return null
    })
    if (!res) {
      await new Promise(r => setTimeout(r, 3000 * attempt))
      continue
    }
    if (res.ok) {
      await new Promise(r => setTimeout(r, 1000))
      return Buffer.from(await res.arrayBuffer())
    }
    if ((res.status !== 429 && res.status < 500) || attempt >= 5)
      throw new Error(`could not download ${p.title}: ${res.status}`)
    await new Promise(r => setTimeout(r, Math.min(30, Number(res.headers.get('retry-after')) || 5 * attempt) * 1000))
  }
}

// Saves each picture into dir; returns the file name per line (null = hold the previous picture).
export async function download(photos: Array<Photo | null>, dir: string) {
  mkdirSync(dir, { recursive: true })
  const files = new Map<string, string>()
  const out: Array<string | null> = []
  for (const p of photos) {
    if (!p) {
      out.push(null)
      continue
    }
    if (!files.has(p.title)) {
      const name = `photo-${files.size}.${/\.png(\?|$)/i.test(p.url) ? 'png' : 'jpg'}`
      if (!existsSync(join(dir, name))) {
        writeFileSync(join(dir, name), await fetchFile(p))
      }
      files.set(p.title, name)
    }
    out.push(files.get(p.title)!)
  }
  return out
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const a of process.argv.slice(2)) {
    const p = a.startsWith('search:') ? await fromSearch(a.slice(7)) : await fromArticle(a)
    console.log(a, '->', p ? `${p.title} (${p.licence}, ${p.artist}) ${p.width}x${p.height}` : null)
  }
}
