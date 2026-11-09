// The day's story as Claude writes it (mirrors story.schema.json, which is what actually checks it).
// The engine (engine/src/shots.js) draws one scene per line; a line without a scene holds the last shot.
export type Setting = 'parchment' | 'day' | 'field' | 'jungle' | 'sea' | 'hall' | 'room' | 'desert' | 'snow' | 'city'
export type Role = 'king' | 'queen' | 'sailor' | 'scholar' | 'guard' | 'merchant' | 'worker' | 'soldier' | 'officer' | 'pilot' | 'civilian' | 'woman' | 'child'

export type Scene =
  | { type: 'date', text: string, sub?: string, subOn?: string, setting?: Setting, night?: boolean }
  | { type: 'map', title?: string, land?: 'continent' | 'islands', places: Array<{ name: string, x: number, y: number }>, route?: boolean, mover?: 'ship' | 'plane' | 'army' | 'arrow', focus?: string }
  | { type: 'people', setting?: Setting, night?: boolean, figures: Array<{ role: Role, label?: string }>, action?: 'stand' | 'walk' | 'point' | 'wave', text?: string, on?: string }
  | { type: 'object', object: string, setting?: Setting, night?: boolean, text?: string, on?: string, headline?: string, color?: string }
  | { type: 'count', setting?: Setting, night?: boolean, items: Array<{ text: string, on?: string }> }
  | { type: 'timeline', years: string[], active?: number, title?: string }

export interface Line { text: string, caps: string, scene?: Scene }

export interface Story {
  title: string
  category: string
  hook: string
  summary: string
  music: 'tension' | 'bed'
  sources: string[]
  lines: Line[]
  post: { caption: string, hashtags: string[], youtubeTitle: string, xText: string }
}

// scripts/post.ts still calls the day's file a reel.
export type Reel = Story
