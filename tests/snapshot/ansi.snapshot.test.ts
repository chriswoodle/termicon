import { describe, it, expect } from 'vitest'
import { generate } from '../../src/core.ts'
import { toAnsi } from '../../src/ansi.ts'

describe('toAnsi snapshots', () => {
  it('empty string', async () => {
    expect(toAnsi(await generate(''))).toMatchSnapshot()
  })

  it('alice@example.com', async () => {
    expect(toAnsi(await generate('alice@example.com'))).toMatchSnapshot()
  })

  it('cellWidth: 1', async () => {
    expect(toAnsi(await generate('hello'), { cellWidth: 1 })).toMatchSnapshot()
  })

  it('cellWidth: 4', async () => {
    expect(toAnsi(await generate('hello'), { cellWidth: 4 })).toMatchSnapshot()
  })

  it('transparent: true', async () => {
    expect(toAnsi(await generate('alice@example.com'), { transparent: true })).toMatchSnapshot()
  })

  it('transparent: true cellWidth: 1', async () => {
    expect(toAnsi(await generate('hello'), { transparent: true, cellWidth: 1 })).toMatchSnapshot()
  })
})
