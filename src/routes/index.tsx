import { Link, createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useEffect, useMemo, useState } from 'react'

export const Route = createFileRoute('/')({ component: HomeLookupPage })

function HomeLookupPage() {
  return <PokedexPage showListPage={false} />
}

type StatKey =
  | 'hp'
  | 'attack'
  | 'defense'
  | 'sp_attack'
  | 'sp_defense'
  | 'speed'

type BaseStats = Record<StatKey, number>

type LearnSetMove = {
  level: number
  move: string
}

type EvolutionStep = {
  method: string
  parameter?: string | number | boolean
  target: string
  extra?: string | number | boolean
}

type EvolutionLink = {
  sourceKey: string
  targetKey: string
  method: string
  parameter?: string | number | boolean
  extra?: string | number | boolean
}

type PokemonRaw = {
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

type PokemonDataFile = Record<string, PokemonRaw>

type PokemonRecord = {
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

type PokemonTypeMap = Record<string, string[]>

type TypeColor = {
  bg: string
  border: string
  text: string
}

const STAT_CAP = 255

const EMPTY_STATS: BaseStats = {
  hp: 0,
  attack: 0,
  defense: 0,
  sp_attack: 0,
  sp_defense: 0,
  speed: 0,
}

const STAT_ROWS: Array<{ key: StatKey; label: string }> = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: 'Attack' },
  { key: 'defense', label: 'Defense' },
  { key: 'sp_attack', label: 'Sp. Atk' },
  { key: 'sp_defense', label: 'Sp. Def' },
  { key: 'speed', label: 'Speed' },
]

const STAT_LIST_LABELS: Record<StatKey, string> = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  sp_attack: 'SpA',
  sp_defense: 'SpD',
  speed: 'Spe',
}

const SPRITE_PATHS = [
  'scarlet-violet/normal',
  'brilliant-diamond-shining-pearl/normal',
  'bank/normal',
  'home/normal',
] as const

const TYPE_CACHE_TTL_MS = 1000 * 60 * 60 * 12

const TYPE_ORDER = [
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
] as const

type PokemonTypeName = (typeof TYPE_ORDER)[number]

type DefenseMultiplierMap = Record<PokemonTypeName, number>

const TYPE_CHART: Record<
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

const TYPE_DEFENSE_ROWS: readonly PokemonTypeName[][] = [
  TYPE_ORDER.slice(0, 9),
  TYPE_ORDER.slice(9, 18),
]

const DEFAULT_TYPE_COLOR: TypeColor = {
  bg: 'rgba(125, 137, 148, 0.18)',
  border: 'rgba(125, 137, 148, 0.35)',
  text: 'rgb(66, 76, 85)',
}

const TYPE_COLORS: Record<string, TypeColor> = {
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

let cachedPokemonTypes: PokemonTypeMap | null = null
let cachedPokemonTypesAt = 0

function numberOrZero(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value))
  }

  return 0
}

function toDisplayLabel(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
}

function keyToSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .replaceAll('_', '-')
}

function getBaseSpeciesKey(key: string, keySet: Set<string>): string {
  const parts = key.split('_')

  for (let index = parts.length - 1; index >= 1; index -= 1) {
    const candidate = parts.slice(0, index).join('_')
    if (keySet.has(candidate)) {
      return candidate
    }
  }

  return key
}

function parsePokemonTypesFromHtml(html: string): PokemonTypeMap {
  const typeMap: PokemonTypeMap = {}
  const rowPattern = /<tr>([\s\S]*?)<\/tr>/g
  let rowMatch: RegExpExecArray | null

  while ((rowMatch = rowPattern.exec(html)) !== null) {
    const rowHtml = rowMatch[1]
    const slugMatch = rowHtml.match(
      /<a[^>]+class="ent-name"[^>]+href="\/pokedex\/([^"#?]+)"/i,
    )

    if (!slugMatch?.[1]) {
      continue
    }

    const slug = slugMatch[1].trim().toLowerCase()
    const types = Array.from(
      rowHtml.matchAll(/<a[^>]+class="type-icon[^"]*"[^>]*>([^<]+)<\/a>/gi),
    )
      .map((match) => match[1].trim().toLowerCase())
      .filter(
        (type, index, array) => type.length > 0 && array.indexOf(type) === index,
      )

    if (types.length > 0) {
      typeMap[slug] = types
    }
  }

  return typeMap
}

function getTypesForPokemon(
  pokemon: Pick<PokemonRecord, 'spriteSlug' | 'baseSlug'>,
  typeMap: PokemonTypeMap,
): string[] {
  const formTypes = typeMap[pokemon.spriteSlug]
  if (Array.isArray(formTypes) && formTypes.length > 0) {
    return formTypes
  }

  const baseTypes = typeMap[pokemon.baseSlug]
  if (Array.isArray(baseTypes) && baseTypes.length > 0) {
    return baseTypes
  }

  return []
}

function getTypeColor(type: string): TypeColor {
  return TYPE_COLORS[type] ?? DEFAULT_TYPE_COLOR
}

function isKnownType(type: string): type is PokemonTypeName {
  return (TYPE_ORDER as readonly string[]).includes(type)
}

function formatMultiplier(multiplier: number): string {
  if (multiplier === 0) {
    return '0x'
  }

  if (multiplier >= 1) {
    return `${multiplier}x`
  }

  const denominator = Math.round(1 / multiplier)
  return `1/${denominator}x`
}

