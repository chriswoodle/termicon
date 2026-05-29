import { describe, it, expect } from 'vitest'
import { generate } from '../../src/core.ts'
import { toAscii } from '../../src/ascii.ts'

describe('toAscii snapshots', () => {
  it('empty string', async () => {
    expect(toAscii(await generate(''))).toMatchSnapshot()
  })

  it('alice@example.com', async () => {
    expect(toAscii(await generate('alice@example.com'))).toMatchSnapshot()
  })

  it('cellWidth: 2', async () => {
    expect(toAscii(await generate('hello'), { cellWidth: 2 })).toMatchSnapshot()
  })

  it('custom onChar and offChar', async () => {
    expect(toAscii(await generate('hello'), { onChar: '1', offChar: '0' })).toMatchSnapshot()
  })

  it('variant: icons', async () => {
    expect(toAscii(await generate('alice@example.com'), { variant: 'icons' })).toMatchSnapshot()
  })

  it('style: block', async () => {
    expect(toAscii(await generate('alice@example.com'), { style: 'block' })).toMatchSnapshot()
  })

  it('style: block transparent', async () => {
    expect(toAscii(await generate('hello'), { style: 'block', transparent: true })).toMatchSnapshot()
  })

  it('style: halfblock', async () => {
    expect(toAscii(await generate('alice@example.com'), { style: 'halfblock' })).toMatchSnapshot()
  })

  it('style: halfblock transparent', async () => {
    expect(toAscii(await generate('hello'), { style: 'halfblock', transparent: true })).toMatchSnapshot()
  })
})
