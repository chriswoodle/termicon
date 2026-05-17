import { describe, it, expect } from 'vitest'
import { generate } from '../../src/core.ts'
import { toAnsi } from '../../src/ansi.ts'

function makeStream() {
  const chunks: string[] = []
  return {
    stream: { write(s: string) { chunks.push(s); return true } },
    chunks,
  }
}

describe('toAnsi.write', () => {
  it('is exposed as a property on toAnsi', () => {
    expect(typeof toAnsi.write).toBe('function')
  })

  it('writes the ANSI output plus a trailing newline', async () => {
    const id = await generate('alice')
    const { stream, chunks } = makeStream()
    toAnsi.write(id, stream)
    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toBe(toAnsi(id) + '\n')
  })

  it('forwards options to toAnsi', async () => {
    const id = await generate('alice')
    const { stream, chunks } = makeStream()
    toAnsi.write(id, stream, { cellWidth: 4 })
    expect(chunks[0]).toBe(toAnsi(id, { cellWidth: 4 }) + '\n')
  })

  it('works with custom background', async () => {
    const id = await generate('alice')
    const { stream, chunks } = makeStream()
    toAnsi.write(id, stream, { background: '#000000' })
    expect(chunks[0]).toContain('\x1b[48;2;0;0;0m')
  })
})

describe('toAnsi foreground from cssColor', () => {
  it('uses cssColor (hex) when set, not the HSL fallback', async () => {
    const { generate } = await import('../../src/core.ts')
    const id = await generate('alice', { palette: ['#ff8800'] })
    // The palette has one entry so the hash always picks it; foreground should be that color.
    expect(toAnsi(id)).toContain('\x1b[48;2;255;136;0m')
  })

  it('falls back to HSL when cssColor is absent', async () => {
    const { generate } = await import('../../src/core.ts')
    const id = await generate('alice')
    delete (id as Partial<typeof id>).cssColor
    const { hslToRgb } = await import('../../src/utils/color.ts')
    const [r, g, b] = hslToRgb(id.color.h, id.color.s, id.color.l)
    expect(toAnsi(id)).toContain(`\x1b[48;2;${r};${g};${b}m`)
  })

  it('falls back to HSL when cssColor is unparseable', async () => {
    const { generate } = await import('../../src/core.ts')
    const id = await generate('alice')
    const broken = { ...id, cssColor: 'not-a-color' }
    const { hslToRgb } = await import('../../src/utils/color.ts')
    const [r, g, b] = hslToRgb(id.color.h, id.color.s, id.color.l)
    expect(toAnsi(broken)).toContain(`\x1b[48;2;${r};${g};${b}m`)
  })
})

describe('toAnsi background option', () => {
  it('honors hex background color', async () => {
    const id = await generate('')
    const output = toAnsi(id, { background: '#ff8800' })
    expect(output).toContain('\x1b[48;2;255;136;0m')
  })

  it('honors rgb() background color', async () => {
    const id = await generate('')
    const output = toAnsi(id, { background: 'rgb(10, 20, 30)' })
    expect(output).toContain('\x1b[48;2;10;20;30m')
  })

  it('falls back to default for unparseable background', async () => {
    const id = await generate('')
    const output = toAnsi(id, { background: 'not-a-color' })
    expect(output).toContain('\x1b[48;2;240;240;240m')
  })

  it('transparent option overrides background', async () => {
    const id = await generate('')
    const output = toAnsi(id, { background: '#ff0000', transparent: true })
    expect(output).toContain('\x1b[49m')
    expect(output).not.toContain('\x1b[48;2;255;0;0m')
  })
})
