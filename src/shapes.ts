import type { IdenticonResult } from './types.ts'

// Names of the geometric shapes in display order. Index aligns with SHAPE_GLYPHS and SHAPES
// so a single shape byte selects the same shape across every renderer.
export const SHAPE_NAMES = [
  'circle',
  'diamond',
  'triangle-up',
  'triangle-down',
  'star',
  'cross',
  'hexagon',
  'rounded-square',
] as const

// Single-character Unicode glyphs that visually mirror the SVG shape renderers — used by
// text-mode renderers (toAscii icon variant) and the sample script's terminal output.
export const SHAPE_GLYPHS = ['●', '◆', '▲', '▼', '★', '✚', '⬡', '■'] as const

export type ShapeName = (typeof SHAPE_NAMES)[number]

// Signature for an SVG shape renderer — takes a cell center, half-extent, and CSS color
// and returns an SVG element string.
export type ShapeFn = (cx: number, cy: number, r: number, color: string) => string

function poly(points: [number, number][], color: string): string {
  return `<polygon points="${points.map(([x, y]) => `${x},${y}`).join(' ')}" fill="${color}"/>`
}

export const SHAPES: ShapeFn[] = [
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

// Wraps the identicon's raw shape byte into the shape table. All renderers share this so
// the glyph in toAscii's icon variant always matches the polygon in toIconSvg.
export function shapeIndex(identicon: IdenticonResult): number {
  return identicon.shape % SHAPE_NAMES.length
}

export function shapeName(identicon: IdenticonResult): ShapeName {
  return SHAPE_NAMES[shapeIndex(identicon)]!
}

export function shapeGlyph(identicon: IdenticonResult): string {
  return SHAPE_GLYPHS[shapeIndex(identicon)]!
}
