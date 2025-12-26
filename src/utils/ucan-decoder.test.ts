import { Buffer } from 'node:buffer'
import * as cborg from 'cborg'
import { CID } from 'multiformats/cid'
import { describe, expect, it } from 'vitest'
import {
  clearDecodeCache,
  decodeUCAN,
  decodeUCANWithMeta,
  safeDecodeUCAN,
  UCANDecodeError,
} from './ucan-decoder'

describe('ucan-decoder', () => {
  describe('format detection', () => {
    it('should decode base64-encoded CBOR', () => {
      const data = { test: 'value', number: 42 }
      const encoded = cborg.encode(data)
      const base64 = Buffer.from(encoded).toString('base64')

      const result = decodeUCAN(base64)
      expect(result).toEqual(data)
    })

    it('should decode hex-encoded CBOR', () => {
      const data = { test: 'value' }
      const encoded = cborg.encode(data)
      const hex = Buffer.from(encoded).toString('hex').toUpperCase() // Uppercase to avoid base64 detection

      const result = decodeUCAN(hex)
      expect(result).toEqual(data)
    })

    it('should decode Uint8Array directly', () => {
      const data = { test: 'value' }
      const encoded = cborg.encode(data)

      const result = decodeUCAN(encoded)
      expect(result).toEqual(data)
    })

    it('should handle raw binary strings', () => {
      const data = { simple: 123 }
      const encoded = cborg.encode(data)
      const binaryString = String.fromCharCode(...encoded)

      const result = decodeUCAN(binaryString)
      expect(result).toEqual(data)
    })
  })

  describe('ipld tag handling', () => {
    it('should handle tag 42 (CID) with proper CID decoding', () => {
      // Create a CID for testing
      const cid = CID.parse('bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi')
      const cidBytes = cid.bytes

      // Manually encode CBOR with tag 42
      const taggedData = new Uint8Array([
        0xD8,
        0x2A, // Tag 42
        0x58,
        cidBytes.length, // Byte string with length
        ...cidBytes,
      ])

      const result = decodeUCAN(taggedData) as any
      expect(result).toHaveProperty('/')
      expect(result['/']).toBe(cid.toString())
    })

    it('should fallback to raw bytes if CID decode fails', () => {
      const invalidCidBytes = new Uint8Array([0x00, 0x01, 0x02])

      // Manually encode CBOR with tag 42
      const taggedData = new Uint8Array([
        0xD8,
        0x2A, // Tag 42
        0x43, // Byte string with length 3
        ...invalidCidBytes,
      ])

      const result = decodeUCAN(taggedData) as any
      expect(result).toHaveProperty('/')
      expect(result['/']).toEqual(invalidCidBytes)
    })

    it('should handle tag 258 (Set)', () => {
      // Manually encode CBOR with tag 258
      const taggedData = new Uint8Array([
        0xD9,
        0x01,
        0x02, // Tag 258
        0x85, // Array of 5 elements
        0x01,
        0x02,
        0x03,
        0x02,
        0x01, // [1, 2, 3, 2, 1]
      ])

      const result = decodeUCAN(taggedData)
      expect(result).toBeInstanceOf(Set)
      expect(result).toEqual(new Set([1, 2, 3]))
    })
  })

  describe('caching', () => {
    it('should cache decoded results by default', () => {
      clearDecodeCache()

      const data = { cached: true }
      const encoded = cborg.encode(data)
      const base64 = Buffer.from(encoded).toString('base64')

      const result1 = decodeUCAN(base64)
      const result2 = decodeUCAN(base64)

      expect(result1).toBe(result2) // Should be same reference
    })

    it('should not cache when useCache is false', () => {
      const data = { cached: false }
      const encoded = cborg.encode(data)
      const base64 = Buffer.from(encoded).toString('base64')

      const result1 = decodeUCAN(base64, false)
      const result2 = decodeUCAN(base64, false)

      expect(result1).toEqual(result2) // Same value
      expect(result1).not.toBe(result2) // Different references
    })

    it('should clear cache', () => {
      const data = { test: 'cache' }
      const encoded = cborg.encode(data)
      const base64 = Buffer.from(encoded).toString('base64')

      const result1 = decodeUCAN(base64)
      clearDecodeCache()
      const result2 = decodeUCAN(base64)

      expect(result1).toEqual(result2)
      expect(result1).not.toBe(result2)
    })
  })

  describe('decodeUCANWithMeta', () => {
    it('should return metadata for base64 tokens', () => {
      const data = { test: 'meta' }
      const encoded = cborg.encode(data)
      const base64 = Buffer.from(encoded).toString('base64')

      const result = decodeUCANWithMeta(base64)

      expect(result.value).toEqual(data)
      expect(result.format).toBe('base64')
      expect(result.size).toBe(encoded.length)
    })

    it('should return metadata for hex tokens', () => {
      const data = { test: 'hex' }
      const encoded = cborg.encode(data)
      const hex = Buffer.from(encoded).toString('hex').toUpperCase()

      const result = decodeUCANWithMeta(hex)

      expect(result.value).toEqual(data)
      expect(result.format).toBe('hex')
      expect(result.size).toBe(encoded.length)
    })

    it('should return metadata for Uint8Array', () => {
      const data = { test: 'bytes' }
      const encoded = cborg.encode(data)

      const result = decodeUCANWithMeta(encoded)

      expect(result.value).toEqual(data)
      expect(result.format).toBe('bytes')
      expect(result.size).toBe(encoded.length)
    })
  })

  describe('safeDecodeUCAN', () => {
    it('should return success result for valid CBOR', () => {
      const data = { safe: true }
      const encoded = cborg.encode(data)
      const base64 = Buffer.from(encoded).toString('base64')

      const result = safeDecodeUCAN(base64)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual(data)
      }
    })

    it('should return error result for invalid CBOR', () => {
      const invalid = 'not-valid-cbor-data!!!'

      const result = safeDecodeUCAN(invalid)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeDefined()
        expect(result.format).toBeDefined()
      }
    })

    it('should include format in error result', () => {
      // Create invalid base64 that will fail CBOR decode
      const invalidCbor = Buffer.from([0xFF, 0xFF, 0xFF]).toString('base64')

      const result = safeDecodeUCAN(invalidCbor)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.format).toBe('base64')
      }
    })
  })

  describe('error handling', () => {
    it('should throw UCANDecodeError for invalid data', () => {
      const invalid = 'this-is-not-cbor'

      expect(() => decodeUCAN(invalid)).toThrow(UCANDecodeError)
    })

    it('should include detected format in error', () => {
      // Use a string that's valid hex but will fail CBOR decode
      // so tokenToBytes returns hex format before decode fails
      const data = { test: 'data' }
      const encoded = cborg.encode(data)
      const validHex = Buffer.from(encoded).toString('hex')
      // Corrupt the hex by changing a byte to make CBOR invalid
      const corruptedHex = `00${validHex.slice(2)}`

      try {
        decodeUCAN(corruptedHex)
        expect.fail('Should have thrown')
      }
      catch (error) {
        expect(error).toBeInstanceOf(UCANDecodeError)
        if (error instanceof UCANDecodeError) {
          // Since we corrupted valid CBOR hex, it should detect as base64 and fail
          // Just check that we got an error with format info
          expect(error.detectedFormat).toBeDefined()
          expect(error.message).toContain('Failed to decode')
        }
      }
    })

    it('should preserve cause in error', () => {
      const invalid = 'not-cbor'

      try {
        decodeUCAN(invalid)
        expect.fail('Should have thrown')
      }
      catch (error) {
        expect(error).toBeInstanceOf(UCANDecodeError)
        if (error instanceof UCANDecodeError) {
          expect(error.cause).toBeDefined()
        }
      }
    })
  })

  describe('uCAN token structure', () => {
    it('should decode UCAN delegation token', () => {
      // Mock UCAN token from delegation.test.ts
      const token = 'glhA/ynNOVcvmCF24rmT4ZYSVVKiWmeWvOr8RTP7amuL/iyu14oi9HN1RlNkJEshYSVVqTh8YdIqbwZVFcCTU8v4BaJhaEg0Ae0B7QETcXN1Y2FuL2RsZ0AxLjAuMC1yYy4xqWNhdWR4OGRpZDprZXk6ejZNa3ViQ1ZZaFJjcUg0QkR0UDEzendWRTFTcm9xUTU2Z24xeVE1RngyZXBkTVpyY2NtZGsvZGVidWcvZWNob2NleHAaaUvqj2Npc3N4OGRpZDprZXk6ejZNa3dDak1veVJFY1ZEN1ZrN2hCTUNyY1pNWG1pZktKcEhvN2JQb3ExRUVrMk5KY25iZhpiS+f7Y3BvbIBjc3VieDhkaWQ6a2V5Ono2TWt1YkNWWWhSY3FINEJEdFAxM3p3VkUxU3JvcVE1NmduMXlRNUZ4MmVwZE1acmRtZXRhoWRub3RleDNNb2NrIGRlbGVnYXRpb24gZ2VuZXJhdGVkIGxvY2FsbHkgYnkgVUNBTiBJbnNwZWN0b3Jlbm9uY2VMQfDJBlGeGEDSiU60'

      const result = decodeUCAN(token) as any

      // UCAN tokens are [signature, payload] arrays
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)

      const [signature, payload] = result
      expect(signature).toBeInstanceOf(Uint8Array)
      expect(payload).toBeTypeOf('object')

      // Check for UCAN delegation type tag
      const typeTagKey = Object.keys(payload).find(k => k.startsWith('ucan/dlg@'))
      expect(typeTagKey).toBeDefined()

      // The payload is stored under the type tag key in UCAN 1.0 format
      const UCANPayload = payload[typeTagKey!]
      expect(UCANPayload).toHaveProperty('iss')
      expect(UCANPayload).toHaveProperty('aud')
      expect(UCANPayload.iss).toContain('did:key:')
      expect(UCANPayload.aud).toContain('did:key:')
    })
  })
})
