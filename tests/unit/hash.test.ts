import { describe, it, expect } from 'vitest'
import { sha256 } from '../../src/utils/hash.ts'

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

describe('sha256', () => {
  it('returns a 32-byte Uint8Array', async () => {
    const result = await sha256('test')
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
  })

  it('produces correct hash for empty string', async () => {
    const result = await sha256('')
    expect(toHex(result)).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    )
  })

  it('produces correct hash for known input', async () => {
    const result = await sha256('hello')
    expect(toHex(result)).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    )
  })

  it('produces identical results for the same input', async () => {
    const a = await sha256('alice@example.com')
    const b = await sha256('alice@example.com')
    expect(toHex(a)).toBe(toHex(b))
  })

  it('produces different results for different inputs', async () => {
    const a = await sha256('alice@example.com')
    const b = await sha256('bob@example.com')
    expect(toHex(a)).not.toBe(toHex(b))
  })

  it('handles non-ASCII UTF-8 input', async () => {
    const result = await sha256('日本語')
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
  })
})
