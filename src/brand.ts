// The channel's identity lives in brand/brand.json. Code reads it only through here.
import raw from '../brand/brand.json'

export interface Brand {
  name: string
  handle: string // shown on the end card
  hashtag: string // required in every post
  pitch: string
  audience: string
  timezone: { label: string, offsetMinutes: number }
  postAt: string // HH:MM in that timezone
}

export const BRAND = raw as Brand
