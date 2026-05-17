import type { IdenticonResult } from './types.ts'

// Deterministic, human-readable fingerprint for an IdenticonResult. Encodes the canonical
// hash-derived properties (grid, color, shape) — palette overrides are intentionally
// excluded so the fingerprint reflects identicon identity, not rendering choices.
//
// Example: '5x5:1010111111110110101000000:hsl(51,45,54):65'
//
// Stable across versions as long as the grid/color/shape semantics don't change. Use in tests:
//   expect(fingerprint(await generate('alice'))).toBe('...')
export function fingerprint(identicon: IdenticonResult): string {
  const { grid, color, shape } = identicon
  const size = grid.length
  const bits = grid.map((row) => row.join('')).join('')
  // Round HSL components to integers for snapshot stability; raw floats churn on refactors.
  const hsl = `hsl(${Math.round(color.h)},${Math.round(color.s)},${Math.round(color.l)})`
  return `${size}x${size}:${bits}:${hsl}:${shape}`
}