function getDefensiveMatchupLabel(multiplier: number): string {
  if (multiplier === 0) {
    return 'Immune'
  }

  if (multiplier > 1) {
    return `${formatMultiplier(multiplier)} Weak`
  }

  if (multiplier < 1) {
    return `${formatMultiplier(multiplier)} Resist`
  }

  return 'Neutral'
}

function computeDefensiveMultiplierMap(types: string[]): DefenseMultiplierMap | null {
  const defendingTypes = [...new Set(types.map((type) => type.toLowerCase()))].filter(
    isKnownType,
  )

  if (defendingTypes.length === 0) {
    return null
  }

  const multipliers = {} as DefenseMultiplierMap

  for (const attackType of TYPE_ORDER) {
    multipliers[attackType] = Number(
      defendingTypes
        .reduce(
          (total, defendType) => total * (TYPE_CHART[attackType][defendType] ?? 1),
          1,
        )
        .toFixed(2),
    )
  }

  return multipliers
}

function getDefenseMultiplierTone(multiplier: number): {
  bg: string
  border: string
  text: string
} {
  if (multiplier === 0) {
    return {
      bg: 'rgba(90, 101, 117, 0.3)',
      border: 'rgba(90, 101, 117, 0.55)',
      text: '#f4f7fa',
    }
  }

  if (multiplier >= 4) {
    return {
      bg: 'rgba(160, 32, 32, 0.92)',
      border: 'rgba(255, 165, 165, 0.45)',
      text: '#fff7f7',
    }
  }

  if (multiplier > 1) {
    return {
      bg: 'rgba(166, 63, 22, 0.92)',
      border: 'rgba(255, 188, 145, 0.45)',
      text: '#fff7f2',
    }
  }

  if (multiplier <= 0.25) {
    return {
      bg: 'rgba(31, 112, 68, 0.95)',
      border: 'rgba(165, 231, 194, 0.45)',
      text: '#f2fff8',
    }
  }

  if (multiplier < 1) {
    return {
      bg: 'rgba(54, 137, 72, 0.9)',
      border: 'rgba(177, 236, 190, 0.45)',
      text: '#f4fff8',
    }
  }

  return {
    bg: 'transparent',
    border: 'transparent',
    text: 'transparent',
  }
}

function formatEvolutionValue(value: string | number | boolean | undefined): string {
  if (typeof value === 'number') {
    return `${value}`
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value !== 'string') {
    return 'Unknown'
  }

  if (value === 'NONE') {
    return 'None'
  }

  const timeRangeMatch = value.match(/^TIME_RANGE\((\d+),\s*(\d+)\)$/)
  if (timeRangeMatch) {
    const start = Number(timeRangeMatch[1]).toString().padStart(2, '0')
    const end = Number(timeRangeMatch[2]).toString().padStart(2, '0')
    return `${start}:00-${end}:00`
  }

  if (value.startsWith('TYPE_')) {
    return `${toDisplayLabel(value.slice(5))} type`
  }

  if (value.startsWith('MAPSEC_')) {
    return toDisplayLabel(value.slice(7))
  }

  return toDisplayLabel(value)
}

function formatEvolutionLevel(value: string | number | boolean | undefined): string {
  if (typeof value === 'number') {
    return `Level ${value}`
  }

  return 'Level up'
}

function describeEvolutionRequirement(
  method: string,
  parameter: string | number | boolean | undefined,
  extra: string | number | boolean | undefined,
): string {
  const normalizedMethod = method.toUpperCase()
  const parameterText = formatEvolutionValue(parameter)
  const extraText = formatEvolutionValue(extra)

  switch (normalizedMethod) {
    case 'LEVEL':
      return formatEvolutionLevel(parameter)
    case 'LEVEL_DAY':
      return `${formatEvolutionLevel(parameter)} during day`
    case 'LEVEL_NIGHT':
      return `${formatEvolutionLevel(parameter)} at night`
    case 'LEVEL_SPECIFIC_TIME_RANGE':
      return `${formatEvolutionLevel(parameter)} during ${extraText}`
    case 'FEMALE_LEVEL':
      return `${formatEvolutionLevel(parameter)} (female)`
    case 'MALE_LEVEL':
      return `${formatEvolutionLevel(parameter)} (male)`
    case 'LEVEL_ATK_GT_DEF':
      return `${formatEvolutionLevel(parameter)} with Attack > Defense`
    case 'LEVEL_ATK_EQ_DEF':
      return `${formatEvolutionLevel(parameter)} with Attack = Defense`
    case 'LEVEL_ATK_LT_DEF':
      return `${formatEvolutionLevel(parameter)} with Attack < Defense`
    case 'LEVEL_HOLD_ITEM':
      return `${formatEvolutionLevel(parameter)} while holding ${extraText}`
    case 'LEVEL_SILCOON':
    case 'LEVEL_CASCOON':
    case 'LEVEL_NINJASK':
    case 'LEVEL_SHEDINJA':
      return `${formatEvolutionLevel(parameter)} (${toDisplayLabel(normalizedMethod.slice(6))})`
    case 'FRIENDSHIP':
      return 'High friendship'
    case 'FRIENDSHIP_DAY':
      return 'High friendship during day'
    case 'FRIENDSHIP_NIGHT':
      return 'High friendship at night'
    case 'TRADE':
      return 'Trade'
    case 'TRADE_ITEM':
      return `Trade while holding ${parameterText}`
    case 'ITEM':
      return `Use ${parameterText}`
    case 'ITEM_NIGHT':
      return `Use ${parameterText} at night`
    case 'ITEM_LOCATION':
      return `Use ${parameterText} at ${extraText}`
    case 'ITEM_HOLD_ITEM':
      return `Use ${parameterText} while holding ${extraText}`
    case 'MOVE':
      return `Level up knowing ${parameterText}`
    case 'MOVE_MALE':
      return `Male level-up knowing ${parameterText}`
    case 'MOVE_FEMALE':
      return `Female level-up knowing ${parameterText}`
    case 'MOVE_TYPE':
      return `Level up knowing a ${parameterText}`
    case 'HOLD_ITEM_DAY':
      return `Level up while holding ${parameterText} during day`
    case 'HOLD_ITEM_NIGHT':
      return `Level up while holding ${parameterText} at night`
    case 'MAP':
      return `Level up at ${parameterText}`
    case 'TYPE_IN_PARTY':
      return `${formatEvolutionLevel(parameter)} with ${extraText} in party`
    case 'OTHER_PARTY_MON':
      return `With ${parameterText} in party`
    case 'RAINY_FOGGY_OW':
      return `${formatEvolutionLevel(parameter)} during rain or fog`
    case 'NATURE_HIGH':
      return `${formatEvolutionLevel(parameter)} with high-key nature`
    case 'NATURE_LOW':
      return `${formatEvolutionLevel(parameter)} with low-key nature`
    case 'CRITICAL_HIT':
      return 'Land 3 critical hits in one battle'
    case 'MEGA':
      if (parameter === 'NONE' || parameter === false) {
        return 'Return from Mega form'
      }
      return `Mega evolve with ${parameterText}`
    case 'GIGANTAMAX':
      if (parameter === true) {
        return 'Gigantamax form active'
      }
      if (parameter === false) {
        return 'Return from Gigantamax form'
      }
      return 'Gigantamax condition'
    default: {
      const details = [
        toDisplayLabel(normalizedMethod),
        parameter !== undefined ? `Param: ${parameterText}` : null,
        extra !== undefined ? `Extra: ${extraText}` : null,
      ].filter((item): item is string => item !== null)

      return details.join(' • ')
    }
  }
}

