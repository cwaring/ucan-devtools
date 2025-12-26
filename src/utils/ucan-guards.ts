import type {
  CborObject,
  UCANDelegationPayload,
  UCANDelegationTypeTag,
  UCANEnvelope,
  UCANInvocationPayload,
  UCANInvocationTypeTag,
  UCANPayloadExtractionResult,
  UCANToken,
} from './ucan-types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

function isUint8Array(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array
}

export function isCborObject(value: unknown): value is CborObject {
  return isRecord(value)
}

export function isUCANToken(value: unknown): value is UCANToken {
  return Array.isArray(value)
    && value.length === 2
    && isUint8Array(value[0])
    && isCborObject(value[1])
}

export function isUCANDelegationPayload(value: unknown): value is UCANDelegationPayload {
  if (!isRecord(value))
    return false

  if (typeof value.iss !== 'string')
    return false
  if (typeof value.aud !== 'string')
    return false
  if (!(typeof value.sub === 'string' || value.sub === null))
    return false
  if (typeof value.cmd !== 'string')
    return false

  // Optional fields
  if (value.exp !== undefined && !(typeof value.exp === 'number' || value.exp === null))
    return false
  if (value.nbf !== undefined && typeof value.nbf !== 'number')
    return false
  if (value.nonce !== undefined && !isUint8Array(value.nonce))
    return false

  return true
}

export function isUCANInvocationPayload(value: unknown): value is UCANInvocationPayload {
  if (!isRecord(value))
    return false

  if (typeof value.iss !== 'string')
    return false
  if (value.aud !== undefined && typeof value.aud !== 'string')
    return false
  if (typeof value.sub !== 'string')
    return false
  if (typeof value.cmd !== 'string')
    return false
  if (!isRecord(value.args))
    return false

  // prf is required; we keep it permissive but present.
  if (value.prf === undefined)
    return false

  // Optional fields
  if (value.exp !== undefined && !(typeof value.exp === 'number' || value.exp === null))
    return false
  if (value.nbf !== undefined && typeof value.nbf !== 'number')
    return false
  if (value.iat !== undefined && typeof value.iat !== 'number')
    return false
  if (value.nonce !== undefined && !isUint8Array(value.nonce))
    return false

  return true
}

export function getUCANPayloadFromEnvelope(
  envelope: unknown,
): UCANPayloadExtractionResult | null {
  if (!isCborObject(envelope))
    return null

  for (const [key, value] of Object.entries(envelope as UCANEnvelope)) {
    if (!key.startsWith('ucan/'))
      continue

    if (!/^ucan\/(?:dlg|inv)@/i.test(key))
      continue

    if (key.toLowerCase().startsWith('ucan/dlg@')) {
      if (isUCANDelegationPayload(value))
        return { typeTag: key as UCANDelegationTypeTag, payload: value }
    }

    if (key.toLowerCase().startsWith('ucan/inv@')) {
      if (isUCANInvocationPayload(value))
        return { typeTag: key as UCANInvocationTypeTag, payload: value }
    }
  }

  return null
}
