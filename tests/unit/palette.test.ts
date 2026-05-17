import { describe, it, expect } from 'vitest'
import { generate } from '../../src/core.ts'
import { isPaletteName, pickFromPalette } from '../../src/utils/palette.ts'

describe('palette option', () => {
  it('cssColor is from named palette when palette is set', async () => {
    const id = await generate('alice', { palette: 'pastel' })
    expect(id.cssColor).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('cssColor is hsl(...) when palette is unset', async () => {
    const id = await generate('alice')
    expect(id.cssColor).toMatch(/^hsl\(/)
  })

  it('cssColor is hsl(...) when palette is "default"', async () => {
    const id = await generate('alice', { palette: 'default' })
    expect(id.cssColor).toMatch(/^hsl\(/)
  })

  it('custom palette array picks one of the provided colors', async () => {
    const palette = ['#ff0000', '#00ff00', '#0000ff']
    const id = await generate('alice', { palette })
    expect(palette).toContain(id.cssColor)
  })

  it('is deterministic for same input + palette', async () => {
    const a = await generate('alice', { palette: 'vivid' })
    const b = await generate('alice', { palette: 'vivid' })
    expect(a.cssColor).toBe(b.cssColor)
  })

  it('different inputs pick different palette entries (likely)', async () => {
    // Probabilistic: with 8-entry palette, most pairs differ. Not a hard guarantee per pair.
    const colors = new Set<string>()
    for (const input of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']) {
      colors.add((await generate(input, { palette: 'vivid' })).cssColor!)
    }
    expect(colors.size).toBeGreaterThan(1)
  })

  it('empty custom palette falls back to HSL', async () => {
    const id = await generate('alice', { palette: [] })
    expect(id.cssColor).toMatch(/^hsl\(/)
  })

  it('pickFromPalette returns null for "default"', () => {
    expect(pickFromPalette('default', 0)).toBeNull()
  })

  it('pickFromPalette wraps modulo length', () => {
    const palette = ['#a', '#b', '#c']
    expect(pickFromPalette(palette, 0)).toBe('#a')
    expect(pickFromPalette(palette, 3)).toBe('#a')
    expect(pickFromPalette(palette, 5)).toBe('#c')
  })

  it('pickFromPalette returns null for empty array', () => {
    expect(pickFromPalette([], 0)).toBeNull()
  })
})

describe('isPaletteName', () => {
  it('returns true for known preset names', () => {
    for (const name of ['default', 'pastel', 'mono', 'vivid', 'earth', 'ocean', 'sunset']) {
      expect(isPaletteName(name)).toBe(true)
    }
  })

  it('returns false for unknown strings', () => {
    expect(isPaletteName('rainbow')).toBe(false)
    expect(isPaletteName('Default')).toBe(false) // case-sensitive
    expect(isPaletteName('')).toBe(false)
  })

  it('returns false for non-string values', () => {
    expect(isPaletteName(undefined)).toBe(false)
    expect(isPaletteName(null)).toBe(false)
    expect(isPaletteName(42)).toBe(false)
    expect(isPaletteName(['#ff0000'])).toBe(false)
    expect(isPaletteName({})).toBe(false)
  })

  it('narrows the type to PaletteName', () => {
    const v: unknown = 'pastel'
    if (isPaletteName(v)) {
      // type-level check: v is now PaletteName here; this just compiles
      const _: 'default' | 'pastel' | 'mono' | 'vivid' | 'earth' | 'ocean' | 'sunset' = v
      expect(_).toBe('pastel')
    }
  })
})
