import * as cborg from 'cborg'
import { CID } from 'multiformats/cid'

import {
  base64ToBytes,
  base64URLToBytes,
  bytesToBase64,
  latin1ToBytes,
} from './encoding'

/**
 * Token encoding format
 */
export type TokenFormat = 'base64' | 'base64url' | 'hex' | 'raw' | 'bytes'

/**
 * UCAN payload structure based on spec
 * @see https://github.com/ucan-wg/spec
 */
export interface UCANPayload {
  iss: string // issuer DID
  aud: string // audience DID
  sub?: string // subject DID
  cmd?: string // command/capability path
  pol?: unknown[] // policy (proof chain)
  exp?: number // expiration timestamp
  nbf?: number // not before timestamp
  nnc?: string // nonce
  meta?: Record<string, unknown> // metadata
  [key: string]: unknown // type tag (e.g., 'ucan/dlg@1.0.0-rc.1') + other fields
}

/**
 * UCAN token structure: [signature, payload]
 */
export type UCANToken = [Uint8Array, UCANPayload]

/**
 * Custom error for UCAN decoding failures
 */
export class UCANDecodeError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly detectedFormat?: TokenFormat,
  ) {
    super(message)
    this.name = 'UCANDecodeError'
  }
}

/**
 * Result of UCAN decoding with metadata
 */
export interface DecodeResult {
  value: unknown
  format: TokenFormat
  size: number
}

/**
 * Decode cache for performance optimization
 */
const decodeCache = new Map<string, unknown>()

/**
 * Converts a token string in various formats to Uint8Array
 * Supports: base64, hex, raw binary string
 */
function tokenToBytes(token: string): { bytes: Uint8Array, format: TokenFormat } {
  // Check if it's valid hex first (before base64, since some hex is valid base64)
  const hexPattern = /^[0-9a-f]+$/i
  if (hexPattern.test(token) && token.length % 2 === 0 && token.length >= 4) {
    // Likely hex if it's all hex chars and even length
    const bytes = new Uint8Array(token.length / 2)
    for (let i = 0; i < token.length; i += 2) {
      bytes[i / 2] = Number.parseInt(token.slice(i, i + 2), 16)
    }

    // Verify it's valid CBOR before committing to hex
    try {
      cborg.decode(bytes)
      return { bytes, format: 'hex' }
    }
    catch {
      // Not valid CBOR, try base64 instead
    }
  }

  // Try base64URL (common for URL-safe tokens)
  if (token.includes('-') || token.includes('_')) {
    try {
      return {
        bytes: base64URLToBytes(token),
        format: 'base64url',
      }
    }
    catch {
      // fall through
    }
  }

  // Try base64 (most common format)
  try {
    return {
      bytes: base64ToBytes(token),
      format: 'base64',
    }
  }
  catch {
    // Assume raw binary string as fallback
    return {
      bytes: latin1ToBytes(token),
      format: 'raw',
    }
  }
}

/**
 * IPLD CBOR tag handlers
 * @see https://github.com/multiformats/multicodec/blob/master/table.csv
 */
const IPLD_TAGS = {
  // Tag 42: CID (Content Identifier) - IPLD link
  42: (bytes: Uint8Array) => {
    try {
      // Decode CID and convert to string (e.g., "bafyrei...")
      const cid = CID.decode(bytes)
      return { '/': cid.toString() }
    }
    catch {
      // Fallback to raw bytes if CID decoding fails
      return { '/': bytes }
    }
  },
  // Tag 258: Set (used in some IPLD schemas)
  258: (arr: unknown[]) => new Set(arr),
} as const

/**
 * Decodes a UCAN token with support for IPLD tags
 * Automatically detects token format (base64, hex, or raw bytes)
 *
 * @param token - UCAN token as string (base64/hex/raw) or Uint8Array
 * @param useCache - Whether to use memoization (default: true)
 * @returns Decoded UCAN value
 * @throws {UCANDecodeError} When decoding fails
 */
export function decodeUCAN(token: string | Uint8Array, useCache = true): unknown {
  // Generate cache key
  const cacheKey = typeof token === 'string'
    ? token
    : bytesToBase64(token)

  // Check cache
  if (useCache && decodeCache.has(cacheKey)) {
    return decodeCache.get(cacheKey)!
  }

  let bytes: Uint8Array
  let detectedFormat: TokenFormat = 'bytes'

  try {
    if (typeof token === 'string') {
      const result = tokenToBytes(token)
      bytes = result.bytes
      detectedFormat = result.format
    }
    else {
      bytes = token
    }

    const decoded = cborg.decode(bytes, {
      // @ts-expect-error - cborg has tag handlers but TypeScript doesn't expose them fully
      tags: IPLD_TAGS,
    })

    if (useCache) {
      decodeCache.set(cacheKey, decoded)
    }

    return decoded
  }
  catch (error) {
    throw new UCANDecodeError(
      `Failed to decode UCAN token (detected format: ${detectedFormat})`,
      error instanceof Error ? error : undefined,
      detectedFormat,
    )
  }
}

/**
 * Decodes a UCAN token with metadata about the decoding process
 *
 * @param token - UCAN token as string (base64/hex/raw) or Uint8Array
 * @param useCache - Whether to use memoization (default: true)
 * @returns Decode result with metadata
 * @throws {UCANDecodeError} When decoding fails
 */
export function decodeUCANWithMeta(token: string | Uint8Array, useCache = true): DecodeResult {
  let bytes: Uint8Array
  let detectedFormat: TokenFormat = 'bytes'

  if (typeof token === 'string') {
    const result = tokenToBytes(token)
    bytes = result.bytes
    detectedFormat = result.format
  }
  else {
    bytes = token
  }

  const value = decodeUCAN(token, useCache)

  return {
    value,
    format: detectedFormat,
    size: bytes.length,
  }
}

/**
 * Safely decodes UCAN with error handling
 * Accepts token as string (base64/hex/raw) or Uint8Array
 *
 * @param token - UCAN token to decode
 * @param useCache - Whether to use memoization (default: true)
 * @returns Success result with value or error result with message
 */
export function safeDecodeUCAN(
  token: string | Uint8Array,
  useCache = true,
): { success: true, value: unknown } | { success: false, error: string, format?: TokenFormat } {
  try {
    return { success: true, value: decodeUCAN(token, useCache) }
  }
  catch (e) {
    if (e instanceof UCANDecodeError) {
      return {
        success: false,
        error: e.message,
        format: e.detectedFormat,
      }
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

/**
 * Clears the decode cache
 * Useful for testing or when memory management is needed
 */
export function clearDecodeCache(): void {
  decodeCache.clear()
}
