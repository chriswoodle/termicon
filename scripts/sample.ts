import { writeFileSync, mkdirSync } from 'node:fs'
import { generate } from '../src/index.ts'
import { toAnsi } from '../src/ansi.ts'
import { toSvg, toIconSvg } from '../src/svg.ts'
import { hslToRgb } from '../src/utils/color.ts'
import type { IdenticonResult } from '../src/types.ts'

const SAMPLES = [
  'alice',
  'bob',
  'charlie',
  'hello world',
  '0x1a2b3c',
  'termicon',
]

const SHAPE_NAMES = ['circle', 'diamond', 'triangle-up', 'triangle-down', 'star', 'cross', 'hexagon', 'rounded-square']
const SHAPE_GLYPHS = ['●', '◆', '▲', '▼', '★', '✚', '⬡', '■']

function toIconAnsi(id: IdenticonResult): string {
  const { grid, color, shape } = id
  const glyph = SHAPE_GLYPHS[shape % SHAPE_GLYPHS.length]!
  const [r, g, b] = hslToRgb(color.h, color.s, color.l)
  const fg = `\x1b[38;2;${r};${g};${b}m`
  const dim = '\x1b[2m'
  const reset = '\x1b[0m'
  return grid.map(row =>
    row.map(on => on ? `${fg}${glyph}${reset}` : `${dim}·${reset}`).join(' ')
  ).join('\n')
}

function toHalfBlockAnsi(id: IdenticonResult): string {
  const { grid, color } = id
  const [r, g, b] = hslToRgb(color.h, color.s, color.l)
  const colorOn = `\x1b[38;2;${r};${g};${b}m`
  const colorOff = `\x1b[38;2;240;240;240m`
  const bgOn = `\x1b[48;2;${r};${g};${b}m`
  const bgOff = `\x1b[48;2;240;240;240m`
  const reset = '\x1b[0m'
  const lines: string[] = []
  for (let row = 0; row < grid.length; row += 2) {
    let line = ''
    for (let col = 0; col < grid[row]!.length; col++) {
      const top = grid[row]![col]
      const bottom = row + 1 < grid.length ? grid[row + 1]![col] : 0
      line += (top ? colorOn : colorOff) + (bottom ? bgOn : bgOff) + '▀'
    }
    lines.push(line + reset)
  }
  return lines.join('\n')
}

const B = '\x1b[1m'
const DIM = '\x1b[2m'
const RST = '\x1b[0m'
const RULE = DIM + '─'.repeat(30) + RST

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[^m]*m/g, '')
}

function sideBySide(left: string, right: string, gap = 6): string {
  const ll = left.split('\n')
  const rl = right.split('\n')
  const w = Math.max(...ll.map(l => stripAnsi(l).length))
  const count = Math.max(ll.length, rl.length)
  return Array.from({ length: count }, (_, i) => {
    const l = ll[i] ?? ''
    const r = rl[i] ?? ''
    return l + ' '.repeat(w - stripAnsi(l).length + gap) + r
  }).join('\n')
}

function label(text: string): string {
  return DIM + text + RST
}

function indent(s: string, n = 2): string {
  const pad = ' '.repeat(n)
  return s.split('\n').map(l => pad + l).join('\n')
}

interface Card {
  input: string
  shapeName: string
  svg5sq: string
  svg5ico: string
  svg5sqT: string
  svg5icoT: string
  svg3: string
  svg2: string
  accentRgb: string
}

