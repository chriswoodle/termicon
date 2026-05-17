import { describe, it, expect } from 'vitest'
import { generate } from '../../src/core.ts'
import { toSvg } from '../../src/svg.ts'

describe('toSvg snapshots', () => {
  it('empty string default options', async () => {
    expect(toSvg(await generate(''))).toMatchSnapshot()
  })

  it('alice@example.com default options', async () => {
    expect(toSvg(await generate('alice@example.com'))).toMatchSnapshot()
  })

  it('pixelSize: 64', async () => {
    expect(toSvg(await generate('hello'), { pixelSize: 64 })).toMatchSnapshot()
  })

  it('pixelSize: 64 padding: 0', async () => {
    expect(toSvg(await generate('hello'), { pixelSize: 64, padding: 0 })).toMatchSnapshot()
  })

  it('transparent: true', async () => {
    expect(toSvg(await generate('alice@example.com'), { transparent: true })).toMatchSnapshot()
  })

  it('transparent: true pixelSize: 64', async () => {
    expect(toSvg(await generate('hello'), { transparent: true, pixelSize: 64 })).toMatchSnapshot()
  })
})
