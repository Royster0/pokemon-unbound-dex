import { createServerFn } from '@tanstack/react-start'
import { TYPE_CACHE_TTL_MS } from './constants'
import type { PokemonTypeMap } from './types'
import { parsePokemonTypesFromHtml } from './utils'

let cachedPokemonTypes: PokemonTypeMap | null = null
let cachedPokemonTypesAt = 0

export const getPokemonTypesFromPokemonDb = createServerFn({ method: 'GET' }).handler(
  async () => {
    const now = Date.now()
    if (cachedPokemonTypes && now - cachedPokemonTypesAt < TYPE_CACHE_TTL_MS) {
      return cachedPokemonTypes
    }

    const response = await fetch('https://pokemondb.net/pokedex/all')
    if (!response.ok) {
      throw new Error(`PokemonDB request failed with status ${response.status}.`)
    }

    const html = await response.text()
    const parsed = parsePokemonTypesFromHtml(html)

    if (Object.keys(parsed).length === 0) {
      throw new Error('PokemonDB type parsing produced no records.')
    }

    cachedPokemonTypes = parsed
    cachedPokemonTypesAt = now
    return parsed
  },
)
