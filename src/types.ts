// The day's story as Claude writes it (mirrors story.schema.json, which is what actually checks it).
// One real picture per line, named by Claude and found by scripts/images.ts. A line without an image keeps the
// previous picture on screen.
export interface Image { wiki?: string, search?: string }
export interface Line { text: string, caps: string, image?: Image }

// A picture found on Wikimedia Commons (filled in by the pipeline, never by Claude), with its credit.
export interface Photo { ask: string, title: string, url: string, page: string, width: number, height: number, licence: string, artist: string, description: string }

export interface Story {
  title: string
  category: string
  hook: string
  headline: { top: string, bottom: string }
  summary: string
  music: 'tension' | 'bed'
  sources: string[]
  lines: Line[]
  photos?: Array<Photo | null> // one per line, by scripts/write.ts
  post: { caption: string, hashtags: string[], youtubeTitle: string, xText: string }
}

// scripts/post.ts still calls the day's file a reel.
export type Reel = Story
