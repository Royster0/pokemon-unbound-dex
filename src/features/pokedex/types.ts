export type StatKey =
  | 'hp'
  | 'attack'
  | 'defense'
  | 'sp_attack'
  | 'sp_defense'
  | 'speed'

export type BaseStats = Record<StatKey, number>

export type LearnSetMove = {
  level: number
  move: string
}

export type EvolutionStep = {
  method: string
  parameter?: string | number | boolean
  target: string
  extra?: string | number | boolean
}

export type EvolutionLink = {
  sourceKey: string
  targetKey: string
  method: string
  parameter?: string | number | boolean
  extra?: string | number | boolean
}

export type PokemonAbilities = {
  primary: string | null
  secondary: string | null
  hidden: string | null
}

export type PokemonHeldItems = {
  common: string | null
  rare: string | null
}

export type PokemonRecord = {
  key: string
  id: number | null
  displayName: string
  baseKey: string
  baseStats: BaseStats
  total: number
  learnSet: LearnSetMove[]
  eggMoves: string[]
  evolutionTable: EvolutionStep[]
  types: string[]
  abilities: PokemonAbilities
  eggGroups: string[]
  heldItems: PokemonHeldItems
  growthRate: string | null
  catchRate: number | null
  spriteSources: string[]
  spriteSlug: string
  baseSlug: string
}

export type SpritePokemon = Pick<
  PokemonRecord,
  'key' | 'displayName' | 'spriteSlug' | 'baseSlug' | 'spriteSources'
>

export type PokedexCatalogFile = {
  meta: {
    schemaVersion: number
    generatedAt: string
    sources: Record<string, unknown>
    counts: Record<string, number>
  }
  pokemon: Record<string, PokemonRecord>
}

export type TypeColor = {
  bg: string
  border: string
  text: string
}

export type PokemonTypeName =
  | 'normal'
  | 'fire'
  | 'water'
  | 'electric'
  | 'grass'
  | 'ice'
  | 'fighting'
  | 'poison'
  | 'ground'
  | 'flying'
  | 'psychic'
  | 'bug'
  | 'rock'
  | 'ghost'
  | 'dragon'
  | 'dark'
  | 'steel'
  | 'fairy'

export type DefenseMultiplierMap = Record<PokemonTypeName, number>

export type DefenseTone = {
  bg: string
  border: string
  text: string
}

export type PokedexPageProps = {
  showListPage: boolean
  initialSelectedKey?: string
}
