import type { DecodedTokens, TokenDecoder } from './decoders'
import * as cborg from 'cborg'
import { ungzip } from 'pako'

// Base64 helpers
function b64stdDecode(input: string): Uint8Array {
  const bin = atob(input)
  const u8 = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i)
  return u8
}

function b64urlDecode(input: string): Uint8Array {
  // Convert base64url (no padding) to standard
  let s = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = s.length % 4
  if (pad === 2)
    s += '=='
  else if (pad === 3)
    s += '='
  else if (pad !== 0 && pad !== 0)
    s += ''
  return b64stdDecode(s)
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  const std = btoa(bin)
  return std.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeByHeaderByte(header: number, payload: string): Uint8Array {
  // Header table per UCAN container spec
  // 0x40 '@': raw bytes, no compression
  // 0x42 'B': base64 std with padding, no compression
  // 0x43 'C': base64 url, no padding, no compression
  // 0x4D 'M': raw bytes, gzip compressed
  // 0x4F 'O': base64 std with padding, gzip
  // 0x50 'P': base64 url, no padding, gzip

  let data: Uint8Array
  switch (header) {
    case 0x40: // '@'
      data = new TextEncoder().encode(payload)
      break
    case 0x42: // 'B'
      data = b64stdDecode(payload)
      break
    case 0x43: // 'C'
      data = b64urlDecode(payload)
      break
    case 0x4D: // 'M'
      data = ungzip(new TextEncoder().encode(payload))
      break
    case 0x4F: // 'O'
      data = ungzip(b64stdDecode(payload))
      break
    case 0x50: // 'P'
      data = ungzip(b64urlDecode(payload))
      break
    default:
      throw new Error('Unknown UCAN container header byte')
  }
  return data
}

export const containerDecoder: TokenDecoder = {
  canDecode(input: string): boolean {
    if (!input || input.length < 1)
      return false
    const header = input.charCodeAt(0)
    return header === 0x40 || header === 0x42 || header === 0x43 || header === 0x4D || header === 0x4F || header === 0x50
  },
  decode(input: string): DecodedTokens {
    const header = input.charCodeAt(0)
    const payload = input.slice(1)
    const bytes = decodeByHeaderByte(header, payload)
    // bytes should be CBOR map with key 'ctn-v1' pointing to a CBOR array of token bytes
    const decoded = cborg.decode(bytes) as Record<string, unknown>
    const arr = (decoded['ctn-v1'] ?? []) as unknown[]
    const tokens: string[] = []
    for (const entry of arr) {
      if (entry instanceof Uint8Array) {
        tokens.push(b64urlEncode(entry))
      }
      else if (Array.isArray(entry)) {
        // Some decoders may represent bytes as number arrays
        tokens.push(b64urlEncode(Uint8Array.from(entry as number[])))
      }
      else {
        // If already string, accept as-is
        if (typeof entry === 'string')
          tokens.push(entry)
      }
    }
    return tokens.length ? tokens : [input]
  },
}
