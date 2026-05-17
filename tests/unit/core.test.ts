import { describe, it, expect } from 'vitest'
import { generate } from '../../src/core.ts'

describe('generate', () => {
  it('returns an object with grid and color', async () => {
    const result = await generate('test')
    expect(result).toHaveProperty('grid')
    expect(result).toHaveProperty('color')
  })

  it('grid is a 5x5 array of 0/1 values', async () => {
    const { grid } = await generate('hello')
    expect(grid).toHaveLength(5)
    for (const row of grid) {
      expect(row).toHaveLength(5)
      for (const cell of row) {
        expect(cell === 0 || cell === 1).toBe(true)
      }
    }
  })

  it('grid is horizontally symmetric (col3=col1, col4=col0)', async () => {
    const { grid } = await generate('alice@example.com')
    for (let row = 0; row < 5; row++) {
      expect(grid[row][3]).toBe(grid[row][1])
      expect(grid[row][4]).toBe(grid[row][0])
    }
  })

  it('color hue is in range [0, 360]', async () => {
    for (const input of ['', 'alice@example.com', 'test', '日本語']) {
      const { color } = await generate(input)
      expect(color.h).toBeGreaterThanOrEqual(0)
      expect(color.h).toBeLessThanOrEqual(360)
    }
  })

  it('color saturation is in range [40, 70]', async () => {
    for (const input of ['', 'alice@example.com', 'test', '日本語']) {
      const { color } = await generate(input)
      expect(color.s).toBeGreaterThanOrEqual(40)
      expect(color.s).toBeLessThanOrEqual(70)
    }
  })

  it('color lightness is in range [40, 60]', async () => {
    for (const input of ['', 'alice@example.com', 'test', '日本語']) {
      const { color } = await generate(input)
      expect(color.l).toBeGreaterThanOrEqual(40)
      expect(color.l).toBeLessThanOrEqual(60)
    }
  })

  it('is deterministic for the same input', async () => {
    const a = await generate('alice@example.com')
    const b = await generate('alice@example.com')
    expect(a.grid).toEqual(b.grid)
    expect(a.color).toEqual(b.color)
  })

  it('produces different results for different inputs', async () => {
    const a = await generate('alice@example.com')
    const b = await generate('bob@example.com')
    expect(a.grid).not.toEqual(b.grid)
  })

  it('matches known vector for empty string', async () => {
    // SHA-256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    // hash[15]=0x24=36, hash[16]=0x27=39, hash[17]=0xae=174
    const { grid, color } = await generate('')
    expect(grid).toEqual([
      [1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 0, 1, 1],
      [0, 1, 0, 1, 0],
      [0, 0, 0, 0, 0],
    ])
    expect(color.h).toBeCloseTo((36 / 255) * 360, 10)
    expect(color.s).toBeCloseTo(40 + (39 / 255) * 30, 10)
    expect(color.l).toBeCloseTo(40 + (174 / 255) * 20, 10)
  })

  it('completes in under 2ms for small inputs', async () => {
    const start = performance.now()
    await generate('alice@example.com')
    expect(performance.now() - start).toBeLessThan(2)
  })
})
