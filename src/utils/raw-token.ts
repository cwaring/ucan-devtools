import type { DecodedTokens, TokenDecoder } from './decoders'

import { looksLikeUCANContainer } from './container'

export const rawTokenDecoder: TokenDecoder = {
  canDecode(input: string): boolean {
    // If it looks like a container, let container decoder handle it
    return !looksLikeUCANContainer(input)
  },
  decode(input: string): DecodedTokens {
    return input ? [input] : []
  },
}
