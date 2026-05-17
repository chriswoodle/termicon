import { describe, it, expect } from 'vitest'
import { generate } from '../../src/core.ts'

describe('seed option', () => {
  it('produces different output than no seed for same input', async () => {
    const a = await generate('alice')
    const b = await generate('alice', { seed: 'avatar-v2' })
    expect(a.grid).not.toEqual(b.grid)
  })

  it('is deterministic for same input + seed', async () => {
    const a = await generate('alice', { seed: 'avatar-v2' })
    const b = await generate('alice', { seed: 'avatar-v2' })
    expect(a.grid).toEqual(b.grid)
    expect(a.cssColor).toBe(b.cssColor)
  })

  it('different seeds produce different output for same input', async () => {
    const a = await generate('alice', { seed: 'v1' })
    const b = await generate('alice', { seed: 'v2' })
    expect(a.grid).not.toEqual(b.grid)
  })

  it('seed=undefined is equivalent to no seed', async () => {
    const a = await generate('alice')
    const b = await generate('alice', { seed: undefined })
    expect(a.grid).toEqual(b.grid)
  })

  it('separator prevents seed/input concatenation collisions', async () => {
    // If we naively concatenated, ('ab', '') and ('a', 'b') could collide.
    const a = await generate('b', { seed: 'a' })
    const b = await generate('ab')
    expect(a.grid).not.toEqual(b.grid)
  })

})
