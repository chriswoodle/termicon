import { describe, it, expect } from 'vitest'
import { generate } from '../../src/core.ts'
import { toAscii } from '../../src/ascii.ts'

describe('toAscii', () => {
  it('is exported as a function', () => {
    expect(typeof toAscii).toBe('function')
  })

  it('returns a string', async () => {
    const id = await generate('hello')
    expect(typeof toAscii(id)).toBe('string')
  })

  it('has exactly 5 rows separated by newlines', async () => {
    const id = await generate('hello')
    expect(toAscii(id).split('\n')).toHaveLength(5)
  })

  it('contains zero ANSI escape codes', async () => {
    const id = await generate('hello')
    expect(toAscii(id)).not.toMatch(/\x1b\[/)
  })

  it('uses only # and . characters (plus newlines)', async () => {
    const id = await generate('hello')
    expect(toAscii(id)).toMatch(/^[#.\n]+$/)
  })

  it('default cellWidth produces 5 chars per row', async () => {
    const id = await generate('hello')
    for (const line of toAscii(id).split('\n')) {
      expect(line).toHaveLength(5)
    }
  })

  it('custom cellWidth produces correct character width per row', async () => {
    const id = await generate('hello')
    for (const line of toAscii(id, { cellWidth: 3 }).split('\n')) {
      expect(line).toHaveLength(15)
    }
  })

  it('renders correct on/off pattern for known input', async () => {
    // Empty string grid: [[1,0,1,0,1],[1,1,1,1,1],[1,1,0,1,1],[0,1,0,1,0],[0,0,0,0,0]]
    const id = await generate('')
    const rows = toAscii(id).split('\n')
    expect(rows[0]).toBe('#.#.#')
    expect(rows[1]).toBe('#####')
    expect(rows[2]).toBe('##.##')
    expect(rows[3]).toBe('.#.#.')
    expect(rows[4]).toBe('.....')
  })

  it('on-cells use # and off-cells use .', async () => {
    const id = await generate('')
    const output = toAscii(id)
    expect(output).toContain('#')
    expect(output).toContain('.')
  })

  it('custom onChar replaces # in output', async () => {
    const id = await generate('')
    const output = toAscii(id, { onChar: 'X' })
    expect(output).toContain('X')
    expect(output).not.toContain('#')
  })

  it('custom offChar replaces . in output', async () => {
    const id = await generate('')
    const output = toAscii(id, { offChar: ' ' })
    expect(output).not.toContain('.')
  })

  it('custom onChar and offChar together', async () => {
    const id = await generate('')
    const rows = toAscii(id, { onChar: '1', offChar: '0' }).split('\n')
    expect(rows[0]).toBe('10101')
    expect(rows[4]).toBe('00000')
  })

  it('does not import SVG, Canvas, PNG, or ANSI modules', async () => {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync(new URL('../../src/ascii.ts', import.meta.url).pathname, 'utf8')
    expect(src).not.toMatch(/from ['"].*svg/i)
    expect(src).not.toMatch(/from ['"].*canvas/i)
    expect(src).not.toMatch(/from ['"].*png/i)
    expect(src).not.toMatch(/from ['"].*ansi/i)
  })
})
