import { shapeGlyph } from './shapes.ts'
import { resolveRgb, parseCssColor } from './utils/color.ts'
import type { IdenticonResult } from './types.ts'

export interface AsciiOptions {
  // Rendering technique:
  //  'text'      (default) — a grid of characters ('#'/'.' or, with variant:'icons', shape glyphs).
  //                With color:false and variant:'squares' the output is plain ASCII with no escape
  //                codes — the fallback for environments without color or Unicode support.
  //  'block'     — solid truecolor cells drawn with background-color escapes (two columns per cell
  //                by default, since terminal cells are ~2:1 tall, so 1-wide cells look squished).
  //  'halfblock' — the upper half-block glyph '▀' packs two grid rows into one line (foreground =
  //                upper pixel, background = lower pixel), so the icon looks ~square in half the lines.
  style?: 'text' | 'block' | 'halfblock'
  // Columns per cell. Defaults to 1 for 'text' and 2 for 'block'; ignored by 'halfblock'.
  cellWidth?: number
  // 'text' style only:
  onChar?: string
  offChar?: string
  variant?: 'squares' | 'icons'
  // Colorize 'text' output with a truecolor ANSI foreground (and dim off-cells). Defaults to true.
  // Set false for plain, escape-free text. Ignored by 'block'/'halfblock', which are always colored.
  color?: boolean
  // 'block'/'halfblock' off-cell color: `transparent` uses the terminal default; `background` sets a
  // specific CSS color (hex, rgb(), hsl()). Mutually exclusive.
  transparent?: boolean
  background?: string
}

const RESET = '\x1b[0m'
const UPPER_HALF = '▀'

// Off-cell color for the colored styles. null means "use the terminal default" (transparent).
function offRgb(options: AsciiOptions): [number, number, number] | null {
  if (options.transparent) return null
  if (options.background) {
    const parsed = parseCssColor(options.background)
    if (parsed) return parsed
  }
  return [240, 240, 240]
}

// 'text': a grid of characters, one per cell, optionally colored. The classic identicon look, and
// the only style that works without color or Unicode support (variant:'squares', color:false).
// With variant:'icons', on-cells use the shape glyph (●, ◆, ★, …) selected from the same shape byte
// that drives toIconSvg, so terminal and SVG output stay visually in sync. An explicit `onChar`
// always wins over the variant default.
function renderText(identicon: IdenticonResult, options: AsciiOptions): string {
  const cellWidth = options.cellWidth ?? 1
  const variant = options.variant ?? 'squares'
  const onChar = options.onChar ?? (variant === 'icons' ? shapeGlyph(identicon) : '#')
  const offChar = options.offChar ?? '.'
  const color = options.color ?? true
  const { grid } = identicon

  const [r, g, b] = color ? resolveRgb(identicon) : [0, 0, 0]
  const onSeq = color ? `\x1b[38;2;${r};${g};${b}m` : ''
  const offSeq = color ? '\x1b[2m' : ''
  const reset = color ? RESET : ''

  const rows: string[] = []
  for (let row = 0; row < grid.length; row++) {
    let line = ''
    for (let col = 0; col < grid[row]!.length; col++) {
      const on = grid[row][col]
      const cell = (on ? onChar : offChar).repeat(cellWidth)
      line += (on ? onSeq : offSeq) + cell + reset
    }
    rows.push(line)
  }
  return rows.join('\n')
}

// 'block': solid truecolor cells via background-color escapes (SGR 48;2;R;G;B). The reset is emitted
// between rows rather than per-cell to keep the output compact.
function renderBlock(identicon: IdenticonResult, options: AsciiOptions): string {
  const cellWidth = options.cellWidth ?? 2
  const { grid } = identicon
  const [r, g, b] = resolveRgb(identicon)
  const off = offRgb(options)

  const onSeq = `\x1b[48;2;${r};${g};${b}m`
  const offSeq = off ? `\x1b[48;2;${off[0]};${off[1]};${off[2]}m` : '\x1b[49m'
  const cell = ' '.repeat(cellWidth)

  const rows: string[] = []
  for (let row = 0; row < grid.length; row++) {
    let line = ''
    for (let col = 0; col < grid[row]!.length; col++) {
      line += (grid[row][col] ? onSeq : offSeq) + cell
    }
    rows.push(line)
  }
  return rows.join(RESET + '\n') + RESET
}

// 'halfblock': pack two grid rows per line using '▀' — foreground is the upper pixel, background the
// lower. An odd-height grid leaves the final cell's lower half off.
function renderHalfBlock(identicon: IdenticonResult, options: AsciiOptions): string {
  const { grid } = identicon
  const [r, g, b] = resolveRgb(identicon)
  const off = offRgb(options)

  const fgOn = `\x1b[38;2;${r};${g};${b}m`
  const bgOn = `\x1b[48;2;${r};${g};${b}m`
  const fgOff = off ? `\x1b[38;2;${off[0]};${off[1]};${off[2]}m` : '\x1b[39m'
  const bgOff = off ? `\x1b[48;2;${off[0]};${off[1]};${off[2]}m` : '\x1b[49m'

  const lines: string[] = []
  for (let row = 0; row < grid.length; row += 2) {
    const topRow = grid[row]!
    const bottomRow = grid[row + 1]
    let line = ''
    for (let col = 0; col < topRow.length; col++) {
      const top = !!topRow[col]
      const bottom = bottomRow ? !!bottomRow[col] : false
      line += (top ? fgOn : fgOff) + (bottom ? bgOn : bgOff) + UPPER_HALF
    }
    lines.push(line)
  }
  return lines.join(RESET + '\n') + RESET
}

// Renders an identicon as text. The `style` option selects the technique — see AsciiOptions.
export function toAscii(identicon: IdenticonResult, options: AsciiOptions = {}): string {
  switch (options.style ?? 'text') {
    case 'block':
      return renderBlock(identicon, options)
    case 'halfblock':
      return renderHalfBlock(identicon, options)
    default:
      return renderText(identicon, options)
  }
}
