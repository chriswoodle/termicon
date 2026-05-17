import { hslToRgb, parseCssColor } from './utils/color.ts'
import type { IdenticonResult } from './types.ts'

export interface AnsiOptions {
  cellWidth?: number
  transparent?: boolean
  // CSS color (hex, rgb(), or hsl()) used as the off-cell background. Named colors aren't
  // supported — ANSI escapes are truecolor RGB. Mutually exclusive with `transparent: true`.
  background?: string
}

export interface AnsiWritable {
  write(chunk: string): unknown
}

// Resolves the on-cell color: prefer the parsed cssColor (palette-aware) but fall back to
// the hash-derived HSL for legacy IdenticonResult values that lack cssColor.
function foregroundRgb(identicon: IdenticonResult): [number, number, number] {
  if (identicon.cssColor) {
    const parsed = parseCssColor(identicon.cssColor)
    if (parsed) return parsed
  }
  return hslToRgb(identicon.color.h, identicon.color.s, identicon.color.l)
}

function backgroundSequence(options: AnsiOptions): string {
  if (options.transparent) return '\x1b[49m'
  if (options.background) {
    const rgb = parseCssColor(options.background)
    if (rgb) return `\x1b[48;2;${rgb[0]};${rgb[1]};${rgb[2]}m`
  }
  return '\x1b[48;2;240;240;240m'
}

// Renders using ANSI 24-bit background color escapes (SGR 48;2;R;G;B). cellWidth defaults to 2
// because most terminals have a ~2:1 character aspect ratio — 1-wide cells look squished.
// Reset (\x1b[0m) is emitted between rows rather than per-cell to keep output compact.
function toAnsiImpl(identicon: IdenticonResult, options: AnsiOptions = {}): string {
  const cellWidth = options.cellWidth ?? 2
  const { grid } = identicon
  const [r, g, b] = foregroundRgb(identicon)

  const foregroundSeq = `\x1b[48;2;${r};${g};${b}m`
  const backgroundSeq = backgroundSequence(options)
  const reset = '\x1b[0m'
  const cell = ' '.repeat(cellWidth)

  const rows: string[] = []
  for (let row = 0; row < grid.length; row++) {
    let line = ''
    for (let col = 0; col < grid[row]!.length; col++) {
      line += (grid[row][col] ? foregroundSeq : backgroundSeq) + cell
    }
    rows.push(line)
  }

  return rows.join(reset + '\n') + reset
}

// Writes the ANSI rendering to a stream, appending a trailing newline so the cursor lands
// on a fresh line after the identicon. Saves callers from manually appending '\n'.
function writeAnsi(identicon: IdenticonResult, stream: AnsiWritable, options: AnsiOptions = {}): void {
  stream.write(toAnsiImpl(identicon, options) + '\n')
}

// Merged callable + namespace: toAnsi(id) returns the string; toAnsi.write(id, stream) pipes it.
export const toAnsi = Object.assign(toAnsiImpl, { write: writeAnsi })
