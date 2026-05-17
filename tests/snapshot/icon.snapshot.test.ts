import { describe, it, expect } from 'vitest'
import { generate } from '../../src/core.ts'
import { toIconSvg } from '../../src/svg.ts'

describe('toIconSvg snapshots', () => {
  it('empty string default options', async () => {
    expect(toIconSvg(await generate(''))).toMatchSnapshot()
  })

  it('alice@example.com default options', async () => {
    expect(toIconSvg(await generate('alice@example.com'))).toMatchSnapshot()
  })

  it('pixelSize: 64', async () => {
    expect(toIconSvg(await generate('hello'), { pixelSize: 64 })).toMatchSnapshot()
  })

  it('pixelSize: 64 padding: 0', async () => {
    expect(toIconSvg(await generate('hello'), { pixelSize: 64, padding: 0 })).toMatchSnapshot()
  })

  it('bob@example.com — different shape', async () => {
    expect(toIconSvg(await generate('bob@example.com'))).toMatchSnapshot()
  })
})