async function main(): Promise<void> {
  const W = 54
  console.log()
  console.log('  ' + B + 'termicon' + RST + DIM + '  ─  sample outputs' + RST)
  console.log('  ' + DIM + '═'.repeat(W) + RST)

  const cards: Card[] = []

  for (const input of SAMPLES) {
    const [id5, id3, id2] = await Promise.all([
      generate(input, { size: 5 }),
      generate(input, { size: 3 }),
      generate(input, { size: 2 }),
    ])

    const shapeName = SHAPE_NAMES[id5.shape % SHAPE_NAMES.length]!
    const glyph = SHAPE_GLYPHS[id5.shape % SHAPE_GLYPHS.length]!
    const [r, g, b] = hslToRgb(id5.color.h, id5.color.s, id5.color.l)
    const fg = `\x1b[38;2;${r};${g};${b}m`

    console.log()
    console.log('  ' + RULE)
    console.log(`  ${fg}${glyph}${RST}  ${B}"${input}"${RST}  ${DIM}${shapeName}${RST}`)
    console.log()

    const squaresAnsi  = toAnsi(id5, { cellWidth: 2 })
    const squaresAnsiT = toAnsi(id5, { cellWidth: 2, transparent: true })
    const iconsAnsi    = toIconAnsi(id5)
    const half3        = toHalfBlockAnsi(id3)
    const half2        = toHalfBlockAnsi(id2)

    const mainBlock = sideBySide(
      sideBySide(
        label('squares') + '\n' + squaresAnsi,
        label('sq · α')  + '\n' + squaresAnsiT,
      ),
      label('icons') + '\n' + iconsAnsi,
    )
    console.log(indent(mainBlock, 4))
    console.log()

    const smallBlock = sideBySide(
      label('3×3') + '\n' + half3,
      label('2×2') + '\n' + half2,
      10,
    )
    console.log(indent(smallBlock, 4))
    console.log()

    const svg5sq   = toSvg(id5,     { pixelSize: 160, padding: 1 })
    const svg5ico  = toIconSvg(id5, { pixelSize: 160, padding: 1 })
    const svg5sqT  = toSvg(id5,     { pixelSize: 160, padding: 1, transparent: true })
    const svg5icoT = toIconSvg(id5, { pixelSize: 160, padding: 1, transparent: true })
    const svg3     = toSvg(id3,     { pixelSize: 80,  padding: 1 })
    const svg2     = toSvg(id2,     { pixelSize: 56,  padding: 1 })

    const accentRgb = `${r},${g},${b}`

    cards.push({ input, shapeName, svg5sq, svg5ico, svg5sqT, svg5icoT, svg3, svg2, accentRgb })
  }

  const cardHtml = cards.map(({ input, shapeName, svg5sq, svg5ico, svg5sqT, svg5icoT, svg3, svg2, accentRgb }) => `
    <article class="card" style="--accent:${accentRgb}">
      <header class="card-head">
        <span class="card-label">${input}</span>
        <span class="card-shape">${shapeName}</span>
      </header>
      <div class="card-body">
        <div class="main-icons">
          <div class="icon-slot">
            <div class="icon-caption">squares</div>
            ${svg5sq}
          </div>
          <div class="icon-slot">
            <div class="icon-caption">icons</div>
            ${svg5ico}
          </div>
          <div class="icon-slot">
            <div class="icon-caption">sq · α</div>
            ${svg5sqT}
          </div>
          <div class="icon-slot">
            <div class="icon-caption">ico · α</div>
            ${svg5icoT}
          </div>
        </div>
        <div class="side-icons">
          <div class="icon-slot small">
            <div class="icon-caption">3×3</div>
            ${svg3}
          </div>
          <div class="icon-slot small">
            <div class="icon-caption">2×2</div>
            ${svg2}
          </div>
        </div>
      </div>
    </article>`).join('\n')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>termicon — samples</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:      #0d0d11;
      --surface: #16161e;
      --border:  #232330;
      --text:    #d4d4e8;
      --muted:   #5a5a78;
      --radius:  10px;
      font-size: 15px;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 3rem 3.5rem 4rem;
      min-height: 100vh;
    }

    .page-header {
      margin-bottom: 2.75rem;
      display: flex;
      align-items: baseline;
      gap: 1.25rem;
    }

    .page-header h1 {
      font-size: 1.6rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      color: #fff;
    }

    .page-header p {
      font-size: 0.9rem;
      color: var(--muted);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.1rem 1.1rem 1rem;
      position: relative;
      overflow: hidden;
    }

    .card::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: var(--radius);
      pointer-events: none;
    }

    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.9rem;
      gap: 0.5rem;
    }

    .card-label {
      font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
      font-size: 0.82rem;
      color: var(--text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .card-shape {
      font-size: 0.68rem;
      color: var(--muted);
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      border-radius: 100px;
      padding: 2px 9px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .card-body {
      display: flex;
      gap: 0.75rem;
      align-items: flex-end;
    }

    .main-icons {
      display: flex;
      gap: 0.6rem;
    }

    .side-icons {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      margin-left: auto;
      align-items: flex-end;
    }

    .icon-slot {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .icon-caption {
      font-size: 0.6rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.07em;
      text-align: center;
    }

    .icon-slot svg {
      border-radius: 7px;
      display: block;
    }

    .icon-slot.small svg {
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <header class="page-header">
    <h1>termicon</h1>
    <p>Deterministic identicons from any string</p>
  </header>
  <div class="grid">
    ${cardHtml}
  </div>
</body>
</html>`

  mkdirSync('samples', { recursive: true })
  writeFileSync('samples/index.html', html)
  console.log('HTML preview written to samples/index.html\n')
}

main().catch((err: unknown) => { console.error(err); process.exit(1) })
