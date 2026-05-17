import { describe, it, expect } from 'vitest'
import { toSvg } from '../../src/svg.ts'
import type { IdenticonResult } from '../../src/types.ts'

const MOCK_ID: IdenticonResult = {
  grid: [
    [1, 0, 1, 0, 1],
    [0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1],
    [0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1],
  ],
  color: { h: 180, s: 55, l: 50 },
  shape: 0,
}

const ALL_OFF_ID: IdenticonResult = {
  grid: [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
  color: { h: 90, s: 40, l: 40 },
  shape: 0,
}

describe('toSvg', () => {
  it('returns a string', () => {
    expect(typeof toSvg(MOCK_ID)).toBe('string')
  })

  it('defaults to pixelSize=120', () => {
    const svg = toSvg(MOCK_ID)
    expect(svg).toContain('width="120"')
    expect(svg).toContain('height="120"')
  })

  it('respects custom pixelSize', () => {
    const svg = toSvg(MOCK_ID, { pixelSize: 200 })
    expect(svg).toContain('width="200"')
    expect(svg).toContain('height="200"')
  })

  it('starts with svg open tag and ends with svg close tag', () => {
    const svg = toSvg(MOCK_ID)
    expect(svg).toMatch(/^<svg /)
    expect(svg).toMatch(/<\/svg>$/)
  })

  it('includes xmlns attribute', () => {
    const svg = toSvg(MOCK_ID)
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
  })

  it('always includes background rect with neutral color', () => {
    const svg = toSvg(MOCK_ID)
    expect(svg).toContain('fill="#f0f0f0"')
  })

  it('uses hsl() color string for foreground cells', () => {
    const svg = toSvg(MOCK_ID)
    expect(svg).toContain('fill="hsl(180,55%,50%)"')
  })

  it('produces one background rect even when all cells are off', () => {
    const svg = toSvg(ALL_OFF_ID)
    expect(svg).toContain('fill="#f0f0f0"')
    // Only the background rect — no foreground rects
    const fgMatches = svg.match(/fill="hsl\(/g)
    expect(fgMatches).toBeNull()
  })

  it('produces correct number of foreground rects for MOCK_ID', () => {
    const svg = toSvg(MOCK_ID)
    // MOCK_ID has 13 on-cells (checkerboard with odd rows/cols)
    const onCount = MOCK_ID.grid.flat().filter(Boolean).length
    const matches = svg.match(/<rect x=/g)
    expect(matches?.length).toBe(onCount)
  })

  it('default padding=1 positions first cell at offset = cellSize', () => {
    const svg = toSvg(MOCK_ID, { pixelSize: 120 })
    // cellSize = 120 / (5 + 2) = 120/7 ≈ 17.142857142857142
    // first on-cell (row=0, col=0) x = 1 * cellSize, y = 1 * cellSize
    const cellSize = 120 / 7
    const expected = cellSize.toString()
    expect(svg).toContain(`x="${expected}"`)
    expect(svg).toContain(`y="${expected}"`)
  })

  it('respects custom padding option', () => {
    const svg = toSvg(MOCK_ID, { pixelSize: 140, padding: 2 })
    // cellSize = 140 / (5 + 4) = 140/9
    const cellSize = 140 / 9
    const offset = 2 * cellSize
    expect(svg).toContain(`x="${offset}"`)
  })

  it('zero padding places first on-cell at origin', () => {
    const svg = toSvg(MOCK_ID, { pixelSize: 100, padding: 0 })
    // cellSize = 100/5 = 20, first on-cell at x=0, y=0
    expect(svg).toContain('x="0"')
    expect(svg).toContain('y="0"')
  })

  it('transparent option omits the background rect', () => {
    const svg = toSvg(MOCK_ID, { transparent: true })
    expect(svg).not.toContain('fill="#f0f0f0"')
  })

  it('transparent option still renders foreground cells', () => {
    const svg = toSvg(MOCK_ID, { transparent: true })
    expect(svg).toContain('fill="hsl(180,55%,50%)"')
  })

  it('transparent:false preserves default background rect', () => {
    const svg = toSvg(MOCK_ID, { transparent: false })
    expect(svg).toContain('fill="#f0f0f0"')
  })

  it('sanitizes non-finite color values — no raw NaN or Infinity in output', () => {
    const crafted: IdenticonResult = { ...MOCK_ID, color: { h: NaN, s: Infinity, l: -Infinity } }
    const svg = toSvg(crafted)
    expect(svg).not.toContain('NaN')
    expect(svg).not.toContain('Infinity')
  })

  it('sanitizes string-coerced color values — no injection in fill attribute', () => {
    const crafted = {
      ...MOCK_ID,
      color: { h: '"/><script>alert(1)</script><rect fill="' as unknown as number, s: 0, l: 0 },
    }
    const svg = toSvg(crafted)
    expect(svg).not.toContain('<script>')
    expect(svg).not.toContain('alert')
  })
})
