import { containerDecoder } from '@/utils/container'
import { composeDecoders } from '@/utils/decoders'
import { rawTokenDecoder } from '@/utils/raw-token'
import { decodeUCAN } from '@/utils/ucan-decoder'

export interface TokenItem {
  token: string
  url: string
  header: 'Authorization' | 'ucans'
  capturedAt: number
  format: 'container' | 'raw'
  tokenType: 'delegation' | 'invocation' | 'unknown'
  specVersion?: string // UCAN spec version (e.g., '1.0.0-rc.1')
}

const decoder = composeDecoders([containerDecoder, rawTokenDecoder])

export const UCAN_TYPE_TAG_PATTERN = /ucan\/(dlg|inv)@([\d.a-z-]+)/i

export const TYPE_ABBREVIATION_MAP: Record<string, 'delegation' | 'invocation'> = {
  dlg: 'delegation',
  inv: 'invocation',
}

interface TokenTypeInfo {
  type: 'delegation' | 'invocation' | 'unknown'
  version?: string
}

export function extractTypeFromTag(typeTag: string): TokenTypeInfo {
  const match = typeTag.match(UCAN_TYPE_TAG_PATTERN)
  if (!match)
    return { type: 'unknown' }

  const typeAbbr = match[1].toLowerCase()
  const version = match[2]
  const mappedType = TYPE_ABBREVIATION_MAP[typeAbbr]

  return mappedType ? { type: mappedType, version } : { type: 'unknown' }
}

function detectTokenType(token: string): TokenTypeInfo {
  try {
    let decoded: any
    try {
      decoded = decodeUCAN(token)
    }
    catch {
      // If CBOR parsing fails, try to extract type tag from token string
      // Token might be base64, hex, or raw - try to decode for pattern matching
      let searchString = token
      try {
        const binaryString = atob(token)
        searchString = binaryString
      }
      catch {
        // Not base64, use token as-is
      }

      const typeTagMatch = searchString.match(UCAN_TYPE_TAG_PATTERN)
      if (typeTagMatch) {
        return extractTypeFromTag(searchString)
      }
      throw new Error('Could not decode CBOR')
    }

    // UCAN tokens are CBOR arrays with [signature, payload]
    if (Array.isArray(decoded) && decoded.length === 2) {
      const payload = decoded[1]

      // Payload should have a string key like 'ucan/dlg@1.0.0-rc.1'
      if (typeof payload === 'object' && payload !== null) {
        // Find UCAN type tag key in the payload
        for (const key in payload) {
          if (UCAN_TYPE_TAG_PATTERN.test(key)) {
            return extractTypeFromTag(key)
          }
        }
      }
    }
  }
  catch {
    // Not a valid CBOR token, only UCAN 1.0 CBOR is supported
    return { type: 'unknown' }
  }

  return { type: 'unknown' }
}

function parseUCANsHeader(value: string): string[] {
  // Comma-separated list, may include spaces
  return value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

function createTokenItem(
  token: string,
  originalToken: string,
  header: 'Authorization' | 'ucans',
  url: string,
  capturedAt: number,
): TokenItem {
  const typeInfo = detectTokenType(token)
  return {
    token,
    url,
    header,
    capturedAt,
    format: token !== originalToken ? 'container' : 'raw',
    tokenType: typeInfo.type,
    specVersion: typeInfo.version,
  }
}

export function captureFromRequest(request: Browser.devtools.network.Request | HARFormatEntry): TokenItem[] {
  const headers = request.request?.headers ?? []
  const url = request.request?.url ?? ''
  const capturedAt = Date.now()
  const out: TokenItem[] = []

  for (const h of headers) {
    const name = h.name.toLowerCase()
    let tokens: string[] = []
    let headerType: 'Authorization' | 'ucans' | null = null

    if (name === 'authorization' && h.value.startsWith('Bearer ')) {
      tokens = [h.value.slice('Bearer '.length)]
      headerType = 'Authorization'
    }
    else if (name === 'ucans') {
      tokens = parseUCANsHeader(h.value)
      headerType = 'ucans'
    }

    if (headerType) {
      for (const token of tokens) {
        const decodedTokens = decoder.decode(token)
        for (const decodedToken of decodedTokens) {
          out.push(createTokenItem(decodedToken, token, headerType, url, capturedAt))
        }
      }
    }
  }

  return out
}
