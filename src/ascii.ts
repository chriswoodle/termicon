import type { IdenticonResult } from './types.ts'

export interface AsciiOptions {
  cellWidth?: number
  onChar?: string
  offChar?: string
}

// Renders the identicon as plain text — '#' for on cells, '.' for off. No padding around the grid.
export function toAscii(identicon: IdenticonResult, options: AsciiOptions = {}): string {
  const cellWidth = options.cellWidth ?? 1
  const onChar = options.onChar ?? '#'
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
