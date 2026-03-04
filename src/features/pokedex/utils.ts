import {
  DEFAULT_TYPE_COLOR,
  SPRITE_PATHS,
  STAT_CAP,
  TYPE_CHART,
  TYPE_COLORS,
  TYPE_ORDER,
} from './constants'
import type {
  BaseStats,
  DefenseMultiplierMap,
  DefenseTone,
  PokemonDataFile,
  PokemonRecord,
  PokemonTypeMap,
  PokemonTypeName,
  TypeColor,
} from './types'

function numberOrZero(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value))
  }

  return 0
}

export function toDisplayLabel(value: string): string {
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

export function parsePokemonTypesFromHtml(html: string): PokemonTypeMap {
  const typeMap: PokemonTypeMap = {}
  const rowPattern = /<tr>([\s\S]*?)<\/tr>/g
  
  while (true) {
    const rowMatch = rowPattern.exec(html)
    if (!rowMatch) {
      break
    }

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

export function getTypesForPokemon(
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

export function getTypeColor(type: string): TypeColor {
  return TYPE_COLORS[type] ?? DEFAULT_TYPE_COLOR
}

function isKnownType(type: string): type is PokemonTypeName {
  return (TYPE_ORDER as readonly string[]).includes(type)
}

export function formatMultiplier(multiplier: number): string {
  if (multiplier === 0) {
    return '0x'
  }

  if (multiplier >= 1) {
    return `${multiplier}x`
  }

  const denominator = Math.round(1 / multiplier)
  return `1/${denominator}x`
}

export function getDefensiveMatchupLabel(multiplier: number): string {
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

export function computeDefensiveMultiplierMap(
  types: string[],
): DefenseMultiplierMap | null {
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

export function getDefenseMultiplierTone(multiplier: number): DefenseTone {
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

function formatEvolutionValue(
  value: string | number | boolean | undefined,
): string {
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

function formatEvolutionLevel(
  value: string | number | boolean | undefined,
): string {
  if (typeof value === 'number') {
    return `Level ${value}`
  }

  return 'Level up'
}

export function describeEvolutionRequirement(
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

export function getStatBarGradient(value: number): string {
  const hue = getStatBarHue(value)
  return `linear-gradient(90deg, hsl(${hue} 82% 34%), hsl(${hue} 90% 56%))`
}

export function normalizePokemonData(data: PokemonDataFile): PokemonRecord[] {
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

export function buildSpriteSources(
  spriteSlug: string,
  baseSlug: string,
): string[] {
  const slugs = [...new Set([spriteSlug, baseSlug])]
  const sources: string[] = []

  for (const path of SPRITE_PATHS) {
    for (const slug of slugs) {
      sources.push(`https://img.pokemondb.net/sprites/${path}/${slug}.png`)
    }
  }

  return sources
}
