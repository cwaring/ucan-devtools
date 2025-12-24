export type DecodedTokens = string[]

export interface TokenDecoder {
  canDecode: (input: string) => boolean
  decode: (input: string) => DecodedTokens
}

export function composeDecoders(decoders: TokenDecoder[]): TokenDecoder {
  return {
    canDecode: () => true,
    decode(input: string) {
      for (const d of decoders) {
        try {
          if (d.canDecode(input)) {
            const out = d.decode(input)
            if (Array.isArray(out) && out.length >= 1)
              return out
          }
        }
        catch {
          // try next decoder
        }
      }
      // Fallback: treat as raw single token
      return [input]
    },
  }
}
