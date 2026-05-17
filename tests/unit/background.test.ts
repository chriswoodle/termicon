import { describe, it, expect } from 'vitest'
import { toSvg, toIconSvg } from '../../src/svg.ts'
import { toCanvas } from '../../src/canvas.ts'
import type { IdenticonResult } from '../../src/types.ts'

const FIXTURE: IdenticonResult = {
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

describe('toSvg background option', () => {
  it('uses custom background color', () => {
    const svg = toSvg(FIXTURE, { background: '#ff0000' })
    expect(svg).toContain('fill="#ff0000"')
    expect(svg).not.toContain('fill="#f0f0f0"')
  })

  it('falls back to default when background is unset', () => {
    const svg = toSvg(FIXTURE)
    expect(svg).toContain('fill="#f0f0f0"')
  })

  it('transparent option still overrides background', () => {
    const svg = toSvg(FIXTURE, { background: '#ff0000', transparent: true })
    expect(svg).not.toContain('fill="#ff0000"')
    expect(svg).not.toContain('fill="#f0f0f0"')
  })

  it('toIconSvg honors background option too', () => {
    const svg = toIconSvg(FIXTURE, { background: '#abcdef' })
    expect(svg).toContain('fill="#abcdef"')
  })
})

describe('toCanvas background option', () => {
  function makeMockCtx() {
    const calls: { style: string; rect: [number, number, number, number] }[] = []
    let currentStyle = ''
    return {
      ctx: {
        get fillStyle() { return currentStyle },
        set fillStyle(v: string) { currentStyle = v },
        fillRect(x: number, y: number, w: number, h: number) {
          calls.push({ style: currentStyle, rect: [x, y, w, h] })
        },
      } as unknown as CanvasRenderingContext2D,
      calls,
    }
  }

  it('uses custom background color', () => {
    const { ctx, calls } = makeMockCtx()
    toCanvas(FIXTURE, ctx, { background: '#123456' })
    expect(calls[0].style).toBe('#123456')
  })

  it('falls back to default when background is unset', () => {
    const { ctx, calls } = makeMockCtx()
    toCanvas(FIXTURE, ctx)
    expect(calls[0].style).toBe('#f0f0f0')
  })

  it('transparent option skips background draw entirely', () => {
    const { ctx, calls } = makeMockCtx()
    toCanvas(FIXTURE, ctx, { transparent: true })
    // No background rect — only foreground cell rects
    expect(calls.every((c) => c.style !== '#f0f0f0')).toBe(true)
  })
})

describe('cssColor takes precedence over color in renderers', () => {
  const withCss: IdenticonResult = { ...FIXTURE, cssColor: '#ff0000' }

  it('SVG uses cssColor for foreground', () => {
    expect(toSvg(withCss)).toContain('fill="#ff0000"')
  })

  it('SVG falls back to HSL when cssColor is absent', () => {
    expect(toSvg(FIXTURE)).toContain('fill="hsl(180,55%,50%)"')
  })
})
