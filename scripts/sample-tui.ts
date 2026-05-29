import process from 'node:process'
import { generate } from '../src/index.ts'
import { toAscii } from '../src/ascii.ts'
import { resolveRgb } from '../src/utils/color.ts'
import type { IdenticonResult } from '../src/types.ts'

// ── A tiny demo TUI: a profile / account-switcher screen built around a termicon
// identicon. Big ASCII banner up top, the account's identicon + details, and a
// navigable menu. Run with `yarn sample:tui`.
//
//   ↑/↓  move the menu cursor      ←/→ (or Tab) switch account
//   enter  "open" the menu item    q / Ctrl-C  quit

// ── styling ────────────────────────────────────────────────────────────────
const RST = '\x1b[0m'
const B = '\x1b[1m'
const DIM = '\x1b[2m'
const fg = (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`
const bg = (r: number, g: number, b: number) => `\x1b[48;2;${r};${g};${b}m`

const ansi = /\x1b\[[0-9;?]*[A-Za-z]/g
const stripAnsi = (s: string) => s.replace(ansi, '')
const visLen = (s: string) => stripAnsi(s).length

function padEndV(s: string, n: number): string {
  const len = visLen(s)
  return len >= n ? s : s + ' '.repeat(n - len)
}

function center(s: string, width: number): string {
  const len = visLen(s)
  if (len >= width) return s
  return ' '.repeat(Math.floor((width - len) / 2)) + s
}

// ── a small 5-row block font for the banner ──────────────────────────────────
const G: Record<string, string[]> = {
  ' ': ['   ', '   ', '   ', '   ', '   '],
  A: [' ██ ', '█  █', '████', '█  █', '█  █'],
  B: ['███ ', '█  █', '███ ', '█  █', '███ '],
  C: [' ███', '█   ', '█   ', '█   ', ' ███'],
  D: ['███ ', '█  █', '█  █', '█  █', '███ '],
  E: ['████', '█   ', '███ ', '█   ', '████'],
  F: ['████', '█   ', '███ ', '█   ', '█   '],
  G: [' ███', '█   ', '█ ██', '█  █', ' ███'],
  H: ['█  █', '█  █', '████', '█  █', '█  █'],
  I: ['███', ' █ ', ' █ ', ' █ ', '███'],
  J: ['  ██', '   █', '   █', '█  █', ' ██ '],
  K: ['█  █', '█ █ ', '██  ', '█ █ ', '█  █'],
  L: ['█   ', '█   ', '█   ', '█   ', '████'],
  M: ['█   █', '██ ██', '█ █ █', '█   █', '█   █'],
  N: ['█  █', '██ █', '█ ██', '█  █', '█  █'],
  O: [' ██ ', '█  █', '█  █', '█  █', ' ██ '],
  P: ['███ ', '█  █', '███ ', '█   ', '█   '],
  Q: [' ██ ', '█  █', '█  █', '█ ██', ' ███'],
  R: ['███ ', '█  █', '███ ', '█ █ ', '█  █'],
  S: [' ███', '█   ', ' ██ ', '   █', '███ '],
  T: ['█████', '  █  ', '  █  ', '  █  ', '  █  '],
  U: ['█  █', '█  █', '█  █', '█  █', ' ██ '],
  V: ['█   █', '█   █', '█   █', ' █ █ ', '  █  '],
  W: ['█   █', '█   █', '█ █ █', '██ ██', '█   █'],
  X: ['█   █', ' █ █ ', '  █  ', ' █ █ ', '█   █'],
  Y: ['█   █', ' █ █ ', '  █  ', '  █  ', '  █  '],
  Z: ['█████', '   █ ', '  █  ', ' █   ', '█████'],
  '0': [' ██ ', '█  █', '█  █', '█  █', ' ██ '],
  '1': [' █ ', '██ ', ' █ ', ' █ ', '███'],
  '2': ['███ ', '   █', ' ██ ', '█   ', '████'],
  '3': ['███ ', '   █', ' ██ ', '   █', '███ '],
  '4': ['█  █', '█  █', '████', '   █', '   █'],
  '5': ['████', '█   ', '███ ', '   █', '███ '],
  '6': [' ██ ', '█   ', '███ ', '█  █', ' ██ '],
  '7': ['████', '   █', '  █ ', ' █  ', ' █  '],
  '8': [' ██ ', '█  █', ' ██ ', '█  █', ' ██ '],
  '9': [' ██ ', '█  █', ' ███', '   █', ' ██ '],
}

function banner(text: string): string[] {
  const rows = ['', '', '', '', '']
  const chars = text.toUpperCase().split('')
  chars.forEach((ch, idx) => {
    const glyph = G[ch] ?? G[' ']
    const w = Math.max(...glyph.map(r => r.length))
    for (let i = 0; i < 5; i++) {
      rows[i] += (glyph[i] ?? '').padEnd(w, ' ')
      if (idx < chars.length - 1) rows[i] += ' '
    }
  })
  // Double every column so each lit pixel becomes a full 2-wide square ('██'),
  // matching the identicon's block cells instead of thin 1-wide strokes.
  return rows.map(row => [...row].map(c => c + c).join(''))
}

// ── box drawing ──────────────────────────────────────────────────────────────
function box(lines: string[], width: number, pad = 1): string[] {
  const inner = width + pad * 2
  const p = ' '.repeat(pad)
  const top = '╭' + '─'.repeat(inner) + '╮'
  const bot = '╰' + '─'.repeat(inner) + '╯'
  const body = lines.map(l => `│${p}${padEndV(l, width)}${p}│`)
  return [top, ...body, bot]
}

// ── data ─────────────────────────────────────────────────────────────────────
interface RawAccount {
  name: string
  user: string
  email: string
  plan: string
  role: string
  location: string
  since: string
  status: 'Online' | 'Away' | 'Offline'
}

interface Account extends RawAccount {
  id: IdenticonResult
  ascii: string
  rgb: [number, number, number]
}

const RAW_ACCOUNTS: RawAccount[] = [
  { name: 'Marie Curie',       user: 'mcurie',        email: 'marie@radium.fr',       plan: 'Pro',        role: 'Owner',     location: 'Paris, FR',      since: 'Nov 2020', status: 'Online' },
  { name: 'Nikola Tesla',      user: 'n.tesla',       email: 'nikola@wardenclyffe.io',plan: 'Enterprise', role: 'Admin',     location: 'New York, NY',   since: 'Feb 2018', status: 'Away' },
  { name: 'Rosalind Franklin', user: 'rfranklin',     email: 'rosalind@kings.ac.uk',  plan: 'Team',       role: 'Developer', location: 'London, UK',     since: 'May 2022', status: 'Online' },
  { name: 'Carl Sagan',        user: 'carl.sagan',    email: 'carl@cosmos.tv',        plan: 'Pro',        role: 'Member',    location: 'Ithaca, NY',     since: '1934',     status: 'Online' },
]

const MENU = ['Profile', 'Account settings', 'Billing & plan', 'API keys', 'Sign out']

const WIDTH = 60

// ── render ───────────────────────────────────────────────────────────────────
let accounts: Account[] = []
let accountIdx = 3 // start on Carl Sagan
let menuIdx = 0
let status = ''

function render(): string {
  const a = accounts[accountIdx]!
  const accent = fg(...a.rgb)
  const lines: string[] = []

  // banner, drawn with the same full-square cells as the identicon and tinted
  // with the selected account's accent color; the panel widens to fit it
  const bannerRows = banner('TERMICON')
  const W = Math.max(WIDTH, visLen(bannerRows[0]!))
  lines.push('') // top breathing room inside the box
  for (const row of bannerRows) {
    lines.push(accent + center(row, W) + RST)
  }
  lines.push('')
  lines.push(DIM + center('· account ·', W) + RST)
  lines.push('')

  // identicon (left) beside account details (right) — both 5 rows tall
  const idRows = a.ascii.split('\n')
  const statusColor =
    a.status === 'Online' ? fg(46, 204, 113)
      : a.status === 'Away' ? fg(243, 156, 18)
        : fg(127, 140, 141)
  const info = [
    B + a.name + RST + DIM + '   ' + a.role + RST,
    DIM + '@' + a.user + RST + '   ' + accent + '◆ ' + a.plan + RST,
    DIM + '✉  ' + a.email + RST,
    statusColor + '● ' + a.status + RST + DIM + '  ·  ' + a.location + RST,
    DIM + 'Member since ' + a.since + RST,
  ]
  for (let i = 0; i < 5; i++) {
    lines.push('  ' + padEndV(idRows[i] ?? '', 10) + '    ' + (info[i] ?? ''))
  }

  lines.push('')
  lines.push(DIM + '─'.repeat(W) + RST)
  lines.push('')

  // menu
  MENU.forEach((item, i) => {
    if (i === menuIdx) {
      lines.push(accent + ' ▸ ' + RST + B + item + RST)
    } else {
      lines.push(DIM + '   ' + item + RST)
    }
  })

  lines.push('')
  if (status) {
    lines.push(accent + ' ' + status + RST)
  } else {
    lines.push(DIM + ' ↑/↓ navigate   ←/→ switch account   enter open   q quit' + RST)
  }
  lines.push('') // bottom breathing room inside the box

  // outer left margin (4) + interior horizontal padding (3) for breathing room
  return box(lines, W, 3).map(l => '    ' + l).join('\n')
}

// ── terminal control ─────────────────────────────────────────────────────────
function draw(): void {
  process.stdout.write('\x1b[2J\x1b[H')
  process.stdout.write('\n\n' + render() + '\n\n')
}

function cleanup(): void {
  process.stdout.write('\x1b[?25h') // show cursor
  if (process.stdin.isTTY) process.stdin.setRawMode(false)
}

async function main(): Promise<void> {
  accounts = await Promise.all(
    RAW_ACCOUNTS.map(async raw => {
      const id = await generate(raw.user, { size: 5 })
      return {
        ...raw,
        id,
        ascii: toAscii(id, { style: 'block', cellWidth: 2, transparent: true }),
        rgb: resolveRgb(id),
      }
    }),
  )

  // Non-interactive (piped / CI): render once and exit cleanly.
  if (!process.stdin.isTTY) {
    console.log('\n\n' + render() + '\n\n')
    return
  }

  const N = accounts.length
  process.stdout.write('\x1b[?25l') // hide cursor
  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.setEncoding('utf8')
  draw()

  process.stdin.on('data', (key: string) => {
    status = ''
    switch (key) {
      case '\x03': // Ctrl-C
      case 'q':
        cleanup()
        process.stdout.write('\x1b[2J\x1b[H')
        process.exit(0)
        break
      case '\x1b[A': // up
        menuIdx = (menuIdx - 1 + MENU.length) % MENU.length
        break
      case '\x1b[B': // down
        menuIdx = (menuIdx + 1) % MENU.length
        break
      case '\x1b[D': // left
        accountIdx = (accountIdx - 1 + N) % N
        menuIdx = 0
        break
      case '\x1b[C': // right
      case '\t': // tab
        accountIdx = (accountIdx + 1) % N
        menuIdx = 0
        break
      case '\r': // enter
        status = `opened "${MENU[menuIdx]}" for ${accounts[accountIdx]!.name}`
        break
    }
    draw()
  })
}

process.on('SIGINT', () => { cleanup(); process.exit(0) })

main().catch((err: unknown) => { cleanup(); console.error(err); process.exit(1) })
