// The channel's identity lives in brand/brand.json. Code reads it only through here.
import raw from '../brand/brand.json'

export interface Brand {
  name: string
  handle: string // shown on the end card
  hashtag: string // required in every post
  pitch: string
  audience: string
  timezone: { label: string, offsetMinutes: number }
  slots: string[] // HH:MM post times in that timezone, one video each (scripts/slot.mjs)
}

export const BRAND = raw as Brand
