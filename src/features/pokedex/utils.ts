import {
  DEFAULT_TYPE_COLOR,
  STAT_CAP,
  TYPE_CHART,
  TYPE_COLORS,
  TYPE_ORDER,
} from './constants'
import type {
  DefenseMultiplierMap,
  DefenseTone,
  PokedexCatalogFile,
  PokemonRecord,
  PokemonTypeName,
  TypeColor,
} from './types'

export function toDisplayLabel(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatPokemonId(id: number | null | undefined): string | null {
  if (typeof id !== 'number' || !Number.isFinite(id) || id < 0) {
    return null
  }

  return Math.trunc(id).toString().padStart(3, '0')
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

export function normalizePokemonCatalogData(
  data: PokedexCatalogFile,
): PokemonRecord[] {
  return Object.values(data.pokemon)
    .filter((pokemon) => pokemon.id !== 0 && pokemon.key !== 'MISSINGNO')
    .sort((a, b) => {
    const aHasId = typeof a.id === 'number'
    const bHasId = typeof b.id === 'number'

    if (aHasId !== bHasId) {
      return aHasId ? -1 : 1
    }

    if (aHasId && bHasId && a.id !== b.id) {
      return (a.id as number) - (b.id as number)
    }

      return a.displayName.localeCompare(b.displayName)
    })
}
