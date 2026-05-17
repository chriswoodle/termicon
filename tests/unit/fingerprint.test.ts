import { describe, it, expect } from 'vitest'
import { fingerprint } from '../../src/fingerprint.ts'
import { generate } from '../../src/core.ts'
import type { IdenticonResult } from '../../src/types.ts'

// Matches the grid of generate(''). Row-major flatten: 10101 11111 11011 01010 00000.
const EMPTY_INPUT_FIXTURE: IdenticonResult = {
  grid: [
    [1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 0, 1, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 0, 0, 0],
  ],
  color: { h: 50.823, s: 44.588, l: 53.647 },
  shape: 65,
}

describe('fingerprint', () => {
  it('returns a string', () => {
    expect(typeof fingerprint(EMPTY_INPUT_FIXTURE)).toBe('string')
  })

  it('encodes size as NxN prefix', () => {
    expect(fingerprint(EMPTY_INPUT_FIXTURE).startsWith('5x5:')).toBe(true)
  })

  it('flattens grid in row-major order', () => {
    expect(fingerprint(EMPTY_INPUT_FIXTURE)).toContain('1010111111110110101000000')
  })

  it('rounds color components to integers for stability', () => {
    expect(fingerprint(EMPTY_INPUT_FIXTURE)).toContain('hsl(51,45,54)')
  })

  it('ignores palette overrides (uses canonical hash-derived color)', () => {
    const withPalette: IdenticonResult = { ...EMPTY_INPUT_FIXTURE, cssColor: '#ff0000' }
    expect(fingerprint(withPalette)).toBe(fingerprint(EMPTY_INPUT_FIXTURE))
  })

  it('includes shape byte', () => {
    expect(fingerprint(EMPTY_INPUT_FIXTURE).endsWith(':65')).toBe(true)
  })

  it('is deterministic for the same identicon', async () => {
    const a = await generate('alice')
    const b = await generate('alice')
    expect(fingerprint(a)).toBe(fingerprint(b))
  })

  it('matches snapshot for known input', async () => {
    const id = await generate('')
    expect(fingerprint(id)).toMatchInlineSnapshot('"5x5:1010111111110110101000000:hsl(51,45,54):65"')
  })

  it('different identicons produce different fingerprints', async () => {
    const a = await generate('alice')
    const b = await generate('bob')
    expect(fingerprint(a)).not.toBe(fingerprint(b))
  })

  it('handles 2x2 and 3x3 sizes', async () => {
    const id2 = await generate('alice', { size: 2 })
    const id3 = await generate('alice', { size: 3 })
    expect(fingerprint(id2).startsWith('2x2:')).toBe(true)
    expect(fingerprint(id3).startsWith('3x3:')).toBe(true)
  })
})
