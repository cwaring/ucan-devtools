import { Buffer } from 'node:buffer'
import * as cborg from 'cborg'
import { gzip } from 'pako'
import { describe, expect, it } from 'vitest'

import { containerDecoder } from './container'
import { base64URLToBytes, bytesToBase64URL, bytesToLatin1 } from './encoding'

// Same mock UCAN token used in other tests (DAG-CBOR bytes, base64-encoded)
const MOCK_DELEGATION_TOKEN_BASE64 = 'glhA/ynNOVcvmCF24rmT4ZYSVVKiWmeWvOr8RTP7amuL/iyu14oi9HN1RlNkJEshYSVVqTh8YdIqbwZVFcCTU8v4BaJhaEg0Ae0B7QETcXN1Y2FuL2RsZ0AxLjAuMC1yYy4xqWNhdWR4OGRpZDprZXk6ejZNa3ViQ1ZZaFJjcUg0QkR0UDEzendWRTFTcm9xUTU2Z24xeVE1RngyZXBkTVpyY2NtZGsvZGVidWcvZWNob2NleHAaaUvqj2Npc3N4OGRpZDprZXk6ejZNa3dDak1veVJFY1ZEN1ZrN2hCTUNyY1pNWG1pZktKcEhvN2JQb3ExRUVrMk5KY25iZhpiS+f7Y3BvbIBjc3VieDhkaWQ6a2V5Ono2TWt1YkNWWWhSY3FINEJEdFAxM3p3VkUxU3JvcVE1NmduMXlRNUZ4MmVwZE1acmRtZXRhoWRub3RleDNNb2NrIGRlbGVnYXRpb24gZ2VuZXJhdGVkIGxvY2FsbHkgYnkgVUNBTiBJbnNwZWN0b3Jlbm9uY2VMQfDJBlGeGEDSiU60'

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64')
}

function toBase64URL(bytes: Uint8Array): string {
  return bytesToBase64URL(bytes)
}

function makeContainerCBORBytes(): Uint8Array {
  const tokenBytes = Uint8Array.from(Buffer.from(MOCK_DELEGATION_TOKEN_BASE64, 'base64'))
  const container = { 'ctn-v1': [tokenBytes] }
  return cborg.encode(container)
}

describe('containerDecoder', () => {
  it('should decode @ (raw bytes, no compression)', () => {
    const cborBytes = makeContainerCBORBytes()
    const input = String.fromCharCode(0x40) + bytesToLatin1(cborBytes)

    const out = containerDecoder.decode(input)
    expect(out).toHaveLength(1)

    const decodedTokenBytes = base64URLToBytes(out[0])
    expect(toBase64(decodedTokenBytes)).toBe(MOCK_DELEGATION_TOKEN_BASE64)
  })

  it('should decode B (base64 std padding, no compression)', () => {
    const cborBytes = makeContainerCBORBytes()
    const input = String.fromCharCode(0x42) + toBase64(cborBytes)

    const out = containerDecoder.decode(input)
    expect(out).toHaveLength(1)

    const decodedTokenBytes = base64URLToBytes(out[0])
    expect(toBase64(decodedTokenBytes)).toBe(MOCK_DELEGATION_TOKEN_BASE64)
  })

  it('should decode C (base64URL no padding, no compression)', () => {
    const cborBytes = makeContainerCBORBytes()
    const input = String.fromCharCode(0x43) + toBase64URL(cborBytes)

    const out = containerDecoder.decode(input)
    expect(out).toHaveLength(1)

    const decodedTokenBytes = base64URLToBytes(out[0])
    expect(toBase64(decodedTokenBytes)).toBe(MOCK_DELEGATION_TOKEN_BASE64)
  })

  it('should decode M (raw bytes, gzip)', () => {
    const cborBytes = makeContainerCBORBytes()
    const compressed = gzip(cborBytes)
    const input = String.fromCharCode(0x4D) + bytesToLatin1(compressed)

    const out = containerDecoder.decode(input)
    expect(out).toHaveLength(1)

    const decodedTokenBytes = base64URLToBytes(out[0])
    expect(toBase64(decodedTokenBytes)).toBe(MOCK_DELEGATION_TOKEN_BASE64)
  })

  it('should decode O (base64 std padding, gzip)', () => {
    const cborBytes = makeContainerCBORBytes()
    const compressed = gzip(cborBytes)
    const input = String.fromCharCode(0x4F) + toBase64(compressed)

    const out = containerDecoder.decode(input)
    expect(out).toHaveLength(1)

    const decodedTokenBytes = base64URLToBytes(out[0])
    expect(toBase64(decodedTokenBytes)).toBe(MOCK_DELEGATION_TOKEN_BASE64)
  })

  it('should decode P (base64URL no padding, gzip)', () => {
    const cborBytes = makeContainerCBORBytes()
    const compressed = gzip(cborBytes)
    const input = String.fromCharCode(0x50) + toBase64URL(compressed)

    const out = containerDecoder.decode(input)
    expect(out).toHaveLength(1)

    const decodedTokenBytes = base64URLToBytes(out[0])
    expect(toBase64(decodedTokenBytes)).toBe(MOCK_DELEGATION_TOKEN_BASE64)
  })
})
