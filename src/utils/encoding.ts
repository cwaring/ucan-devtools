export function latin1ToBytes(input: string): Uint8Array {
  const bytes = new Uint8Array(input.length)
  for (let i = 0; i < input.length; i++) bytes[i] = input.charCodeAt(i) & 0xFF
  return bytes
}

export function bytesToLatin1(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i])
  return out
}

export function base64ToBytes(input: string): Uint8Array {
  if (typeof atob === 'function') {
    const bin = atob(input)
    return latin1ToBytes(bin)
  }

  // Node/test fallback
  // eslint-disable-next-line node/prefer-global/buffer
  return Uint8Array.from(Buffer.from(input, 'base64'))
}

export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof btoa === 'function') {
    return btoa(bytesToLatin1(bytes))
  }

  // Node/test fallback
  // eslint-disable-next-line node/prefer-global/buffer
  return Buffer.from(bytes).toString('base64')
}

export function base64URLToBytes(input: string): Uint8Array {
  // Convert base64URL (no padding) to standard base64
  let s = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = s.length % 4
  if (pad === 2)
    s += '=='
  else if (pad === 3)
    s += '='
  else if (pad !== 0)
    throw new Error('Invalid base64URL')

  return base64ToBytes(s)
}

export function bytesToBase64URL(bytes: Uint8Array): string {
  const std = bytesToBase64(bytes)
  return std.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}
