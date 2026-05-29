import { describe, it, expect } from 'vitest'
import { generate } from '../../src/core.ts'
import { toAscii } from '../../src/ascii.ts'

const ANSI_BG_RE = /\x1b\[48;2;\d+;\d+;\d+m/g
const ANSI_ALL_RE = /\x1b\[[^m]*m/g
const NEUTRAL_BG = '\x1b[48;2;240;240;240m'

describe('toAscii style: block', () => {
  it('returns a string', async () => {
    const id = await generate('hello')
    expect(typeof toAscii(id, { style: 'block' })).toBe('string')
  })

  it('ends with ANSI reset sequence', async () => {
    const id = await generate('hello')
    expect(toAscii(id, { style: 'block' })).toMatch(/\x1b\[0m$/)
  })

  it('has exactly 5 rows separated by newlines', async () => {
    const id = await generate('hello')
    expect(toAscii(id, { style: 'block' }).split('\n')).toHaveLength(5)
  })

  it('default cellWidth is 2 spaces per cell', async () => {
    const id = await generate('hello')
    for (const line of toAscii(id, { style: 'block' }).split('\n')) {
      expect(line.replace(ANSI_ALL_RE, '')).toBe(' '.repeat(5 * 2))
    }
  })

  it('custom cellWidth produces correct width per cell', async () => {
    const id = await generate('hello')
    for (const line of toAscii(id, { style: 'block', cellWidth: 4 }).split('\n')) {
      expect(line.replace(ANSI_ALL_RE, '')).toBe(' '.repeat(5 * 4))
    }
  })

  it('each row has exactly 5 truecolor background sequences', async () => {
    const id = await generate('hello')
    for (const line of toAscii(id, { style: 'block' }).split('\n')) {
      expect((line.match(ANSI_BG_RE) ?? [])).toHaveLength(5)
    }
  })

  it('off-cells use neutral background rgb(240,240,240)', async () => {
    const id = await generate('')
    expect(toAscii(id, { style: 'block' })).toContain(NEUTRAL_BG)
  })

  it('transparent option uses SGR 49 for off-cells', async () => {
    const id = await generate('')
    const output = toAscii(id, { style: 'block', transparent: true })
    expect(output).toContain('\x1b[49m')
    expect(output).not.toContain(NEUTRAL_BG)
  })
})

describe('toAscii style: halfblock', () => {
  it('returns a string', async () => {
    const id = await generate('hello')
    expect(typeof toAscii(id, { style: 'halfblock' })).toBe('string')
  })

  it('packs two grid rows per line (5×5 → 3 lines)', async () => {
    const id = await generate('hello')
    expect(toAscii(id, { style: 'halfblock' }).split('\n')).toHaveLength(3)
  })

  it('uses the upper half-block glyph', async () => {
    const id = await generate('hello')
    expect(toAscii(id, { style: 'halfblock' })).toContain('▀')
  })

  it('emits both foreground and background truecolor escapes', async () => {
    const id = await generate('')
    const output = toAscii(id, { style: 'halfblock' })
    expect(output).toMatch(/\x1b\[38;2;\d+;\d+;\d+m/)
    expect(output).toMatch(/\x1b\[48;2;\d+;\d+;\d+m/)
  })

  it('transparent option uses default fg/bg (SGR 39/49) for off-pixels', async () => {
    const id = await generate('')
    const output = toAscii(id, { style: 'halfblock', transparent: true })
    expect(output).toContain('\x1b[49m')
    expect(output).not.toContain(NEUTRAL_BG)
  })
})