function getStatBarHue(value: number): number {
  const strengthRatio = Math.max(0, Math.min(1, value / STAT_CAP))
  if (strengthRatio <= 0.5) {
    return (strengthRatio / 0.5) * 120
  }

  return 120 + ((strengthRatio - 0.5) / 0.5) * 100
}

function getStatBarGradient(value: number): string {
  const hue = getStatBarHue(value)
  return `linear-gradient(90deg, hsl(${hue} 82% 34%), hsl(${hue} 90% 56%))`
}

const getPokemonTypesFromPokemonDb = createServerFn({ method: 'GET' }).handler(
  async () => {
    const now = Date.now()
    if (
      cachedPokemonTypes &&
      now - cachedPokemonTypesAt < TYPE_CACHE_TTL_MS
    ) {
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

function normalizePokemonData(data: PokemonDataFile): PokemonRecord[] {
  const keySet = new Set(Object.keys(data))

  return Object.entries(data)
    .map(([key, raw]) => {
      const baseKey = getBaseSpeciesKey(key, keySet)

      const baseStats: BaseStats = {
        hp: numberOrZero(raw.base_stats?.hp),
        attack: numberOrZero(raw.base_stats?.attack),
        defense: numberOrZero(raw.base_stats?.defense),
        sp_attack: numberOrZero(raw.base_stats?.sp_attack),
        sp_defense: numberOrZero(raw.base_stats?.sp_defense),
        speed: numberOrZero(raw.base_stats?.speed),
      }

      const total = Object.values(baseStats).reduce((sum, stat) => sum + stat, 0)

      const learnSet = Array.isArray(raw.learn_set)
        ? raw.learn_set
            .map((move) => ({
              level: numberOrZero(move.level),
              move: typeof move.move === 'string' ? move.move : '',
            }))
            .filter((move) => move.move.length > 0)
            .sort((a, b) => a.level - b.level || a.move.localeCompare(b.move))
        : []

      const eggMoves = Array.isArray(raw.egg_moves)
        ? raw.egg_moves
            .filter((move): move is string => typeof move === 'string')
            .sort((a, b) => a.localeCompare(b))
        : []

      const evolutionTable = Array.isArray(raw.evolution_table)
        ? raw.evolution_table
            .map((step) => ({
              method: typeof step.method === 'string' ? step.method : 'UNKNOWN',
              parameter:
                typeof step.parameter === 'string' ||
                typeof step.parameter === 'number' ||
                typeof step.parameter === 'boolean'
                  ? step.parameter
                  : undefined,
              target: typeof step.target === 'string' ? step.target : '',
              extra:
                typeof step.extra === 'string' ||
                typeof step.extra === 'number' ||
                typeof step.extra === 'boolean'
                  ? step.extra
                  : undefined,
            }))
            .filter((step) => step.target.length > 0)
        : []

      return {
        key,
        displayName: toDisplayLabel(key),
        baseStats,
        total,
        learnSet,
        eggMoves,
        evolutionTable,
        spriteSlug: keyToSlug(key),
        baseSlug: keyToSlug(baseKey),
      }
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
}

function buildSpriteSources(spriteSlug: string, baseSlug: string): string[] {
  const slugs = [...new Set([spriteSlug, baseSlug])]
  const sources: string[] = []

  for (const path of SPRITE_PATHS) {
    for (const slug of slugs) {
      sources.push(`https://img.pokemondb.net/sprites/${path}/${slug}.png`)
    }
  }

  return sources
}

function PokemonSprite({
  pokemon,
  size,
  className,
}: {
  pokemon: Pick<PokemonRecord, 'key' | 'displayName' | 'spriteSlug' | 'baseSlug'>
  size: number
  className: string
}) {
  const sources = useMemo(
    () => buildSpriteSources(pokemon.spriteSlug, pokemon.baseSlug),
    [pokemon.baseSlug, pokemon.spriteSlug],
  )
  const [sourceIndex, setSourceIndex] = useState(0)

  useEffect(() => {
    setSourceIndex(0)
  }, [pokemon.key])

  const activeSource = sources[sourceIndex]

  if (!activeSource) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.5)] text-xs font-bold text-[var(--sea-ink-soft)] ${className}`}
        style={{ width: size, height: size }}
      >
        ?
      </div>
    )
  }

  return (
    <img
      src={activeSource}
      alt={pokemon.displayName}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => {
        setSourceIndex((previous) =>
          previous < sources.length ? previous + 1 : previous,
        )
      }}
      className={className}
    />
  )
}

export function PokedexPage({ showListPage }: { showListPage: boolean }) {
  const [pokemonData, setPokemonData] = useState<PokemonDataFile | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pokemonTypes, setPokemonTypes] = useState<PokemonTypeMap>({})
  const [typeLoadError, setTypeLoadError] = useState<string | null>(null)
  const [hasLoadedTypes, setHasLoadedTypes] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedKey, setSelectedKey] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadPokemonData() {
      try {
        const response = await fetch('/pokemon_data.json')
        if (!response.ok) {
          throw new Error(
            `Could not load pokemon_data.json (status ${response.status}).`,
          )
        }

        const json = (await response.json()) as PokemonDataFile
        if (!isMounted) {
          return
        }

        setPokemonData(json)
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Unknown error loading pokemon_data.json.'
        setLoadError(message)
      }
    }

    void loadPokemonData()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadPokemonTypes() {
      try {
        const typeMap = await getPokemonTypesFromPokemonDb()
        if (!isMounted) {
          return
        }

        setPokemonTypes(typeMap)
        setTypeLoadError(null)
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Unknown error loading Pokemon type data.'
        setTypeLoadError(message)
      } finally {
        if (isMounted) {
          setHasLoadedTypes(true)
        }
      }
    }

    void loadPokemonTypes()

    return () => {
      isMounted = false
    }
  }, [])

  const pokemonRecords = useMemo(
    () => (pokemonData ? normalizePokemonData(pokemonData) : []),
    [pokemonData],
  )

  const filteredPokemon = useMemo(() => {
    const cleaned = query.trim().toLowerCase()
    if (!cleaned) {
      return pokemonRecords
    }

    return pokemonRecords.filter((pokemon) => {
      const display = pokemon.displayName.toLowerCase()
      const key = pokemon.key.toLowerCase()
      return display.includes(cleaned) || key.includes(cleaned)
    })
  }, [pokemonRecords, query])

  const quickSearchMatches = useMemo(() => {
    if (showListPage) {
      return []
    }

    if (query.trim().length === 0) {
      return []
    }

    return filteredPokemon.slice(0, 8)
  }, [filteredPokemon, query, showListPage])

  useEffect(() => {
    if (filteredPokemon.length === 0) {
      return
    }

    const isCurrentSelectionVisible = filteredPokemon.some(
      (pokemon) => pokemon.key === selectedKey,
    )

    if (!isCurrentSelectionVisible) {
      setSelectedKey(filteredPokemon[0].key)
    }
  }, [filteredPokemon, selectedKey])

  const selectedPokemon = useMemo(() => {
    if (filteredPokemon.length === 0) {
      return null
    }

    return (
      filteredPokemon.find((pokemon) => pokemon.key === selectedKey) ??
      filteredPokemon[0]
    )
  }, [filteredPokemon, selectedKey])

  const selectedPokemonTypes = useMemo(() => {
    if (!selectedPokemon) {
      return []
    }

    return getTypesForPokemon(selectedPokemon, pokemonTypes)
  }, [pokemonTypes, selectedPokemon])

  const selectedDefensiveMultipliers = useMemo(
    () => computeDefensiveMultiplierMap(selectedPokemonTypes),
    [selectedPokemonTypes],
  )

  const evolutionFromLinks = useMemo(() => {
    if (!selectedPokemon) {
      return []
    }

    return pokemonRecords.flatMap((pokemon) =>
      pokemon.evolutionTable
        .filter((entry) => entry.target === selectedPokemon.key)
        .map(
          (entry): EvolutionLink => ({
            sourceKey: pokemon.key,
            targetKey: selectedPokemon.key,
            method: entry.method,
            parameter: entry.parameter,
            extra: entry.extra,
          }),
        ),
    )
  }, [pokemonRecords, selectedPokemon])

  const evolutionToLinks = useMemo(() => {
    if (!selectedPokemon) {
      return []
    }

    return selectedPokemon.evolutionTable.map(
      (entry): EvolutionLink => ({
        sourceKey: selectedPokemon.key,
        targetKey: entry.target,
        method: entry.method,
        parameter: entry.parameter,
        extra: entry.extra,
      }),
    )
  }, [selectedPokemon])

  function jumpToPokemon(key: string) {
    setSelectedKey(key)
    if (query.trim().length > 0) {
      setQuery('')
    }
  }

  function selectPokemonFromSearch(key: string) {
    setSelectedKey(key)
    if (!showListPage) {
      setQuery('')
    }
  }

  if (showListPage) {
    return (
      <main className="page-wrap px-4 pb-14 pt-10">
        <section className="island-shell rise-in rounded-2xl px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="pokemon-search-input"
                className="mb-2 block text-xs font-bold tracking-[0.14em] text-[var(--kicker)] uppercase"
              >
                Search Pokemon
              </label>
              <input
                id="pokemon-search-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by Pokemon name..."
                className="w-full rounded-xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--surface-strong)_82%,white_18%)] px-3 py-2.5 text-sm text-[var(--sea-ink)] outline-none transition focus:border-[var(--lagoon-deep)] focus:ring-3 focus:ring-[rgba(79,184,178,0.22)]"
              />
            </div>
            <div className="flex items-center gap-2 self-end lg:self-end">
              <Link
                to="/"
                className="rounded-xl border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-2 text-xs font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5"
              >
                Back to Search
              </Link>
            </div>
          </div>
        </section>

        {loadError ? (
          <section className="island-shell mt-7 rounded-2xl border-red-400/45 p-6">
            <p className="m-0 text-sm font-semibold text-red-600 dark:text-red-300">
              Failed to load data: {loadError}
            </p>
          </section>
        ) : null}

        {!pokemonData && !loadError ? (
          <section className="island-shell mt-7 rounded-2xl p-6">
            <p className="m-0 text-sm font-semibold text-[var(--sea-ink-soft)]">
              Loading Pokemon data...
            </p>
          </section>
        ) : null}

        {pokemonData ? (
          <section className="island-shell mt-7 rounded-2xl p-4 sm:p-5">
            <p className="text-xs font-semibold tracking-[0.12em] text-[var(--sea-ink-soft)] uppercase">
              {filteredPokemon.length} shown / {pokemonRecords.length} total
            </p>

            <div className="mt-3 overflow-auto rounded-xl border border-[var(--line)]">
              <table className="w-full min-w-[960px] border-collapse text-sm">
                <thead className="sticky top-0 bg-[color-mix(in_oklab,var(--surface-strong)_86%,white_14%)]">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
                      Pokemon
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
                      Types
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
                      BST
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
                      Base Stats
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
                      Learnset
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
                      Evolutions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPokemon.length > 0 ? (
                    filteredPokemon.map((pokemon) => {
                      const rowTypes = getTypesForPokemon(pokemon, pokemonTypes)

                      return (
                        <tr key={`list-row-${pokemon.key}`}>
                          <td className="border-t border-[var(--line)] px-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <PokemonSprite
                                pokemon={pokemon}
                                size={44}
                                className="h-11 w-11 flex-shrink-0 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.5)] object-contain p-1"
                              />
                              <div className="min-w-0">
                                <p className="m-0 truncate text-sm font-semibold text-[var(--sea-ink)]">
                                  {pokemon.displayName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="border-t border-[var(--line)] px-3 py-2.5">
                            <div className="flex flex-wrap gap-1.5">
                              {rowTypes.length > 0 ? (
                                rowTypes.map((type) => {
                                  const color = getTypeColor(type)
                                  return (
                                    <span
                                      key={`${pokemon.key}-${type}`}
                                      className="rounded-full border px-2 py-1 text-[10px] font-bold tracking-[0.08em] text-[var(--sea-ink)] uppercase"
                                      style={{
                                        backgroundColor: color.bg,
                                        borderColor: color.border,
                                      }}
                                    >
                                      {type}
                                    </span>
                                  )
                                })
                              ) : (
                                <span className="text-xs text-[var(--sea-ink-soft)]">
                                  Unknown
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="border-t border-[var(--line)] px-3 py-2.5 font-bold tabular-nums text-[var(--sea-ink)]">
                            {pokemon.total}
                          </td>
                          <td className="border-t border-[var(--line)] px-3 py-2.5">
                            <div className="grid min-w-[360px] grid-cols-3 gap-1.5">
                              {STAT_ROWS.map((row) => {
                                const value = pokemon.baseStats[row.key] ?? EMPTY_STATS[row.key]
                                const width = Math.min(100, (value / STAT_CAP) * 100)

                                return (
                                  <div
                                    key={`list-stat-${pokemon.key}-${row.key}`}
                                    className="rounded-lg border border-[var(--line)] bg-transparent px-2 py-1"
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[10px] font-bold tracking-[0.08em] text-[var(--sea-ink-soft)] uppercase">
                                        {STAT_LIST_LABELS[row.key]}
                                      </span>
                                      <span className="text-[10px] font-semibold tabular-nums text-[var(--sea-ink)]">
                                        {value}
                                      </span>
                                    </div>
                                    <div className="mt-1 h-1.5 rounded-full bg-[rgba(17,44,49,0.12)]">
                                      <div
                                        className="h-full rounded-full"
                                        style={{
                                          width: `${width}%`,
                                          backgroundImage: getStatBarGradient(value),
                                        }}
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </td>
                          <td className="border-t border-[var(--line)] px-3 py-2.5 text-xs font-semibold tabular-nums text-[var(--sea-ink-soft)]">
                            {pokemon.learnSet.length}
                          </td>
                          <td className="border-t border-[var(--line)] px-3 py-2.5 text-xs font-semibold tabular-nums text-[var(--sea-ink-soft)]">
                            {pokemon.evolutionTable.length}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="border-t border-[var(--line)] px-3 py-5 text-sm text-[var(--sea-ink-soft)]"
                      >
                        No Pokemon match this search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 pb-14 pt-10">
      <section className="island-shell rise-in rounded-2xl px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="pokemon-search-input"
              className="mb-2 block text-xs font-bold tracking-[0.14em] text-[var(--kicker)] uppercase"
            >
              Search Pokemon
            </label>
            <input
              id="pokemon-search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by Pokemon name..."
              className="w-full rounded-xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--surface-strong)_82%,white_18%)] px-3 py-2.5 text-sm text-[var(--sea-ink)] outline-none transition focus:border-[var(--lagoon-deep)] focus:ring-3 focus:ring-[rgba(79,184,178,0.22)]"
            />
          </div>
          <div className="flex items-center gap-2 self-end lg:self-end">
            {showListPage ? (
              <Link
                to="/"
                className="rounded-xl border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-2 text-xs font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5"
              >
                Back to Search
              </Link>
            ) : (
              <Link
                to="/pokemon"
                className="rounded-xl border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-2 text-xs font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5"
              >
                Open Full List
              </Link>
            )}
          </div>
        </div>

        {!showListPage && quickSearchMatches.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {quickSearchMatches.map((pokemon) => (
              <button
                key={`quick-${pokemon.key}`}
                type="button"
                onClick={() => selectPokemonFromSearch(pokemon.key)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--sea-ink)] transition hover:-translate-y-0.5"
              >
                <PokemonSprite
                  pokemon={pokemon}
                  size={22}
                  className="h-[22px] w-[22px] rounded-full object-contain"
                />
                {pokemon.displayName}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {loadError ? (
        <section className="island-shell mt-7 rounded-2xl border-red-400/45 p-6">
          <p className="m-0 text-sm font-semibold text-red-600 dark:text-red-300">
            Failed to load data: {loadError}
          </p>
        </section>
      ) : null}

      {!pokemonData && !loadError ? (
        <section className="island-shell mt-7 rounded-2xl p-6">
          <p className="m-0 text-sm font-semibold text-[var(--sea-ink-soft)]">
            Loading Pokemon data...
          </p>
        </section>
      ) : null}

      {pokemonData ? (
        <section
          className={
            showListPage
              ? 'mt-7 grid gap-5 lg:grid-cols-[minmax(260px,0.95fr)_minmax(0,1.7fr)]'
              : 'mt-7 space-y-5'
          }
        >
          {showListPage ? (
            <aside className="island-shell rise-in rounded-2xl p-4 sm:p-5">
              <p className="text-xs font-semibold tracking-[0.12em] text-[var(--sea-ink-soft)] uppercase">
                {filteredPokemon.length} shown / {pokemonRecords.length} total
              </p>

              <div className="mt-3 max-h-[60vh] space-y-1.5 overflow-auto pr-1">
              {filteredPokemon.length > 0 ? (
                filteredPokemon.map((pokemon) => {
                  const isActive = selectedPokemon?.key === pokemon.key

                  return (
                    <button
                      key={pokemon.key}
                      type="button"
                      onClick={() => setSelectedKey(pokemon.key)}
                      className={
                        isActive
                          ? 'w-full rounded-xl border border-[rgba(50,143,151,0.45)] bg-[rgba(79,184,178,0.18)] px-3 py-2 text-left shadow-[0_8px_18px_rgba(50,143,151,0.14)] transition'
                          : 'w-full rounded-xl border border-transparent px-3 py-2 text-left transition hover:border-[var(--line)] hover:bg-[rgba(255,255,255,0.5)]'
                      }
                    >
                      <div className="flex items-center gap-3">
                        <PokemonSprite
                          pokemon={pokemon}
                          size={44}
                          className="h-11 w-11 flex-shrink-0 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.55)] object-contain p-1"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="m-0 truncate text-sm font-semibold text-[var(--sea-ink)]">
                            {pokemon.displayName}
                          </p>
                          <div className="mt-1">
                            <span className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-2 py-0.5 text-[11px] font-bold text-[var(--lagoon-deep)]">
                              BST {pokemon.total}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })
              ) : (
                <p className="m-0 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.45)] px-3 py-4 text-sm text-[var(--sea-ink-soft)]">
                  No Pokemon match this search.
                </p>
              )}
              </div>
            </aside>
          ) : null}

          <section className="space-y-5">
            {selectedPokemon ? (
              <article className="island-shell rise-in rounded-2xl p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <a
                      href={`https://pokemondb.net/pokedex/${selectedPokemon.baseSlug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.5)] p-2 transition hover:-translate-y-0.5 hover:border-[rgba(50,143,151,0.45)]"
                      title={`Open ${selectedPokemon.displayName} on PokemonDB`}
                    >
                      <PokemonSprite
                        pokemon={selectedPokemon}
                        size={104}
                        className="h-[104px] w-[104px] rounded-xl object-contain"
                      />
                    </a>
                    <div>
                      <p className="island-kicker mb-2">Selected Pokemon</p>
                      <h2 className="display-title m-0 text-3xl font-bold tracking-tight sm:text-4xl">
                        {selectedPokemon.displayName}
                      </h2>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {selectedPokemonTypes.map((type) => {
                          const color = getTypeColor(type)

                          return (
                            <span
                              key={type}
                              className="rounded-full border px-2.5 py-1 text-[11px] font-extrabold tracking-[0.08em] text-[var(--sea-ink)] uppercase"
                              style={{
                                backgroundColor: color.bg,
                                borderColor: color.border,
                              }}
                            >
                              {type}
                            </span>
                          )
                        })}
                        {hasLoadedTypes &&
                        !typeLoadError &&
                        selectedPokemonTypes.length === 0 ? (
                          <span className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.5)] px-2.5 py-1 text-[11px] font-semibold text-[var(--sea-ink-soft)]">
                            Type unknown
                          </span>
                        ) : null}
                      </div>
                      {!hasLoadedTypes ? (
                        <p className="mt-1 mb-0 text-xs text-[var(--sea-ink-soft)]">
                          Loading type data from PokemonDB...
                        </p>
                      ) : null}
                      {typeLoadError ? (
                        <p className="mt-1 mb-0 text-xs text-amber-700 dark:text-amber-300">
                          Type data unavailable: {typeLoadError}
                        </p>
                      ) : null}
                      <a
                        href={`https://pokemondb.net/pokedex/${selectedPokemon.baseSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs font-semibold"
                      >
                        View on PokemonDB
                      </a>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[rgba(50,143,151,0.26)] bg-[rgba(79,184,178,0.12)] px-4 py-3 text-right">
                    <p className="m-0 text-xs font-bold tracking-[0.14em] text-[var(--kicker)] uppercase">
                      Total
                    </p>
                    <p className="m-0 text-3xl font-extrabold text-[var(--lagoon-deep)]">
                      {selectedPokemon.total}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {STAT_ROWS.map((row) => {
                    const value = selectedPokemon.baseStats[row.key] ?? EMPTY_STATS[row.key]
                    const width = Math.min(100, (value / STAT_CAP) * 100)

                    return (
                      <div
                        key={row.key}
                        className="grid grid-cols-[80px_minmax(0,1fr)_48px] items-center gap-3"
                      >
                        <span className="text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
                          {row.label}
                        </span>
                        <div className="h-3 rounded-full bg-[rgba(17,44,49,0.13)] p-[2px]">
                          <div
                            className="h-full rounded-full shadow-[0_3px_12px_rgba(0,0,0,0.16)] transition-all duration-500"
                            style={{
                              width: `${width}%`,
                              backgroundImage: getStatBarGradient(value),
                            }}
                          />
                        </div>
                        <span className="text-right text-sm font-semibold tabular-nums text-[var(--sea-ink)]">
                          {value}
                        </span>
                      </div>
                    )
                  })}
                </div>

              </article>
            ) : (
              <article className="island-shell rounded-2xl p-6">
                <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
                  No Pokemon match this search.
                </p>
              </article>
            )}

            {selectedPokemon ? (
              <>
                <article className="grid gap-5 lg:grid-cols-2">
                  <section className="island-shell rounded-2xl p-5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="m-0 text-lg font-bold text-[var(--sea-ink)]">
                        Evolution Path
                      </h3>
                      <span className="rounded-full border border-[var(--line)] px-2.5 py-0.5 text-xs font-semibold text-[var(--sea-ink-soft)]">
                        {evolutionFromLinks.length + evolutionToLinks.length} links
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="mb-2 text-xs font-bold tracking-[0.12em] text-[var(--kicker)] uppercase">
                          Evolves From
                        </p>
                        {evolutionFromLinks.length > 0 ? (
                          <div className="space-y-2">
                            {evolutionFromLinks.map((link, index) => (
                              <div
                                key={`from-${link.sourceKey}-${link.targetKey}-${link.method}-${index}`}
                                className="rounded-xl border border-[var(--line)] bg-transparent px-3 py-2"
                              >
                                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                  <button
                                    type="button"
                                    onClick={() => jumpToPokemon(link.sourceKey)}
                                    className="rounded-lg border border-[var(--chip-line)] bg-[var(--chip-bg)] px-2 py-0.5 text-[var(--sea-ink)] transition hover:-translate-y-0.5"
                                  >
                                    {toDisplayLabel(link.sourceKey)}
                                  </button>
                                  <span aria-hidden="true" className="text-[var(--sea-ink-soft)]">
                                    →
                                  </span>
                                  <span className="text-[var(--sea-ink)]">
                                    {toDisplayLabel(link.targetKey)}
                                  </span>
                                </div>
                                <p className="mt-1 mb-0 text-xs text-[var(--sea-ink-soft)]">
                                  {describeEvolutionRequirement(
                                    link.method,
                                    link.parameter,
                                    link.extra,
                                  )}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="m-0 rounded-xl border border-[var(--line)] bg-transparent px-3 py-3 text-sm text-[var(--sea-ink-soft)]">
                            No previous evolution found.
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-bold tracking-[0.12em] text-[var(--kicker)] uppercase">
                          Evolves To
                        </p>
                        {evolutionToLinks.length > 0 ? (
                          <div className="space-y-2">
                            {evolutionToLinks.map((link, index) => (
                              <div
                                key={`to-${link.sourceKey}-${link.targetKey}-${link.method}-${index}`}
                                className="rounded-xl border border-[var(--line)] bg-transparent px-3 py-2"
                              >
                                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                  <span className="text-[var(--sea-ink)]">
                                    {toDisplayLabel(link.sourceKey)}
                                  </span>
                                  <span aria-hidden="true" className="text-[var(--sea-ink-soft)]">
                                    →
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => jumpToPokemon(link.targetKey)}
                                    className="rounded-lg border border-[var(--chip-line)] bg-[var(--chip-bg)] px-2 py-0.5 text-[var(--sea-ink)] transition hover:-translate-y-0.5"
                                  >
                                    {toDisplayLabel(link.targetKey)}
                                  </button>
                                </div>
                                <p className="mt-1 mb-0 text-xs text-[var(--sea-ink-soft)]">
                                  {describeEvolutionRequirement(
                                    link.method,
                                    link.parameter,
                                    link.extra,
                                  )}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="m-0 rounded-xl border border-[var(--line)] bg-transparent px-3 py-3 text-sm text-[var(--sea-ink-soft)]">
                            No further evolution found.
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-[var(--line)] bg-[var(--bg-base)] p-4 sm:p-5">
                    <h3 className="m-0 text-lg font-bold text-[var(--sea-ink)]">
                      Type Defenses
                    </h3>
                    <p className="mt-1 mb-0 text-sm text-[var(--sea-ink-soft)]">
                      The effectiveness of each attacking type on{' '}
                      <span className="font-semibold">{selectedPokemon.displayName}</span>.
                    </p>

                    {selectedPokemonTypes.length > 0 && selectedDefensiveMultipliers ? (
                      <div className="mt-4 space-y-3">
                        {TYPE_DEFENSE_ROWS.map((row, rowIndex) => (
                          <div key={`defense-row-${rowIndex}`} className="grid grid-cols-9 gap-1.5">
                            {row.map((attackType) => {
                              const typeColor = getTypeColor(attackType)
                              const multiplier = selectedDefensiveMultipliers[attackType]
                              const multiplierTone = getDefenseMultiplierTone(multiplier)
                              const isNeutral = multiplier === 1

                              return (
                                <div key={`defense-${attackType}`} className="space-y-1">
                                  <span
                                    className="flex h-9 items-center justify-center rounded-md border text-[11px] font-extrabold tracking-[0.06em] text-[var(--sea-ink)] uppercase"
                                    style={{
                                      backgroundColor: typeColor.bg,
                                      borderColor: typeColor.border,
                                    }}
                                    title={toDisplayLabel(attackType)}
                                  >
                                    {attackType.slice(0, 3).toUpperCase()}
                                  </span>

                                  {isNeutral ? (
                                    <div className="h-7 rounded-md border border-transparent" />
                                  ) : (
                                    <span
                                      className="flex h-7 items-center justify-center rounded-md border text-xs font-bold tabular-nums"
                                      style={{
                                        backgroundColor: multiplierTone.bg,
                                        borderColor: multiplierTone.border,
                                        color: multiplierTone.text,
                                      }}
                                      title={getDefensiveMatchupLabel(multiplier)}
                                    >
                                      {formatMultiplier(multiplier)}
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 mb-0 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.45)] px-3 py-3 text-sm text-[var(--sea-ink-soft)]">
                        {!hasLoadedTypes
                          ? 'Loading type matchup data from PokemonDB...'
                          : typeLoadError
                            ? 'Type matchup card unavailable until type data loads.'
                            : 'Type matchup card unavailable for this Pokemon.'}
                      </p>
                    )}
                  </section>
                </article>

                <article className="grid gap-5 lg:grid-cols-2">
                  <section className="island-shell rounded-2xl p-5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="m-0 text-lg font-bold text-[var(--sea-ink)]">
                        Learn Set
                      </h3>
                      <span className="rounded-full border border-[var(--line)] px-2.5 py-0.5 text-xs font-semibold text-[var(--sea-ink-soft)]">
                        {selectedPokemon.learnSet.length} moves
                      </span>
                    </div>
                    <div className="max-h-[320px] overflow-auto rounded-xl border border-[var(--line)]">
                      <table className="w-full border-collapse text-sm">
                        <thead className="sticky top-0 bg-[color-mix(in_oklab,var(--surface-strong)_86%,white_14%)]">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
                              Level
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
                              Move
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPokemon.learnSet.length > 0 ? (
                            selectedPokemon.learnSet.map((move, index) => (
                              <tr key={`${move.level}-${move.move}-${index}`}>
                                <td className="border-t border-[var(--line)] px-3 py-1.5 font-semibold tabular-nums">
                                  {move.level}
                                </td>
                                <td className="border-t border-[var(--line)] px-3 py-1.5">
                                  {toDisplayLabel(move.move)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                className="px-3 py-4 text-sm text-[var(--sea-ink-soft)]"
                                colSpan={2}
                              >
                                No learn set moves listed.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="island-shell rounded-2xl p-5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="m-0 text-lg font-bold text-[var(--sea-ink)]">
                        Egg Moves
                      </h3>
                      <span className="rounded-full border border-[var(--line)] px-2.5 py-0.5 text-xs font-semibold text-[var(--sea-ink-soft)]">
                        {selectedPokemon.eggMoves.length} moves
                      </span>
                    </div>
                    <div className="max-h-[320px] overflow-auto rounded-xl border border-[var(--line)]">
                      <table className="w-full border-collapse text-sm">
                        <thead className="sticky top-0 bg-[color-mix(in_oklab,var(--surface-strong)_86%,white_14%)]">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
                              Move
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPokemon.eggMoves.length > 0 ? (
                            selectedPokemon.eggMoves.map((move, index) => (
                              <tr key={`${move}-${index}`}>
                                <td className="border-t border-[var(--line)] px-3 py-1.5">
                                  {toDisplayLabel(move)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="px-3 py-4 text-sm text-[var(--sea-ink-soft)]">
                                No egg moves listed.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </article>
              </>
            ) : null}
          </section>
        </section>
      ) : null}
    </main>
  )
}
