import { describe, it, expect } from 'vitest'
import { generate } from '../../src/core.ts'
import { toAnsi } from '../../src/ansi.ts'

const RESET = '\x1b[0m'
const ANSI_BG_RE = /\x1b\[48;2;\d+;\d+;\d+m/g
const ANSI_ALL_RE = /\x1b\[[^m]*m/g

describe('toAnsi', () => {
  it('is exported as a function', () => {
    expect(typeof toAnsi).toBe('function')
  })

  it('returns a string', async () => {
    const id = await generate('hello')
    expect(typeof toAnsi(id)).toBe('string')
  })

  it('ends with ANSI reset sequence', async () => {
    const id = await generate('hello')
    expect(toAnsi(id)).toMatch(/\x1b\[0m$/)
  })

  it('has exactly 5 rows separated by newlines', async () => {
    const id = await generate('hello')
    const output = toAnsi(id)
    expect(output.split('\n')).toHaveLength(5)
  })

  it('default cellWidth is 2 spaces per cell', async () => {
    const id = await generate('hello')
    const output = toAnsi(id)
    for (const line of output.split('\n')) {
      const stripped = line.replace(ANSI_ALL_RE, '')
      expect(stripped).toBe(' '.repeat(5 * 2))
    }
  })

  it('custom cellWidth produces correct character width per cell', async () => {
    const id = await generate('hello')
    const output = toAnsi(id, { cellWidth: 4 })
    for (const line of output.split('\n')) {
      const stripped = line.replace(ANSI_ALL_RE, '')
      expect(stripped).toBe(' '.repeat(5 * 4))
    }
  })

  it('each row has exactly 5 truecolor background sequences', async () => {
    const id = await generate('hello')
    const output = toAnsi(id)
    for (const line of output.split('\n')) {
      const seqs = line.match(ANSI_BG_RE) ?? []
      expect(seqs).toHaveLength(5)
    }
  })

  it('on-cells and off-cells use different colors', async () => {
    // '' grid has both on (grid[0][0]=1) and off (grid[0][1]=0) cells
    const id = await generate('')
    const output = toAnsi(id)
    const sequences = output.match(ANSI_BG_RE) ?? []
    const unique = new Set(sequences)
    expect(unique.size).toBeGreaterThanOrEqual(2)
  })

  it('off-cells use neutral background rgb(240,240,240)', async () => {
    const id = await generate('')
    const output = toAnsi(id)
    expect(output).toContain('\x1b[48;2;240;240;240m')
  })

  it('on-cells use truecolor sequence derived from HSL color', async () => {
    const id = await generate('')
    const output = toAnsi(id)
    // off-cell sequence is the neutral one; on-cell must be different
    const sequences = output.match(ANSI_BG_RE) ?? []
    const nonNeutral = sequences.filter(s => s !== '\x1b[48;2;240;240;240m')
    expect(nonNeutral.length).toBeGreaterThan(0)
    // All non-neutral sequences should be the same foreground color
    const unique = new Set(nonNeutral)
    expect(unique.size).toBe(1)
  })

  it('transparent option uses SGR 49 (default background) for off-cells', async () => {
    const id = await generate('')
    const output = toAnsi(id, { transparent: true })
    expect(output).toContain('\x1b[49m')
    expect(output).not.toContain('\x1b[48;2;240;240;240m')
  })

  it('transparent option still uses truecolor sequence for on-cells', async () => {
    const id = await generate('')
    const output = toAnsi(id, { transparent: true })
    const sequences = output.match(/\x1b\[48;2;\d+;\d+;\d+m/g) ?? []
    expect(sequences.length).toBeGreaterThan(0)
  })

  it('transparent:false preserves neutral background rgb(240,240,240)', async () => {
    const id = await generate('')
    const output = toAnsi(id, { transparent: false })
    expect(output).toContain('\x1b[48;2;240;240;240m')
    expect(output).not.toContain('\x1b[49m')
  })

  it('does not import SVG, Canvas, PNG, or ASCII modules', async () => {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync(new URL('../../src/ansi.ts', import.meta.url).pathname, 'utf8')
    expect(src).not.toMatch(/from ['"].*svg/i)
    expect(src).not.toMatch(/from ['"].*canvas/i)
    expect(src).not.toMatch(/from ['"].*png/i)
    expect(src).not.toMatch(/from ['"].*ascii/i)
  })
})
