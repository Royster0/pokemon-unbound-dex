import type { BaseStats, PokemonTypeName, StatKey, TypeColor } from './types'

export const STAT_CAP = 255

export const EMPTY_STATS: BaseStats = {
  hp: 0,
  attack: 0,
  defense: 0,
  sp_attack: 0,
  sp_defense: 0,
  speed: 0,
}

export const STAT_ROWS: Array<{ key: StatKey; label: string }> = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: 'Attack' },
  { key: 'defense', label: 'Defense' },
  { key: 'sp_attack', label: 'Sp. Atk' },
  { key: 'sp_defense', label: 'Sp. Def' },
  { key: 'speed', label: 'Speed' },
]

export const STAT_LIST_LABELS: Record<StatKey, string> = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  sp_attack: 'SpA',
  sp_defense: 'SpD',
  speed: 'Spe',
}

export const SPRITE_PATHS = [
  'scarlet-violet/normal',
  'brilliant-diamond-shining-pearl/normal',
  'bank/normal',
  'home/normal',
] as const

export const TYPE_CACHE_TTL_MS = 1000 * 60 * 60 * 12

export const TYPE_ORDER: readonly PokemonTypeName[] = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
]

export const TYPE_CHART: Record<
  PokemonTypeName,
  Partial<Record<PokemonTypeName, number>>
> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 2,
    bug: 2,
    rock: 0.5,
    dragon: 0.5,
    steel: 2,
  },
  water: {
    fire: 2,
    water: 0.5,
    grass: 0.5,
    ground: 2,
    rock: 2,
    dragon: 0.5,
  },
  electric: {
    water: 2,
    electric: 0.5,
    grass: 0.5,
    ground: 0,
    flying: 2,
    dragon: 0.5,
  },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 0.5,
    ground: 2,
    flying: 2,
    dragon: 2,
    steel: 0.5,
  },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: {
    grass: 2,
    poison: 0.5,
    ground: 0.5,
    rock: 0.5,
    ghost: 0.5,
    steel: 0,
    fairy: 2,
  },
  ground: {
    fire: 2,
    electric: 2,
    grass: 0.5,
    poison: 2,
    flying: 0,
    bug: 0.5,
    rock: 2,
    steel: 2,
  },
  flying: {
    electric: 0.5,
    grass: 2,
    fighting: 2,
    bug: 2,
    rock: 0.5,
    steel: 0.5,
  },
  psychic: {
    fighting: 2,
    poison: 2,
    psychic: 0.5,
    dark: 0,
    steel: 0.5,
  },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: {
    fire: 2,
    ice: 2,
    fighting: 0.5,
    ground: 0.5,
    flying: 2,
    bug: 2,
    steel: 0.5,
  },
  ghost: {
    normal: 0,
    psychic: 2,
    ghost: 2,
    dark: 0.5,
  },
  dragon: {
    dragon: 2,
    steel: 0.5,
    fairy: 0,
  },
  dark: {
    fighting: 0.5,
    psychic: 2,
    ghost: 2,
    dark: 0.5,
    fairy: 0.5,
  },
  steel: {
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    ice: 2,
    rock: 2,
    steel: 0.5,
    fairy: 2,
  },
  fairy: {
    fire: 0.5,
    fighting: 2,
    poison: 0.5,
    dragon: 2,
    dark: 2,
    steel: 0.5,
  },
}

export const TYPE_DEFENSE_ROWS: readonly PokemonTypeName[][] = [
  TYPE_ORDER.slice(0, 9),
  TYPE_ORDER.slice(9, 18),
]

export const DEFAULT_TYPE_COLOR: TypeColor = {
  bg: 'rgba(125, 137, 148, 0.18)',
  border: 'rgba(125, 137, 148, 0.35)',
  text: 'rgb(66, 76, 85)',
}

export const TYPE_COLORS: Record<string, TypeColor> = {
  normal: {
    bg: 'rgba(168, 167, 122, 0.2)',
    border: 'rgba(168, 167, 122, 0.4)',
    text: 'rgb(90, 88, 60)',
  },
  fire: {
    bg: 'rgba(238, 129, 48, 0.22)',
    border: 'rgba(238, 129, 48, 0.45)',
    text: 'rgb(130, 66, 18)',
  },
  water: {
    bg: 'rgba(99, 144, 240, 0.22)',
    border: 'rgba(99, 144, 240, 0.45)',
    text: 'rgb(34, 68, 139)',
  },
  electric: {
    bg: 'rgba(247, 208, 44, 0.23)',
    border: 'rgba(247, 208, 44, 0.48)',
    text: 'rgb(128, 96, 12)',
  },
  grass: {
    bg: 'rgba(122, 199, 76, 0.22)',
    border: 'rgba(122, 199, 76, 0.45)',
    text: 'rgb(52, 110, 30)',
  },
  ice: {
    bg: 'rgba(150, 217, 214, 0.24)',
    border: 'rgba(150, 217, 214, 0.48)',
    text: 'rgb(46, 96, 95)',
  },
  fighting: {
    bg: 'rgba(194, 46, 40, 0.22)',
    border: 'rgba(194, 46, 40, 0.45)',
    text: 'rgb(115, 28, 24)',
  },
  poison: {
    bg: 'rgba(163, 62, 161, 0.22)',
    border: 'rgba(163, 62, 161, 0.45)',
    text: 'rgb(96, 33, 95)',
  },
  ground: {
    bg: 'rgba(226, 191, 101, 0.25)',
    border: 'rgba(226, 191, 101, 0.5)',
    text: 'rgb(115, 86, 27)',
  },
  flying: {
    bg: 'rgba(169, 143, 243, 0.23)',
    border: 'rgba(169, 143, 243, 0.47)',
    text: 'rgb(78, 63, 132)',
  },
  psychic: {
    bg: 'rgba(249, 85, 135, 0.22)',
    border: 'rgba(249, 85, 135, 0.46)',
    text: 'rgb(141, 35, 70)',
  },
  bug: {
    bg: 'rgba(166, 185, 26, 0.23)',
    border: 'rgba(166, 185, 26, 0.47)',
    text: 'rgb(90, 102, 17)',
  },
  rock: {
    bg: 'rgba(182, 161, 54, 0.23)',
    border: 'rgba(182, 161, 54, 0.47)',
    text: 'rgb(96, 83, 29)',
  },
  ghost: {
    bg: 'rgba(115, 87, 151, 0.23)',
    border: 'rgba(115, 87, 151, 0.47)',
    text: 'rgb(65, 45, 92)',
  },
  dragon: {
    bg: 'rgba(111, 53, 252, 0.22)',
    border: 'rgba(111, 53, 252, 0.45)',
    text: 'rgb(61, 25, 139)',
  },
  dark: {
    bg: 'rgba(112, 87, 70, 0.24)',
    border: 'rgba(112, 87, 70, 0.48)',
    text: 'rgb(64, 47, 37)',
  },
  steel: {
    bg: 'rgba(183, 183, 206, 0.26)',
    border: 'rgba(183, 183, 206, 0.52)',
    text: 'rgb(85, 85, 108)',
  },
  fairy: {
    bg: 'rgba(214, 133, 173, 0.24)',
    border: 'rgba(214, 133, 173, 0.5)',
    text: 'rgb(114, 57, 87)',
  },
}
