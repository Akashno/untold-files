// The day's story as Claude writes it (mirrors story.schema.json, which is what actually checks it).
// The engine (engine/src/shots.js) draws one scene per line; a line without a scene holds the last shot.
export type Setting = 'sky' | 'parchment' | 'day' | 'field' | 'jungle' | 'sea' | 'hall' | 'room' | 'desert' | 'snow' | 'city'
export type Role = 'king' | 'queen' | 'sailor' | 'scholar' | 'guard' | 'merchant' | 'worker' | 'soldier' | 'officer' | 'pilot' | 'civilian' | 'woman' | 'child' | 'man' | 'girl' | 'boy' | 'scientist' | 'oldman' | 'oldwoman'
export type Hair = 'black' | 'brown' | 'blonde' | 'red' | 'grey'
export type Skin = 'light' | 'medium' | 'tan' | 'dark'

export type Scene =
  | { type: 'date', text: string, sub?: string, subOn?: string, setting?: Setting, night?: boolean }
  | { type: 'map', title?: string, land?: 'continent' | 'islands', places: Array<{ name: string, x: number, y: number }>, route?: boolean, mover?: 'ship' | 'plane' | 'army' | 'arrow', focus?: string }
  | { type: 'people', setting?: Setting, night?: boolean, item?: string, figures: Array<{ role: Role, label?: string, skin?: Skin, hair?: Hair }>, action?: 'stand' | 'walk' | 'point' | 'wave', text?: string, on?: string }
  | { type: 'object', object: string, setting?: Setting, night?: boolean, text?: string, on?: string, headline?: string, color?: string }
  | { type: 'count', setting?: Setting, night?: boolean, items: Array<{ text: string, on?: string }> }
  | { type: 'timeline', years: string[], active?: number, title?: string }
  | { type: 'action', setting?: Setting, night?: boolean, text?: string, on?: string, actors: Actor[] }
export interface Actor {
  /** a library object, prop:<name> or person:<role> */
  art: string, x: number, y: number, size?: 'small' | 'medium' | 'large',
  move: 'still' | 'float' | 'fly' | 'fall' | 'crash' | 'split' | 'sink' | 'rise' | 'spin' | 'shake' | 'grow' | 'walk',
  dir?: 'left' | 'right', on?: string, skin?: Skin, hair?: Hair
}

export interface Line { text: string, caps: string, scene?: Scene }
export interface Prop { name: string, svg: string }

export interface Story {
  title: string
  category: string
  hook: string
  headline: { top: string, bottom: string }
  summary: string
  music: 'tension' | 'bed'
  sources: string[]
  props: Prop[]
  lines: Line[]
  post: { caption: string, hashtags: string[], youtubeTitle: string, xText: string }
}

// scripts/post.ts still calls the day's file a reel.
export type Reel = Story
