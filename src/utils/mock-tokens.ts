/**
 * Mock UCAN tokens for testing and simulation
 * These are real CBOR-encoded UCAN tokens used in unit tests
 */

// Real delegation token from test suite - CBOR encoded with signature
export const MOCK_DELEGATION_TOKEN = 'glhAl+su1rDv0DwO2TDa4Rd7rY2gV5dT1UPSYpYFXps0GuG2ofyOlsE1fX9Oa9lEtSRWoRYOUNEtw8KsDEuPSKOAB6JhaEg0Ae0B7QETcXN1Y2FuL2RsZ0AxLjAuMC1yYy4xqWNhdWR4OGRpZDprZXk6ejZNa2ZzN0JlcUV4dnIzVmhINko5eUQzY1NQeWY1VWcxRk5lbzVaV04xYk5HTG5RY2NtZGsvZGVidWcvZWNob2NleHAaaUwlLGNpc3N4OGRpZDprZXk6ejZNa3dDb2l5SDJZSnkzNlNuSkpFc0cyalpzeGduVmpaWjdUeFhVTXhYNDhuYTh2Y25iZhppTCKYY3BvbIBjc3VieDhkaWQ6a2V5Ono2TWtmczdCZXFFeHZyM1ZoSDZKOXlEM2NTUHlmNVVnMUZOZW81WldOMWJOR0xuUWRtZXRhoWRub3RleDNNb2NrIGRlbGVnYXRpb24gZ2VuZXJhdGVkIGxvY2FsbHkgYnkgVUNBTiBJbnNwZWN0b3Jlbm9uY2VMAB+tTd0GE06W7VSy'

export const MOCK_INVOCATION_TOKEN = 'glhAP52kjaBWs/tYnylDmmxc/8xPf5Oc/23+syoM9s/nFQx7wEZtmsJgwG3O8val9HXWLgIHL2cx7qTpzvic6aAiBaJhaEg0Ae0B7QETcXN1Y2FuL2ludkAxLjAuMC1yYy4xqmNhdWR4OGRpZDprZXk6ejZNa3JDYnJCQkdZdGhxQmhRdk5ieVhaMlU2d3RXeVJXdXJ2bTh4Q1czQXh2TUFwY2NtZGsvZGVidWcvZWNob2NleHAaaUwk72Npc3N4OGRpZDprZXk6ejZNa3RjUGNRbm5MQnhCY3g5d21LSEY5SkVicFRiZFRFQkdzMndRYXFtRnVUZ0ZrY25iZhppTCOlY3ByZoHYKlglAAFxEiBwVHJmFIXtrlRUv1HYlHSzBojvlEJx4GW6w+05xYf11GNzdWJ4OGRpZDprZXk6ejZNa3RjUGNRbm5MQnhCY3g5d21LSEY5SkVicFRiZFRFQkdzMndRYXFtRnVUZ0ZrZGFyZ3OiZ21lc3NhZ2V4GUhlbGxvIGZyb20gVUNBTiBJbnNwZWN0b3JpcmVxdWVzdElkam1vY2stZGVidWdkbWV0YaFndHJhY2VJZG9tb2NrLWludm9jYXRpb25lbm9uY2VQAQIDBAUGBwgJCgsMDQ4PEA=='

export interface MockTokenScenario {
  name: string
  description: string
  authorizationHeader?: string
  ucansHeader?: string
  expectedType: 'delegation' | 'invocation' | 'revocation' | 'promise' | 'unknown'
  expectedVersion?: string
}

/**
 * Scenarios for testing token detection and capture
 */
export const TOKEN_SCENARIOS: MockTokenScenario[] = [
  {
    name: 'Single Delegation Token',
    description: 'Authorization header with single delegation token',
    authorizationHeader: `Bearer ${MOCK_DELEGATION_TOKEN}`,
    expectedType: 'delegation',
    expectedVersion: '1.0.0-rc.1',
  },
  {
    name: 'Single Invocation Token',
    description: 'Authorization header with single invocation token',
    authorizationHeader: `Bearer ${MOCK_INVOCATION_TOKEN}`,
    expectedType: 'invocation',
    expectedVersion: '1.0.0-rc.1',
  },
  {
    name: 'Multiple Tokens in ucans Header',
    description: 'ucans header with comma-separated delegation tokens',
    ucansHeader: `${MOCK_DELEGATION_TOKEN}, ${MOCK_DELEGATION_TOKEN}`,
    expectedType: 'delegation',
    expectedVersion: '1.0.0-rc.1',
  },
  {
    name: 'Invalid Token',
    description: 'Malformed base64 that cannot be decoded as CBOR',
    authorizationHeader: 'Bearer not-a-valid-token-at-all',
    expectedType: 'unknown',
  },
  {
    name: 'Random Base64',
    description: 'Valid base64 but not UCAN CBOR structure',
    authorizationHeader: `Bearer ${btoa('random data here')}`,
    expectedType: 'unknown',
  },
]

/**
 * Get all mock tokens from scenarios
 */
export function getAllMockTokens(): string[] {
  const tokens = new Set<string>()
  for (const scenario of TOKEN_SCENARIOS) {
    if (scenario.authorizationHeader?.startsWith('Bearer ')) {
      tokens.add(scenario.authorizationHeader.slice('Bearer '.length))
    }
    if (scenario.ucansHeader) {
      scenario.ucansHeader.split(',').forEach((token) => {
        const trimmed = token.trim()
        if (trimmed)
          tokens.add(trimmed)
      })
    }
  }
  return Array.from(tokens)
}
