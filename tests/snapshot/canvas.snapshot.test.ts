import { describe, it, expect } from 'vitest'
import { generate } from '../../src/core.ts'
import { toCanvas } from '../../src/canvas.ts'

interface DrawCall {
  op: 'fillStyle' | 'fillRect'
  value?: string
  args?: [number, number, number, number]
}

function makeMockCtx() {
  const calls: DrawCall[] = []
  let currentStyle = ''
  const ctx = {
    get fillStyle() { return currentStyle },
    set fillStyle(val: string) {
      currentStyle = val
      calls.push({ op: 'fillStyle', value: val })
    },
    fillRect(x: number, y: number, w: number, h: number) {
      calls.push({ op: 'fillRect', args: [x, y, w, h] })
    },
  } as unknown as CanvasRenderingContext2D
  return { ctx, calls }
}

describe('toCanvas snapshots', () => {
  it('empty string default options', async () => {
    const { ctx, calls } = makeMockCtx()
    toCanvas(await generate(''), ctx)
    expect(calls).toMatchSnapshot()
  })

  it('alice@example.com default options', async () => {
    const { ctx, calls } = makeMockCtx()
    toCanvas(await generate('alice@example.com'), ctx)
    expect(calls).toMatchSnapshot()
  })

  it('hello pixelSize: 70 padding: 0', async () => {
    const { ctx, calls } = makeMockCtx()
    toCanvas(await generate('hello'), ctx, { pixelSize: 70, padding: 0 })
    expect(calls).toMatchSnapshot()
  })
})
