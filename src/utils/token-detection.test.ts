import { Buffer } from 'node:buffer'
import * as cborg from 'cborg'
import { describe, expect, it } from 'vitest'
import {
  extractTypeFromTag,
  UCAN_TYPE_TAG_PATTERN,
} from '@/entrypoints/devtools-panel/capture'

// Mock UCAN delegation token (same as delegation.test.ts)
const MOCK_DELEGATION_TOKEN = 'glhA/ynNOVcvmCF24rmT4ZYSVVKiWmeWvOr8RTP7amuL/iyu14oi9HN1RlNkJEshYSVVqTh8YdIqbwZVFcCTU8v4BaJhaEg0Ae0B7QETcXN1Y2FuL2RsZ0AxLjAuMC1yYy4xqWNhdWR4OGRpZDprZXk6ejZNa3ViQ1ZZaFJjcUg0QkR0UDEzendWRTFTcm9xUTU2Z24xeVE1RngyZXBkTVpyY2NtZGsvZGVidWcvZWNob2NleHAaaUvqj2Npc3N4OGRpZDprZXk6ejZNa3dDak1veVJFY1ZEN1ZrN2hCTUNyY1pNWG1pZktKcEhvN2JQb3ExRUVrMk5KY25iZmJLx/tjcG9sY3N1Yng4ZGlkOmtleTp6Nk1rdWJDVlloUmNxSDRCRHRQMTN6d1ZFMVNyb3FRNTZnbjF5UTVGeDJlcGRNWnJkbWV0YaFkbm90ZXgzTW9jayBkZWxlZ2F0aW9uIGdlbmVyYXRlZCBsb2NhbGx5IGJ5IFVDQU4gSW5zcGVjdG9yZW5vbmNlTADwyVFAwk60'

interface TokenTypeInfo {
  type: 'delegation' | 'invocation' | 'unknown'
  version?: string
}

function detectTokenType(token: string): TokenTypeInfo {
  try {
    // Try to decode as base64 CBOR envelope
    const bytes = Buffer.from(token, 'base64')

    let decoded: any
    try {
      decoded = cborg.decode(bytes)
    }
    catch {
      // If CBOR parsing fails, try to extract type tag from binary text
      const text = bytes.toString('latin1')
      if (UCAN_TYPE_TAG_PATTERN.test(text)) {
        return extractTypeFromTag(text)
      }
      throw new Error('Could not decode CBOR')
    }

    // UCAN tokens are CBOR arrays with [signature, payload]
    if (Array.isArray(decoded) && decoded.length === 2) {
      const payload = decoded[1]
      if (typeof payload === 'object' && payload !== null) {
        for (const key in payload) {
          if (UCAN_TYPE_TAG_PATTERN.test(key)) {
            return extractTypeFromTag(key)
          }
        }
      }
    }
  }
  catch {
    // Not a valid CBOR token
  }

  return { type: 'unknown' }
}

describe('token type detection', () => {
  describe('detectTokenType', () => {
    it('should detect delegation tokens with version', () => {
      const typeInfo = detectTokenType(MOCK_DELEGATION_TOKEN)
      expect(typeInfo).toEqual({ type: 'delegation', version: '1.0.0-rc.1' })
    })

    it('should return unknown for invalid tokens', () => {
      expect(detectTokenType('not-a-valid-token')).toEqual({ type: 'unknown' })
    })

    it('should return unknown for non-UCAN CBOR', () => {
      const validCbor = cborg.encode({ foo: 'bar' })
      const base64 = Buffer.from(validCbor).toString('base64')
      expect(detectTokenType(base64)).toEqual({ type: 'unknown' })
    })

    it('should verify type tag exists in payload', () => {
      const decoded = Buffer.from(MOCK_DELEGATION_TOKEN, 'base64')
      const text = decoded.toString('latin1')
      expect(text).toContain('ucan/dlg@1.0.0-rc.1')
    })
  })

  describe('type tag pattern matching', () => {
    const typeTagTests = [
      { abbr: 'dlg', type: 'delegation' },
      { abbr: 'inv', type: 'invocation' },
    ] as const

    it.each(typeTagTests)('should map $abbr to $type', ({ abbr, type }) => {
      const typeTag = `ucan/${abbr}@1.0.0-rc.1`
      expect(extractTypeFromTag(typeTag).type).toBe(type)
    })

    it('should extract version from type tag', () => {
      const result = extractTypeFromTag('ucan/dlg@1.0.0-rc.1')
      expect(result.version).toBe('1.0.0-rc.1')
    })

    it('should return unknown for invalid type tag', () => {
      expect(extractTypeFromTag('invalid')).toEqual({ type: 'unknown' })
    })
  })
})
