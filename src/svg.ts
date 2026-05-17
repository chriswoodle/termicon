import { hslString } from './utils/color.ts'
import type { IdenticonResult } from './types.ts'

const DEFAULT_BG = '#f0f0f0'

function foreground(id: IdenticonResult): string {
  return id.cssColor ?? hslString(id.color.h, id.color.s, id.color.l)
}

function backgroundRect(pixelSize: number, opts: { transparent?: boolean; background?: string }): string {
  if (opts.transparent) return ''
  const bg = opts.background ?? DEFAULT_BG
  return `<rect width="${pixelSize}" height="${pixelSize}" fill="${bg}"/>`
}

export interface SvgOptions {
  pixelSize?: number
  padding?: number
  transparent?: boolean
  background?: string
}

// Renders the identicon as a grid of squares — classic pixel-art style.
// Coordinate system: origin top-left, x right, y down. cellSize = pixelSize / (gridSize + 2*padding).
export function toSvg(identicon: IdenticonResult, options: SvgOptions = {}): string {
  const pixelSize = options.pixelSize ?? 120
  const padding = options.padding ?? 1
  const { grid } = identicon
  const gridSize = grid.length
  const cellSize = pixelSize / (gridSize + 2 * padding)
  const offset = padding * cellSize
  const foregroundColor = foreground(identicon)

  let rects = backgroundRect(pixelSize, options)
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (grid[row][col]) {
        const x = offset + col * cellSize
        const y = offset + row * cellSize
        rects += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${foregroundColor}"/>`
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelSize}" height="${pixelSize}">${rects}</svg>`
}

export interface IconSvgOptions {
  pixelSize?: number
  padding?: number
  transparent?: boolean
  background?: string
}

type ShapeFn = (cx: number, cy: number, r: number, color: string) => string

function poly(points: [number, number][], color: string): string {
  return `<polygon points="${points.map(([x, y]) => `${x},${y}`).join(' ')}" fill="${color}"/>`
}

const SHAPES: ShapeFn[] = [
  // circle
  (cx, cy, r, c) => `<circle cx="${cx}" cy="${cy}" r="${r * 0.85}" fill="${c}"/>`,

  // diamond
  (cx, cy, r, c) => {
    const p = r * 0.9
    return poly([[cx, cy - p], [cx + p, cy], [cx, cy + p], [cx - p, cy]], c)
  },

  // triangle pointing up
  (cx, cy, r, c) => {
    const p = r * 0.92
    return poly([[cx, cy - p], [cx + p, cy + p * 0.87], [cx - p, cy + p * 0.87]], c)
  },

  // triangle pointing down
  (cx, cy, r, c) => {
    const p = r * 0.92
    return poly([[cx, cy + p], [cx + p, cy - p * 0.87], [cx - p, cy - p * 0.87]], c)
  },

  // 5-pointed star (10 alternating outer/inner vertices)
  (cx, cy, r, c) => {
    const outer = r * 0.9
    const inner = r * 0.38
    const pts: [number, number][] = Array.from({ length: 10 }, (_, i) => {
      const angle = (i * Math.PI) / 5 - Math.PI / 2
      const rad = i % 2 === 0 ? outer : inner
      return [cx + rad * Math.cos(angle), cy + rad * Math.sin(angle)]
    })
    return poly(pts, c)
  },

  // plus / cross (12-point rectilinear shape)
  (cx, cy, r, c) => {
    const a = r * 0.9
    const b = r * 0.32
    return poly([
      [cx - b, cy - a], [cx + b, cy - a],
      [cx + b, cy - b], [cx + a, cy - b],
      [cx + a, cy + b], [cx + b, cy + b],
      [cx + b, cy + a], [cx - b, cy + a],
      [cx - b, cy + b], [cx - a, cy + b],
      [cx - a, cy - b], [cx - b, cy - b],
    ], c)
  },

  // hexagon
  (cx, cy, r, c) => {
    const p = r * 0.9
    const pts: [number, number][] = Array.from({ length: 6 }, (_, i) => {
      const angle = (i * Math.PI) / 3 - Math.PI / 6
      return [cx + p * Math.cos(angle), cy + p * Math.sin(angle)]
    })
    return poly(pts, c)
  },

  // rounded square
  (cx, cy, r, c) => {
    const s = r * 1.7
    const rx = r * 0.35
    return `<rect x="${cx - s / 2}" y="${cy - s / 2}" width="${s}" height="${s}" rx="${rx}" fill="${c}"/>`
  },
]

// Renders the identicon using a geometric shape per cell (circle, star, hexagon, etc.),
// selected from SHAPES via the hash's shape byte — a more decorative variant of toSvg.
export function toIconSvg(identicon: IdenticonResult, options: IconSvgOptions = {}): string {
  const pixelSize = options.pixelSize ?? 120
  const padding = options.padding ?? 1
  const { grid, shape } = identicon
  const gridSize = grid.length
  const cellSize = pixelSize / (gridSize + 2 * padding)
  const offset = padding * cellSize
  const foregroundColor = foreground(identicon)
  // shape byte from hash wraps into the available shapes
  const shapeFn = SHAPES[shape % SHAPES.length]!

  let elements = backgroundRect(pixelSize, options)
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (grid[row][col]) {
        const cx = offset + col * cellSize + cellSize / 2
        const cy = offset + row * cellSize + cellSize / 2
        elements += shapeFn(cx, cy, cellSize / 2, foregroundColor)
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelSize}" height="${pixelSize}">${elements}</svg>`
}

// Returns a data URI for the SVG output. Drop straight into <img src> or CSS background-image.
// Uses utf8-encoded URL-escaped payload (smaller than base64 for SVG).
export function toDataUri(identicon: IdenticonResult, options: SvgOptions = {}): string {
  const svg = toSvg(identicon, options)
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// Like toDataUri but uses the icon variant.
export function toIconDataUri(identicon: IdenticonResult, options: IconSvgOptions = {}): string {
  const svg = toIconSvg(identicon, options)
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
