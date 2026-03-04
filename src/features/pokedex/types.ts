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

export type PokemonRaw = {
  base_stats?: Partial<Record<StatKey, number>>
  learn_set?: Array<{ level?: number; move?: string }>
  egg_moves?: string[]
  evolution_table?: Array<{
    method?: string
    parameter?: string | number | boolean
    target?: string
    extra?: string | number | boolean
  }>
}

export type PokemonDataFile = Record<string, PokemonRaw>

export type PokemonRecord = {
  key: string
  displayName: string
  baseStats: BaseStats
  total: number
  learnSet: LearnSetMove[]
  eggMoves: string[]
  evolutionTable: EvolutionStep[]
  spriteSlug: string
  baseSlug: string
}

export type SpritePokemon = Pick<
  PokemonRecord,
  'key' | 'displayName' | 'spriteSlug' | 'baseSlug'
>

export type PokemonTypeMap = Record<string, string[]>

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
