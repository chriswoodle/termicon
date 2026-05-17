import { describe, it, expect } from 'vitest'
import { generate } from '../../src/core.ts'
import { toDataUri, toIconDataUri, toSvg } from '../../src/svg.ts'

describe('toDataUri', () => {
  it('starts with data:image/svg+xml;utf8,', async () => {
    const id = await generate('alice')
    expect(toDataUri(id).startsWith('data:image/svg+xml;utf8,')).toBe(true)
  })

  it('payload decodes to the SVG string', async () => {
    const id = await generate('alice')
    const uri = toDataUri(id)
    const payload = decodeURIComponent(uri.slice('data:image/svg+xml;utf8,'.length))
    expect(payload).toBe(toSvg(id))
  })

  it('respects renderer options', async () => {
    const id = await generate('alice')
    const uri = toDataUri(id, { pixelSize: 64 })
    const payload = decodeURIComponent(uri.slice('data:image/svg+xml;utf8,'.length))
    expect(payload).toContain('width="64"')
  })

  it('toIconDataUri uses the icon variant', async () => {
    const id = await generate('alice')
    const uri = toIconDataUri(id)
    const payload = decodeURIComponent(uri.slice('data:image/svg+xml;utf8,'.length))
    // Icon variant uses non-rect shape elements
    expect(payload).toMatch(/<(circle|polygon|rect rx)/)
  })
})
