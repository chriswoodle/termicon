import { hslString } from './utils/color.ts'
import { SHAPES, shapeIndex } from './shapes.ts'
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

// Renders the identicon using a geometric shape per cell (circle, star, hexagon, etc.),
// selected from SHAPES via the hash's shape byte — a more decorative variant of toSvg.
export function toIconSvg(identicon: IdenticonResult, options: IconSvgOptions = {}): string {
  const pixelSize = options.pixelSize ?? 120
  const padding = options.padding ?? 1
  const { grid } = identicon
  const gridSize = grid.length
  const cellSize = pixelSize / (gridSize + 2 * padding)
  const offset = padding * cellSize
  const foregroundColor = foreground(identicon)
  const shapeFn = SHAPES[shapeIndex(identicon)]!

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
