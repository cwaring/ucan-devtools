import type { DecodedTokens, TokenDecoder } from './decoders'

function looksLikeContainer(input: string): boolean {
  const h = input.charCodeAt(0)
  return h === 0x40 || h === 0x42 || h === 0x43 || h === 0x4D || h === 0x4F || h === 0x50
}

export const rawTokenDecoder: TokenDecoder = {
  canDecode(input: string): boolean {
    // If it looks like a container, let container decoder handle it
    return !looksLikeContainer(input)
  },
  decode(input: string): DecodedTokens {
    return input ? [input] : []
  },
}
