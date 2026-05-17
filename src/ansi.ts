import { hslToRgb } from './utils/color.ts'
import type { IdenticonResult } from './types.ts'

export interface AnsiOptions {
  cellWidth?: number
  transparent?: boolean
}

// Renders using ANSI 24-bit background color escapes (SGR 48;2;R;G;B). cellWidth defaults to 2
// because most terminals have a ~2:1 character aspect ratio — 1-wide cells look squished.
// Reset (\x1b[0m) is emitted between rows rather than per-cell to keep output compact.
export function toAnsi(identicon: IdenticonResult, options: AnsiOptions = {}): string {
  const cellWidth = options.cellWidth ?? 2
  const { grid, color } = identicon
  const [foregroundRed, foregroundGreen, foregroundBlue] = hslToRgb(color.h, color.s, color.l)

  const foregroundSequence = `\x1b[48;2;${foregroundRed};${foregroundGreen};${foregroundBlue}m`
  const backgroundSequence = options.transparent ? '\x1b[49m' : `\x1b[48;2;240;240;240m`
  const reset = '\x1b[0m'
  const cell = ' '.repeat(cellWidth)

  const rows: string[] = []
  for (let row = 0; row < grid.length; row++) {
    let line = ''
    for (let col = 0; col < grid[row]!.length; col++) {
      line += (grid[row][col] ? foregroundSequence : backgroundSequence) + cell
    }
    rows.push(line)
  }

  return rows.join(reset + '\n') + reset
}
