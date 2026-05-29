import { describe, it, expect } from 'vitest'
import { generate } from '../../src/core.ts'
import { toAscii } from '../../src/ascii.ts'
import { SHAPE_GLYPHS, shapeGlyph } from '../../src/shapes.ts'

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

  it('applies color (ANSI escapes) by default', async () => {
    const id = await generate('hello')
    expect(toAscii(id)).toMatch(/\x1b\[/)
  })

  it('color: false contains zero ANSI escape codes', async () => {
    const id = await generate('hello')
    expect(toAscii(id, { color: false })).not.toMatch(/\x1b\[/)
  })

  it('color: false uses only # and . characters (plus newlines)', async () => {
    const id = await generate('hello')
    expect(toAscii(id, { color: false })).toMatch(/^[#.\n]+$/)
  })

  it('on-cells carry a truecolor foreground sequence, off-cells are dimmed', async () => {
    const id = await generate('hello')
    const output = toAscii(id)
    expect(output).toMatch(/\x1b\[38;2;\d+;\d+;\d+m/)
    expect(output).toContain('\x1b[2m')
  })

  it('default cellWidth produces 5 chars per row (ignoring escapes)', async () => {
    const id = await generate('hello')
    for (const line of toAscii(id, { color: false }).split('\n')) {
      expect(line).toHaveLength(5)
    }
  })

  it('custom cellWidth produces correct character width per row', async () => {
    const id = await generate('hello')
    for (const line of toAscii(id, { cellWidth: 3, color: false }).split('\n')) {
      expect(line).toHaveLength(15)
    }
  })

  it('renders correct on/off pattern for known input', async () => {
    // Empty string grid: [[1,0,1,0,1],[1,1,1,1,1],[1,1,0,1,1],[0,1,0,1,0],[0,0,0,0,0]]
    const id = await generate('')
    const rows = toAscii(id, { color: false }).split('\n')
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
    const rows = toAscii(id, { onChar: '1', offChar: '0', color: false }).split('\n')
    expect(rows[0]).toBe('10101')
    expect(rows[4]).toBe('00000')
  })

  describe('variant: icons', () => {
    it('uses the shape glyph instead of # for on-cells', async () => {
      const id = await generate('')
      const glyph = shapeGlyph(id)
      const output = toAscii(id, { variant: 'icons' })
      expect(output).toContain(glyph)
      expect(output).not.toContain('#')
    })

    it('picks the same glyph index as toIconSvg (shape byte modulo glyph count)', async () => {
      const id = await generate('alice@example.com')
      const expected = SHAPE_GLYPHS[id.shape % SHAPE_GLYPHS.length]!
      expect(toAscii(id, { variant: 'icons' })).toContain(expected)
    })

    it('renders the correct on/off pattern with glyphs', async () => {
      const id = await generate('')
      const glyph = shapeGlyph(id)
      const rows = toAscii(id, { variant: 'icons', color: false }).split('\n')
      expect(rows[0]).toBe(`${glyph}.${glyph}.${glyph}`)
      expect(rows[4]).toBe('.....')
    })

    it('explicit onChar wins over the variant default glyph', async () => {
      const id = await generate('hello')
      const output = toAscii(id, { variant: 'icons', onChar: 'X' })
      expect(output).toContain('X')
      expect(output).not.toContain(shapeGlyph(id))
    })

    it('variant: squares matches the implicit default', async () => {
      const id = await generate('hello')
      expect(toAscii(id, { variant: 'squares' })).toBe(toAscii(id))
    })
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
