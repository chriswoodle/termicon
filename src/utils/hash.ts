// Input is UTF-8 encoded as-is — no trimming, case folding, or Unicode normalization (NFC etc.).
// The empty string is valid and produces 0 bytes, which is then hashed normally.
export async function sha256(input: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(input)

  if (typeof process !== 'undefined' && process.versions?.node != null) {
    const { createHash } = await import('node:crypto')
    const hash = createHash('sha256').update(bytes).digest()
    return new Uint8Array(hash)
  }

  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return new Uint8Array(hashBuffer)
}
