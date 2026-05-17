import { describe, it, expect } from 'vitest'
import { generate } from '../../src/core.ts'
import { toCanvas } from '../../src/canvas.ts'
import type { IdenticonResult } from '../../src/types.ts'

interface FillCall {
  style: string
  rect: [number, number, number, number]
}

function makeMockCtx() {
  const calls: FillCall[] = []
  let currentStyle = ''
  const ctx = {
    get fillStyle() { return currentStyle },
    set fillStyle(val: string) { currentStyle = val },
    fillRect(x: number, y: number, w: number, h: number) {
      calls.push({ style: currentStyle, rect: [x, y, w, h] })
    },
  } as unknown as CanvasRenderingContext2D
  return { ctx, calls }
}

const CHECKERBOARD: IdenticonResult = {
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

const ALL_OFF: IdenticonResult = {
  grid: Array.from({ length: 5 }, () => [0, 0, 0, 0, 0]),
  color: { h: 90, s: 40, l: 40 },
  shape: 0,
}

describe('toCanvas', () => {
  it('is exported as a function', () => {
    expect(typeof toCanvas).toBe('function')
  })

  it('returns void', () => {
    const { ctx } = makeMockCtx()
    expect(toCanvas(CHECKERBOARD, ctx)).toBeUndefined()
  })

  it('draws background rect first with neutral color', () => {
    const { ctx, calls } = makeMockCtx()
    toCanvas(CHECKERBOARD, ctx)
    expect(calls[0].style).toBe('#f0f0f0')
    expect(calls[0].rect).toEqual([0, 0, 120, 120])
  })

  it('uses default pixelSize=120 for background rect', () => {
    const { ctx, calls } = makeMockCtx()
    toCanvas(CHECKERBOARD, ctx)
    expect(calls[0].rect[2]).toBe(120)
    expect(calls[0].rect[3]).toBe(120)
  })

  it('respects custom pixelSize', () => {
    const { ctx, calls } = makeMockCtx()
    toCanvas(CHECKERBOARD, ctx, { pixelSize: 200 })
    expect(calls[0].rect).toEqual([0, 0, 200, 200])
  })

  it('uses hsl() color string for foreground cells', () => {
    const { ctx, calls } = makeMockCtx()
    toCanvas(CHECKERBOARD, ctx)
    const fgCalls = calls.slice(1)
    expect(fgCalls.length).toBeGreaterThan(0)
    for (const call of fgCalls) {
      expect(call.style).toBe('hsl(180,55%,50%)')
    }
  })

  it('draws correct number of foreground rects for CHECKERBOARD', () => {
    const { ctx, calls } = makeMockCtx()
    toCanvas(CHECKERBOARD, ctx)
    const onCount = CHECKERBOARD.grid.flat().filter(Boolean).length
    // calls[0] is background, rest are foreground
    expect(calls.length - 1).toBe(onCount)
  })

  it('draws only background rect when all cells are off', () => {
    const { ctx, calls } = makeMockCtx()
    toCanvas(ALL_OFF, ctx)
    expect(calls).toHaveLength(1)
    expect(calls[0].style).toBe('#f0f0f0')
  })

  it('default padding=1 positions first cell at offset = cellSize', () => {
    const { ctx, calls } = makeMockCtx()
    toCanvas(CHECKERBOARD, ctx, { pixelSize: 120 })
    // cellSize = 120 / 7, offset = cellSize
    const cellSize = 120 / 7
    const fgCall = calls[1]
    expect(fgCall.rect[0]).toBeCloseTo(cellSize)
    expect(fgCall.rect[1]).toBeCloseTo(cellSize)
  })

  it('foreground rects have correct cellSize dimensions', () => {
    const { ctx, calls } = makeMockCtx()
    toCanvas(CHECKERBOARD, ctx, { pixelSize: 120 })
    const cellSize = 120 / 7
    const fgCall = calls[1]
    expect(fgCall.rect[2]).toBeCloseTo(cellSize)
    expect(fgCall.rect[3]).toBeCloseTo(cellSize)
  })

  it('zero padding places first on-cell at origin', () => {
    const { ctx, calls } = makeMockCtx()
    toCanvas(CHECKERBOARD, ctx, { pixelSize: 100, padding: 0 })
    const fgCall = calls[1]
    expect(fgCall.rect[0]).toBe(0)
    expect(fgCall.rect[1]).toBe(0)
  })

  it('respects custom padding option', () => {
    const { ctx, calls } = makeMockCtx()
    toCanvas(CHECKERBOARD, ctx, { pixelSize: 140, padding: 2 })
    const cellSize = 140 / 9
    const offset = 2 * cellSize
    const fgCall = calls[1]
    expect(fgCall.rect[0]).toBeCloseTo(offset)
    expect(fgCall.rect[1]).toBeCloseTo(offset)
  })

  it('correctly renders known empty-string grid', async () => {
    const id = await generate('')
    const { ctx, calls } = makeMockCtx()
    toCanvas(id, ctx)
    const onCount = id.grid.flat().filter(Boolean).length
    expect(calls.length - 1).toBe(onCount)
  })

  it('does not import SVG, PNG, ANSI, or ASCII modules', async () => {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync(new URL('../../src/canvas.ts', import.meta.url).pathname, 'utf8')
    expect(src).not.toMatch(/from ['"].*svg/i)
    expect(src).not.toMatch(/from ['"].*png/i)
    expect(src).not.toMatch(/from ['"].*ansi/i)
    expect(src).not.toMatch(/from ['"].*ascii/i)
  })
})
