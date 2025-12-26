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
export type DIDURL = string

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
export interface UCANPayloadBase {
  /**
   * Issuer DID (sender)
   */
  iss: DIDURL
  /**
   * Audience DID (receiver)
   */
  aud?: DID
  /**
   * Principal that the chain is about (the Subject)
   */
  sub?: DID | null
  /**
   * The Command to eventually invoke
   */
  cmd: string
  /**
   * The nonce of the UCAN
   */
  nonce: Uint8Array
  /**
   * Meta (asserted, signed data) — is not delegated authority
   */
  meta?: Record<string, unknown>
  /**
   * Expiration UTC Unix Timestamp in seconds (valid until)
   */
  exp: number | null
  /**
   * Not before UTC Unix Timestamp in seconds (valid from)
   */
  nbf?: number
}

export interface UCANDelegationPayload extends UCANPayloadBase {
  aud: DID
  sub: DID | null
  pol: CborValue
}

export interface UCANInvocationPayload extends UCANPayloadBase {
  sub: DID
  /**
   * Any Arguments that MUST be present in the Invocation
   */
  args: Record<string, unknown>
  /**
   * Delegations that prove the chain of authority
   */
  prf: IPLDLink[]
  /**
   * Issued at time
   */
  iat?: number
  /**
   * Optional CID-like link to a receipt/task cause
   */
  cause?: IPLDLink
}

export interface UCANPayloadBySpec {
  dlg: UCANDelegationPayload
  inv: UCANInvocationPayload
}

export type UCANPayloadSpec = keyof UCANPayloadBySpec

export type UCANPayload = UCANPayloadBySpec[UCANPayloadSpec]

/**
 * UCAN type tag keys (UCAN 1.0 DAG-CBOR)
 *
 * Examples:
 * - `ucan/dlg@1.0.0-rc.1`
 * - `ucan/inv@1.0.0-rc.1`
 */
export type UCANTypeTag<Spec extends UCANPayloadSpec = UCANPayloadSpec> = `ucan/${Spec}@${string}`

export type UCANPayloadExtractionResult = {
  [Spec in UCANPayloadSpec]: {
    typeTag: UCANTypeTag<Spec>
    payload: UCANPayloadBySpec[Spec]
  }
}[UCANPayloadSpec]

/**
 * Signature: contains header `h` and the UCAN payload.
 */
export type UCANSignaturePayload = CborObject & { h: Uint8Array } & Partial<Record<UCANTypeTag, UCANPayload>>

/**
 * Envelope: [signature, signaturePayload]
 */
export type UCANEnvelope = [Uint8Array, UCANSignaturePayload]

/**
 * Result of UCAN decoding with metadata
 */
export interface DecodeResult {
  value: unknown
  format: TokenFormat
  size: number
}
