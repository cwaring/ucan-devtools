import { describe, expect, it } from 'vitest'

import { containerDecoder } from './container'
import { MOCK_CONTAINER_TOKEN, MOCK_DELEGATION_TOKEN, MOCK_INVOCATION_TOKEN, TOKEN_SCENARIOS } from './mock-tokens'
import { decodeUCAN } from './ucan-decoder'

describe('mock token fixtures', () => {
  it('provides a container scenario for the Authorization header', () => {
    expect(TOKEN_SCENARIOS.some(scenario => scenario.name === 'UCAN Container Token')).toBe(true)
  })

  it('provides a container scenario for the ucans header', () => {
    expect(TOKEN_SCENARIOS.some(scenario => scenario.name === 'UCAN Container in ucans Header')).toBe(true)
  })

  it('ucans header scenario includes a raw token and a container token', () => {
    const scenario = TOKEN_SCENARIOS.find(s => s.name === 'UCAN Container in ucans Header')!
    const parts = scenario.ucansHeader!.split(', ')
    expect(parts).toHaveLength(2)

    const [containerPart, rawPart] = parts
    expect(containerDecoder.canDecode(containerPart)).toBe(true)
    expect(containerDecoder.canDecode(rawPart)).toBe(false)
  })

  it('keeps the mock container fixture decodable with multiple tokens', () => {
    const decoded = containerDecoder.decode(MOCK_CONTAINER_TOKEN)

    expect(decoded).toHaveLength(2)
    expect(decodeUCAN(decoded[0])).toEqual(decodeUCAN(MOCK_DELEGATION_TOKEN))
    expect(decodeUCAN(decoded[1])).toEqual(decodeUCAN(MOCK_INVOCATION_TOKEN))
  })
})
