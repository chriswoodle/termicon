import { shapeGlyph } from './shapes.ts'
import type { IdenticonResult } from './types.ts'

export interface AsciiOptions {
  cellWidth?: number
  onChar?: string
  offChar?: string
  // 'squares' (default) keeps the classic '#' / '.' grid. 'icons' picks the Unicode glyph
  // that matches the shape chosen by toIconSvg for the same identicon.
  variant?: 'squares' | 'icons'
}

// Renders the identicon as plain text — '#' for on cells, '.' for off. No padding around the grid.
// With variant: 'icons', on-cells use the shape glyph (●, ◆, ★, …) selected from the same shape
// byte that drives toIconSvg, so terminal and SVG output stay visually in sync. An explicit
// `onChar` always wins over the variant default.
export function toAscii(identicon: IdenticonResult, options: AsciiOptions = {}): string {
  const cellWidth = options.cellWidth ?? 1
  const variant = options.variant ?? 'squares'
  const onChar = options.onChar ?? (variant === 'icons' ? shapeGlyph(identicon) : '#')
  const offChar = options.offChar ?? '.'
  const { grid } = identicon
  const rows: string[] = []
  for (let row = 0; row < grid.length; row++) {
    let line = ''
    for (let col = 0; col < grid[row]!.length; col++) {
      line += (grid[row][col] ? onChar : offChar).repeat(cellWidth)
    }
    rows.push(line)
  }
  return rows.join('\n')
}
