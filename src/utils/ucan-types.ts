/**
 * Shared UCAN + DAG-CBOR type definitions.
 *
 * These types are intentionally lightweight and permissive to support
 * forward-compatible decoding/inspection.
 */

/**
 * Token encoding format
 */
export type TokenFormat = 'base64' | 'base64url' | 'hex' | 'raw' | 'bytes'

// Lightweight aliases
export type DID = string

export type CborPrimitive
  = | string
    | number
    | boolean
    | null
    | bigint
    | Uint8Array
    | ArrayBuffer

export type CborArray = CborValue[] | readonly CborValue[]
export interface CborObject {
  [key: string]: CborValue | undefined
}

export type CborValue = CborPrimitive | CborArray | CborObject

// DAG-JSON-style IPLD link object used by many IPLD codecs.
// In our decoder, tag 42 is converted to { '/': cidString } and falls back to raw bytes.
export type IPLDLink = { '/': string } | { '/': Uint8Array }

/**
 * UCAN payload structures (UCAN 1.0 DAG-CBOR)
 * @see https://github.com/ucan-wg/spec
 */
export interface UCANDelegationPayload {
  iss: DID
  aud: DID
  sub: DID | null
  cmd: string
  pol: CborValue
  exp?: number | null
  nbf?: number
  nonce?: Uint8Array
  meta?: CborObject
}

export interface UCANInvocationPayload {
  iss: DID
  aud?: DID
  sub: DID
  cmd: string
  args: CborObject
  prf: CborValue
  exp?: number | null
  nbf?: number
  iat?: number
  nonce?: Uint8Array
  cause?: IPLDLink
  meta?: CborObject
}

export type UCANPayload = UCANDelegationPayload | UCANInvocationPayload

/**
 * UCAN type tag keys (UCAN 1.0 DAG-CBOR)
 *
 * Examples:
 * - `ucan/dlg@1.0.0-rc.1`
 * - `ucan/inv@1.0.0-rc.1`
 */
export type UCANDelegationTypeTag = `ucan/dlg@${string}`
export type UCANInvocationTypeTag = `ucan/inv@${string}`
export type UCANTypeTag = UCANDelegationTypeTag | UCANInvocationTypeTag

export type UCANPayloadExtractionResult
  = | { typeTag: UCANDelegationTypeTag, payload: UCANDelegationPayload }
    | { typeTag: UCANInvocationTypeTag, payload: UCANInvocationPayload }

/**
 * UCAN envelope: an object with a type tag key (e.g. `ucan/dlg@1.0.0-rc.1`)
 * whose value is the payload.
 */
export type UCANEnvelope = CborObject & Partial<Record<UCANTypeTag, UCANPayload>>

/**
 * UCAN token structure: [signature, envelope]
 */
export type UCANToken = [Uint8Array, UCANEnvelope]

/**
 * Result of UCAN decoding with metadata
 */
export interface DecodeResult {
  value: unknown
  format: TokenFormat
  size: number
}
