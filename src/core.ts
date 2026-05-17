import { sha256 } from './utils/hash.ts'
import { hslString } from './utils/color.ts'
import { pickFromPalette, type Palette } from './utils/palette.ts'
import type { IdenticonResult } from './types.ts'

export interface GenerateOptions {
  size?: 2 | 3 | 5
  // Mixed into the hash input as `${seed}\0${input}` — lets you produce a stable visual
  // that's tied to the seed rather than the raw input (e.g., an account ID that may rename).
  seed?: string
  // Named preset or array of CSS colors. When set, foreground color is picked from the palette
  // using a hash byte for deterministic selection. 'default' uses the hash-derived HSL color.
  palette?: Palette
}

// Extracts bit i from the hash, treating it as a big-endian bit stream (MSB of byte 0 = bit 0).
function bit(hash: Uint8Array, i: number): number {
  return (hash[i >> 3]! >> (7 - (i & 7))) & 1
}

function buildResult(hash: Uint8Array, size: 2 | 3 | 5, palette: Palette | undefined): IdenticonResult {
  let grid: number[][]

  switch (size) {
    case 5:
      // 5x5: column-major for left 3 cols (bits 0–14), mirror cols 3–4
      grid = Array.from({ length: 5 }, () => new Array(5).fill(0))
      for (let col = 0; col < 3; col++) {
        for (let row = 0; row < 5; row++) {
          grid[row][col] = bit(hash, col * 5 + row)
        }
      }
      for (let row = 0; row < 5; row++) {
        grid[row][3] = grid[row][1]
        grid[row][4] = grid[row][0]
      }
      break
    case 3:
      // 3x3: left 2 cols from bits 152–157 (hash bytes 19–20), mirror col 2 = col 0
      grid = Array.from({ length: 3 }, () => new Array(3).fill(0))
      for (let col = 0; col < 2; col++) {
        for (let row = 0; row < 3; row++) {
          grid[row][col] = bit(hash, 152 + col * 3 + row)
        }
      }
      for (let row = 0; row < 3; row++) {
        grid[row][2] = grid[row][0]
      }
      break
    case 2:
      // 2x2: 4 independent cells from bits 176–179 (hash byte 22)
      grid = Array.from({ length: 2 }, () => new Array(2).fill(0))
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 2; col++) {
          grid[row][col] = bit(hash, 176 + row * 2 + col)
        }
      }
      break
    default:
      throw new RangeError(`Invalid size: ${size}. Must be 2, 3, or 5.`)
  }

  // Hue: full 0–360° range. Saturation: 40–70%, lightness: 40–60% — narrowed to avoid
  // washed-out pastels or near-black/white results. Values are floating-point; do not round.
  const color = {
    h: (hash[15]! / 255) * 360,
    s: 40 + (hash[16]! / 255) * 30,
    l: 40 + (hash[17]! / 255) * 20,
  }

  // Raw byte used by icon renderers to select a shape; wraps via modulo into the shape table.
  const shape = hash[18]!

  // Palette resolution: pick a stable color from the palette using byte 21, or fall back to HSL.
  const paletteColor = palette ? pickFromPalette(palette, hash[21]!) : null
  const cssColor = paletteColor ?? hslString(color.h, color.s, color.l)

  return { grid, color, shape, cssColor }
}

// Seed is mixed in via NUL separator so `seed=a, input=b` and `seed=ab, input=''` don't collide.
function withSeed(input: string, seed: string | undefined): string {
  return seed == null ? input : `${seed}\0${input}`
}

// Generates a deterministic identicon from an arbitrary Unicode string.
// Input is hashed with SHA-256; the hash drives the grid, color, and shape.
export async function generate(input: string, options: GenerateOptions = {}): Promise<IdenticonResult> {
  const hash = await sha256(withSeed(input, options.seed))
  return buildResult(hash, options.size ?? 5, options.palette)
}
