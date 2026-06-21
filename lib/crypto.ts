const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const PBKDF2_ITERATIONS = 100_000
const SALT = 'vetpro-encryption-v1'

function getKeyMaterial(): string {
  if (typeof window === 'undefined') return SALT
  return SALT + ':' + window.location.origin
}

async function deriveKey(): Promise<CryptoKey> {
  const material = getKeyMaterial()
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(material),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(SALT),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encrypt(plaintext: string): Promise<string> {
  try {
    const key = await deriveKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encoder = new TextEncoder()
    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encoder.encode(plaintext)
    )
    const combined = new Uint8Array(iv.length + ciphertext.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(ciphertext), iv.length)
    return btoa(String.fromCharCode(...combined))
  } catch {
    return plaintext
  }
}

export async function decrypt(ciphertext: string): Promise<string> {
  try {
    const key = await deriveKey()
    const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const data = combined.slice(12)
    const plaintext = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      data
    )
    return new TextDecoder().decode(plaintext)
  } catch {
    return ciphertext
  }
}
