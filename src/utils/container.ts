import type { DecodedTokens, TokenDecoder } from './decoders'
import * as cborg from 'cborg'
import { ungzip } from 'pako'

import {
  base64ToBytes,
  base64URLToBytes,
  bytesToBase64URL,
  latin1ToBytes,
} from './encoding'

// Base64 helpers
function b64stdDecode(input: string): Uint8Array {
  return base64ToBytes(input)
}

function b64URLDecode(input: string): Uint8Array {
  return base64URLToBytes(input)
}

function b64URLEncode(bytes: Uint8Array): string {
  return bytesToBase64URL(bytes)
}

export function looksLikeUCANContainer(input: string): boolean {
  if (!input || input.length < 1)
    return false
  const header = input.charCodeAt(0)
  return header === 0x40 || header === 0x42 || header === 0x43 || header === 0x4D || header === 0x4F || header === 0x50
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
      // Raw bytes are represented as a Latin-1 byte string
      data = latin1ToBytes(payload)
      break
    case 0x42: // 'B'
      data = b64stdDecode(payload)
      break
    case 0x43: // 'C'
      data = b64URLDecode(payload)
      break
    case 0x4D: // 'M'
      data = ungzip(latin1ToBytes(payload))
      break
    case 0x4F: // 'O'
      data = ungzip(b64stdDecode(payload))
      break
    case 0x50: // 'P'
      data = ungzip(b64URLDecode(payload))
      break
    default:
      throw new Error('Unknown UCAN container header byte')
  }
  return data
}

export const containerDecoder: TokenDecoder = {
  canDecode(input: string): boolean {
    return looksLikeUCANContainer(input)
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
        tokens.push(b64URLEncode(entry))
      }
      else if (Array.isArray(entry)) {
        // Some decoders may represent bytes as number arrays
        tokens.push(b64URLEncode(Uint8Array.from(entry as number[])))
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
