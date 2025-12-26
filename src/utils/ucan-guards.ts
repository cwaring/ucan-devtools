import type {
  CborObject,
  UCANDelegationPayload,
  UCANEnvelope,
  UCANInvocationPayload,
  UCANPayloadExtractionResult,
  UCANSignaturePayload,
  UCANTypeTag,
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

export function isUCANEnvelope(value: unknown): value is UCANEnvelope {
  return Array.isArray(value)
    && value.length === 2
    && isUint8Array(value[0])
    && isCborObject(value[1])
    && isUint8Array((value[1] as any).h)
}

export function isUCANSignaturePayload(value: unknown): value is UCANSignaturePayload {
  return isCborObject(value) && isUint8Array((value as any).h)
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

  if (!isUint8Array(value.nonce))
    return false
  if (!(typeof value.exp === 'number' || value.exp === null))
    return false
  if (value.pol === undefined)
    return false

  // Optional fields
  if (value.nbf !== undefined && typeof value.nbf !== 'number')
    return false
  if (value.meta !== undefined && !isRecord(value.meta))
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
  if (!Array.isArray(value.prf))
    return false

  if (!isUint8Array(value.nonce))
    return false
  if (!(typeof value.exp === 'number' || value.exp === null))
    return false

  // Optional fields
  if (value.nbf !== undefined && typeof value.nbf !== 'number')
    return false
  if (value.iat !== undefined && typeof value.iat !== 'number')
    return false
  if (value.cause !== undefined && !isRecord(value.cause))
    return false
  if (value.meta !== undefined && !isRecord(value.meta))
    return false

  return true
}

export function getUCANPayloadFromEnvelope(
  envelope: unknown,
): UCANPayloadExtractionResult | null {
  if (!isUCANSignaturePayload(envelope))
    return null

  for (const [key, value] of Object.entries(envelope as UCANSignaturePayload)) {
    if (!key.startsWith('ucan/'))
      continue

    if (!/^ucan\/(?:dlg|inv)@/i.test(key))
      continue

    if (key.toLowerCase().startsWith('ucan/dlg@')) {
      if (isUCANDelegationPayload(value))
        return { typeTag: key as UCANTypeTag<'dlg'>, payload: value }
    }

    if (key.toLowerCase().startsWith('ucan/inv@')) {
      if (isUCANInvocationPayload(value))
        return { typeTag: key as UCANTypeTag<'inv'>, payload: value }
    }
  }

  return null
}
