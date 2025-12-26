import { Buffer } from 'node:buffer'
import * as cborg from 'cborg'
import { describe, expect, it } from 'vitest'

// Mock UCAN delegation token in base64 format (CBOR-encoded)
const MOCK_DELEGATION_TOKEN = 'glhA/ynNOVcvmCF24rmT4ZYSVVKiWmeWvOr8RTP7amuL/iyu14oi9HN1RlNkJEshYSVVqTh8YdIqbwZVFcCTU8v4BaJhaEg0Ae0B7QETcXN1Y2FuL2RsZ0AxLjAuMC1yYy4xqWNhdWR4OGRpZDprZXk6ejZNa3ViQ1ZZaFJjcUg0QkR0UDEzendWRTFTcm9xUTU2Z24xeVE1RngyZXBkTVpyY2NtZGsvZGVidWcvZWNob2NleHAaaUvqj2Npc3N4OGRpZDprZXk6ejZNa3dDak1veVJFY1ZEN1ZrN2hCTUNyY1pNWG1pZktKcEhvN2JQb3ExRUVrMk5KY25iZhpiS+f7Y3BvbIBjc3VieDhkaWQ6a2V5Ono2TWt1YkNWWWhSY3FINEJEdFAxM3p3VkUxU3JvcVE1NmduMXlRNUZ4MmVwZE1acmRtZXRhoWRub3RleDNNb2NrIGRlbGVnYXRpb24gZ2VuZXJhdGVkIGxvY2FsbHkgYnkgVUNBTiBJbnNwZWN0b3Jlbm9uY2VMQfDJBlGeGEDSiU60'

describe('ucan delegation token (UCAN)', () => {
  describe('basic structure', () => {
    it('should decode from base64', () => {
      const decoded = Buffer.from(MOCK_DELEGATION_TOKEN, 'base64')
      expect(decoded).toBeInstanceOf(Buffer)
      expect(decoded.length).toBeGreaterThan(0)
    })

    it('should be a CBOR array with signature and payload', () => {
      const decoded = Buffer.from(MOCK_DELEGATION_TOKEN, 'base64')
      // First byte should indicate CBOR array (0x82 = array of 2 elements)
      expect(decoded[0]).toBe(0x82)
    })

    it('should contain delegation version marker', () => {
      const decoded = Buffer.from(MOCK_DELEGATION_TOKEN, 'base64')
      const text = decoded.toString('latin1')
      expect(text).toContain('ucan/dlg@1.0.0-rc.1')
    })

    it('should contain expected DID keys', () => {
      const decoded = Buffer.from(MOCK_DELEGATION_TOKEN, 'base64')
      const text = decoded.toString('latin1')
      expect(text).toContain('did:key:z6MkubCVYhRcqH4BDtP13zwVE1SroqQ56gn1yQ5Fx2epdMZr')
      expect(text).toContain('did:key:z6MkwCjMoyREcVD7Vk7hBMCrcZMXmifKJpHo7bPoq1EEk2NJ')
    })

    it('should contain delegation metadata', () => {
      const decoded = Buffer.from(MOCK_DELEGATION_TOKEN, 'base64')
      const text = decoded.toString('latin1')
      expect(text).toContain('Mock delegation generated locally by UCAN Inspector')
    })

    it('should contain capability "/debug/echo"', () => {
      const decoded = Buffer.from(MOCK_DELEGATION_TOKEN, 'base64')
      const text = decoded.toString('latin1')
      expect(text).toContain('/debug/echo')
    })
  })

  describe('cbor structure (CBOR)', () => {
    it('should decode as CBOR array', () => {
      const decoded = Buffer.from(MOCK_DELEGATION_TOKEN, 'base64')
      const delegation = cborg.decode(decoded)
      expect(Array.isArray(delegation)).toBe(true)
      expect(delegation.length).toBe(2) // [signature, payload]
    })

    it('should have Ed25519 signature as first element', () => {
      const decoded = Buffer.from(MOCK_DELEGATION_TOKEN, 'base64')
      const delegation = cborg.decode(decoded)
      const signature = delegation[0]
      expect(signature).toBeInstanceOf(Uint8Array)
      expect(signature.length).toBe(64) // Ed25519 signatures are 64 bytes
    })

    it('should have payload as second element', () => {
      const decoded = Buffer.from(MOCK_DELEGATION_TOKEN, 'base64')
      const delegation = cborg.decode(decoded)
      const payload = delegation[1]
      expect(payload).toBeDefined()
      expect(typeof payload).toBe('object')
    })
  })

  describe('delegation payload', () => {
    it('should have ucan/dlg version key', () => {
      const decoded = Buffer.from(MOCK_DELEGATION_TOKEN, 'base64')
      const delegation = cborg.decode(decoded)
      const payload = delegation[1]
      expect(payload['ucan/dlg@1.0.0-rc.1']).toBeDefined()
    })

    it('should have required UCAN fields', () => {
      const decoded = Buffer.from(MOCK_DELEGATION_TOKEN, 'base64')
      const delegation = cborg.decode(decoded)
      const ucan = delegation[1]['ucan/dlg@1.0.0-rc.1']

      expect(ucan.iss).toBeDefined() // issuer
      expect(ucan.aud).toBeDefined() // audience
      expect(ucan.sub).toBeDefined() // subject
      expect(ucan.cmd).toBe('/debug/echo') // command/capability
    })

    it('should have expiration timestamp', () => {
      const decoded = Buffer.from(MOCK_DELEGATION_TOKEN, 'base64')
      const delegation = cborg.decode(decoded)
      const ucan = delegation[1]['ucan/dlg@1.0.0-rc.1']

      expect(ucan.exp).toBeDefined()
      expect(typeof ucan.exp).toBe('number')
    })

    it('should have metadata with note', () => {
      const decoded = Buffer.from(MOCK_DELEGATION_TOKEN, 'base64')
      const delegation = cborg.decode(decoded)
      const ucan = delegation[1]['ucan/dlg@1.0.0-rc.1']

      expect(ucan.meta).toBeDefined()
      expect(ucan.meta.note).toBe('Mock delegation generated locally by UCAN Inspector')
    })

    it('should have nonce', () => {
      const decoded = Buffer.from(MOCK_DELEGATION_TOKEN, 'base64')
      const delegation = cborg.decode(decoded)
      const ucan = delegation[1]['ucan/dlg@1.0.0-rc.1']

      expect(ucan.nonce).toBeDefined()
      expect(ucan.nonce).toBeInstanceOf(Uint8Array)
    })

    it('should have hash algorithm field', () => {
      const decoded = Buffer.from(MOCK_DELEGATION_TOKEN, 'base64')
      const delegation = cborg.decode(decoded)
      const payload = delegation[1]

      // Hash algorithm is CBOR-encoded, not a plain string
      expect(payload.h).toBeDefined()
      expect(payload.h).toBeInstanceOf(Uint8Array)
    })
  })

  describe('token encoding/decoding', () => {
    it('should preserve data after encode-decode cycle', () => {
      const decoded = Buffer.from(MOCK_DELEGATION_TOKEN, 'base64')
      const delegation = cborg.decode(decoded)

      const reencoded = cborg.encode(delegation)
      const rebase64 = Buffer.from(reencoded).toString('base64')

      const redecoded = Buffer.from(rebase64, 'base64')
      const redelegation = cborg.decode(redecoded)

      expect(redelegation).toEqual(delegation)
    })
  })
})
