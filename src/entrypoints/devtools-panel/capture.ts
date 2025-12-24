import { containerDecoder } from '@/utils/container'
import { composeDecoders } from '@/utils/decoders'
import { rawTokenDecoder } from '@/utils/raw-token'

export interface TokenItem {
  token: string
  url: string
  header: 'Authorization' | 'ucans'
  capturedAt: number
  format: 'container' | 'raw'
  tokenType: 'delegation' | 'invocation' | 'unknown'
}

const decoder = composeDecoders([containerDecoder, rawTokenDecoder])

function decodeJWT(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length !== 3)
      return null
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  }
  catch {
    return null
  }
}

function detectTokenType(token: string): 'delegation' | 'invocation' | 'unknown' {
  const payload = decodeJWT(token)
  if (!payload)
    return 'unknown'
  // Invocation tokens have nnc (nonce), cmd (command), and sub (subject)
  if (payload.nnc && payload.cmd && payload.sub)
    return 'invocation'
  // Delegation tokens typically have att (attenuation) or prf (proof)
  return 'delegation'
}

function parseUcansHeader(value: string): string[] {
  // Comma-separated list, may include spaces
  return value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

export function captureFromRequest(request: Browser.devtools.network.Request | HARFormatEntry): TokenItem[] {
  const harEntry = request
  const headers = harEntry.request?.headers ?? []
  const url = harEntry.request?.url ?? ''
  const capturedAt = Date.now()
  const out: TokenItem[] = []

  for (const h of headers) {
    const name = h.name.toLowerCase()
    if (name === 'authorization' && h.value.startsWith('Bearer ')) {
      const token = h.value.slice('Bearer '.length)
      const decoded = decoder.decode(token)
      for (const t of decoded) {
        const tokenType = detectTokenType(t)
        out.push({ token: t, url, header: 'Authorization', capturedAt, format: t !== token ? 'container' : 'raw', tokenType })
      }
    }
    else if (name === 'ucans') {
      const tokens = parseUcansHeader(h.value)
      for (const token of tokens) {
        const decoded = decoder.decode(token)
        for (const t of decoded) {
          const tokenType = detectTokenType(t)
          out.push({ token: t, url, header: 'ucans', capturedAt, format: t !== token ? 'container' : 'raw', tokenType })
        }
      }
    }
  }

  return out
}
