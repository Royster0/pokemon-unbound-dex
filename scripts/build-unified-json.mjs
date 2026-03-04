#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const FRONTSPR_RAW_BASE_URL =
  'https://raw.githubusercontent.com/Skeli789/Dynamic-Pokemon-Expansion/refs/heads/Unbound/graphics/frontspr'
const POKEMON_DB_SPRITE_PATHS = [
  'scarlet-violet/normal',
  'brilliant-diamond-shining-pearl/normal',
  'bank/normal',
  'home/normal',
]
const STAT_KEYS = [
  'hp',
  'attack',
  'defense',
  'sp_attack',
  'sp_defense',
  'speed',
]

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const DEFAULT_INPUT = path.join(repoRoot, 'public', 'pokemon_data.json')
const DEFAULT_OUTPUT = path.join(repoRoot, 'public', 'pokedex_catalog.json')
const DEFAULT_IDS_INPUT = path.join(repoRoot, 'public', 'pokemon_ids.json')
const DEFAULT_BASE_STATS_SOURCE = path.join(
  repoRoot,
  'scripts',
  'sources',
  'Base_Stats.c',
)

function printHelp() {
  console.log(`
Build a unified Pokedex catalog JSON.

Usage:
  node scripts/build-unified-json.mjs [options]

Options:
  --input <path>        Base data JSON path (default: public/pokemon_data.json)
  --output <path>       Unified output path (default: public/pokedex_catalog.json)
  --ids-input <path>    Pokemon ID JSON path (default: public/pokemon_ids.json)
  --base-stats-source <path>
                        Base stats C source path (default: scripts/sources/Base_Stats.c)
  --types-cache <path>  (deprecated; ignored)
  --offline             (deprecated; ignored)
  --no-cache-write      (deprecated; ignored)
  --help                Show this message
`.trim())
}

function toAbsolutePath(value) {
  if (!value) {
    throw new Error('Expected a path value.')
  }
  return path.resolve(process.cwd(), value)
}

function parseArgs(argv) {
  const options = {
    input: DEFAULT_INPUT,
    output: DEFAULT_OUTPUT,
    idsInput: DEFAULT_IDS_INPUT,
    baseStatsSource: DEFAULT_BASE_STATS_SOURCE,
    typesCache: null,
    offline: false,
    writeCache: true,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    switch (arg) {
      case '--input': {
        options.input = toAbsolutePath(argv[index + 1])
        index += 1
        break
      }
      case '--output': {
        options.output = toAbsolutePath(argv[index + 1])
        index += 1
        break
      }
      case '--ids-input': {
        options.idsInput = toAbsolutePath(argv[index + 1])
        index += 1
        break
      }
      case '--base-stats-source': {
        options.baseStatsSource = toAbsolutePath(argv[index + 1])
        index += 1
        break
      }
      case '--types-cache': {
        options.typesCache = argv[index + 1] ? toAbsolutePath(argv[index + 1]) : null
        index += 1
        break
      }
      case '--offline':
        options.offline = true
        break
      case '--no-cache-write':
        options.writeCache = false
        break
      case '--help':
        printHelp()
        process.exit(0)
        break
      default:
        throw new Error(`Unknown option: ${arg}`)
    }
  }

  return options
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function readJsonFile(filePath) {
  const content = await readFile(filePath, 'utf8')
  return JSON.parse(content)
}

async function writeJsonFile(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function numberOrZero(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value))
  }
  return 0
}

function formatPokemonId(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return null
  }

  return Math.trunc(value).toString().padStart(3, '0')
}

function toDisplayLabel(value) {
  return String(value)
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
}

function keyToSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .replaceAll('_', '-')
}

function getBaseSpeciesKey(key, keySet) {
  const parts = key.split('_')
  for (let index = parts.length - 1; index >= 1; index -= 1) {
    const candidate = parts.slice(0, index).join('_')
    if (keySet.has(candidate)) {
      return candidate
    }
  }
  return key
}

function keyToFrontSpriteName(key) {
  const parts = String(key)
    .toUpperCase()
    .split('_')
    .filter(Boolean)
  const hasTrailingGiga = parts.length > 0 && parts[parts.length - 1] === 'GIGA'
  const orderedParts = hasTrailingGiga ? ['GIGA', ...parts.slice(0, -1)] : parts

  return orderedParts
    .map((part) => {
      const loweredPart = part.toLowerCase()
      if (/^\d+$/.test(loweredPart)) {
        return loweredPart
      }

      if (loweredPart.length === 1) {
        return loweredPart.toUpperCase()
      }

      return loweredPart[0].toUpperCase() + loweredPart.slice(1)
    })
    .join('')
}

function isGigaFormKey(key) {
  return String(key).toUpperCase().endsWith('_GIGA')
}

function buildPokemonDbSpriteFallbackSources(spriteSlug, baseSlug) {
  const slugs = [...new Set([spriteSlug, baseSlug])]
  const sources = []

  for (const spritePath of POKEMON_DB_SPRITE_PATHS) {
    for (const slug of slugs) {
      sources.push(`https://img.pokemondb.net/sprites/${spritePath}/${slug}.png`)
    }
  }

  return sources
}

function buildSpriteSources({ id, key, baseKey, spriteSlug, baseSlug }) {
  const sources = []

  const paddedId = formatPokemonId(id)
  if (paddedId !== null) {
    const rawId = String(Math.trunc(id))

    for (const keyVariant of [...new Set([key, baseKey])]) {
      const frontSpriteName = keyToFrontSpriteName(keyVariant)
      if (frontSpriteName.length > 0) {
        if (isGigaFormKey(keyVariant)) {
          sources.push(`${FRONTSPR_RAW_BASE_URL}/gFrontSprite${frontSpriteName}.png`)
        }

        sources.push(
          `${FRONTSPR_RAW_BASE_URL}/gFrontSprite${paddedId}${frontSpriteName}.png`,
        )
        if (rawId !== paddedId) {
          sources.push(
            `${FRONTSPR_RAW_BASE_URL}/gFrontSprite${rawId}${frontSpriteName}.png`,
          )
        }
      }
    }
  }

  // Keep PokemonDB as fallback if a frontspr sprite does not exist.
  sources.push(...buildPokemonDbSpriteFallbackSources(spriteSlug, baseSlug))

  return [...new Set(sources)]
}

function normalizePokemonIdMap(rawIdsPayload) {
  const candidateMap =
    isRecord(rawIdsPayload) && isRecord(rawIdsPayload.idsByKey)
      ? rawIdsPayload.idsByKey
      : rawIdsPayload

  const normalized = {}
  if (!isRecord(candidateMap)) {
    return normalized
  }

  for (const [key, value] of Object.entries(candidateMap)) {
    let parsedId = null

    if (typeof value === 'number' && Number.isFinite(value)) {
      parsedId = Math.trunc(value)
    } else if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
      parsedId = Number.parseInt(value, 10)
    }

    if (parsedId !== null && parsedId >= 0) {
      normalized[key] = parsedId
    }
  }

  return normalized
}

function normalizePrefixedConstant(value, prefix) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return null
  }

  const expectedPrefix = `${prefix}_`
  if (!trimmed.startsWith(expectedPrefix)) {
    return trimmed.toLowerCase()
  }

  const suffix = trimmed.slice(expectedPrefix.length)
  if (suffix === 'NONE') {
    return null
  }

  return suffix.toLowerCase()
}

function parseIntegerConstant(value) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return null
  }

  const radix = /^0x/i.test(trimmed) ? 16 : 10
  const parsed = Number.parseInt(trimmed, radix)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeSpeciesDetails(rawFields) {
  const type1 = normalizePrefixedConstant(rawFields.type1, 'TYPE')
  const type2 = normalizePrefixedConstant(rawFields.type2, 'TYPE')
  const types = [type1, type2].filter(
    (value, index, list) =>
      typeof value === 'string' && value.length > 0 && list.indexOf(value) === index,
  )

  const eggGroup1 = normalizePrefixedConstant(rawFields.eggGroup1, 'EGG_GROUP')
  const eggGroup2 = normalizePrefixedConstant(rawFields.eggGroup2, 'EGG_GROUP')
  const eggGroups = [eggGroup1, eggGroup2].filter(
    (value, index, list) =>
      typeof value === 'string' && value.length > 0 && list.indexOf(value) === index,
  )

  return {
    types,
    abilities: {
      primary: normalizePrefixedConstant(rawFields.ability1, 'ABILITY'),
      secondary: normalizePrefixedConstant(rawFields.ability2, 'ABILITY'),
      hidden: normalizePrefixedConstant(rawFields.hiddenAbility, 'ABILITY'),
    },
    eggGroups,
    heldItems: {
      common: normalizePrefixedConstant(rawFields.item1, 'ITEM'),
      rare: normalizePrefixedConstant(rawFields.item2, 'ITEM'),
    },
    growthRate: normalizePrefixedConstant(rawFields.growthRate, 'GROWTH'),
    catchRate: parseIntegerConstant(rawFields.catchRate),
  }
}

function parseSpeciesDetailsFromBaseStatsContent(content) {
  const speciesDetailsByKey = {}
  const speciesStartPattern = /^\s*\[SPECIES_([A-Z0-9_]+)\]\s*=\s*$/
  const assignmentPattern = /^\s*\.(\w+)\s*=\s*([^,]+),/
  const blockEndPattern = /^\s*},/

  let activeSpeciesKey = null
  let activeFields = null

  const lines = String(content).split(/\r?\n/)
  for (const line of lines) {
    if (activeSpeciesKey === null) {
      const speciesStartMatch = line.match(speciesStartPattern)
      if (speciesStartMatch) {
        activeSpeciesKey = speciesStartMatch[1]
        activeFields = {}
      }
      continue
    }

    if (blockEndPattern.test(line)) {
      speciesDetailsByKey[activeSpeciesKey] = normalizeSpeciesDetails(activeFields)
      activeSpeciesKey = null
      activeFields = null
      continue
    }

    const assignmentMatch = line.match(assignmentPattern)
    if (assignmentMatch && activeFields) {
      const fieldName = assignmentMatch[1]
      const fieldValue = assignmentMatch[2].trim()
      activeFields[fieldName] = fieldValue
    }
  }

  return speciesDetailsByKey
}

async function loadSpeciesDetailsFromBaseStats(baseStatsSourcePath) {
  const sourceContent = await readFile(baseStatsSourcePath, 'utf8')
  const speciesDetailsByKey = parseSpeciesDetailsFromBaseStatsContent(sourceContent)

  if (Object.keys(speciesDetailsByKey).length === 0) {
    throw new Error(
      `No species details were parsed from base stats source "${baseStatsSourcePath}".`,
    )
  }

  return speciesDetailsByKey
}

function normalizePokemonData(rawData, speciesDetailsByKey, idMap) {
  const keySet = new Set(Object.keys(rawData))
  const normalizedPokemon = {}

  let withTypes = 0
  let withoutTypes = 0
  let typeFallbacksToBaseSpecies = 0
  let withIds = 0
  let withoutIds = 0
  let withSpeciesDetails = 0
  let withoutSpeciesDetails = 0

  const sortedEntries = Object.entries(rawData).sort(([left], [right]) =>
    left.localeCompare(right),
  )

  for (const [key, raw] of sortedEntries) {
    const safeRaw = isRecord(raw) ? raw : {}
    const baseKey = getBaseSpeciesKey(key, keySet)
    const spriteSlug = keyToSlug(key)
    const baseSlug = keyToSlug(baseKey)

    const formDetails = isRecord(speciesDetailsByKey[key]) ? speciesDetailsByKey[key] : null
    const baseDetails =
      isRecord(speciesDetailsByKey[baseKey]) ? speciesDetailsByKey[baseKey] : null

    const formTypes = Array.isArray(formDetails?.types) ? formDetails.types : []
    const baseTypes = Array.isArray(baseDetails?.types) ? baseDetails.types : []
    const types =
      formTypes.length > 0 ? formTypes : baseTypes.length > 0 ? baseTypes : []

    if (formTypes.length === 0 && types.length > 0) {
      typeFallbacksToBaseSpecies += 1
    }

    if (formDetails || baseDetails) {
      withSpeciesDetails += 1
    } else {
      withoutSpeciesDetails += 1
    }

    if (types.length > 0) {
      withTypes += 1
    } else {
      withoutTypes += 1
    }

    const id = typeof idMap[key] === 'number' ? idMap[key] : null
    if (id === null) {
      withoutIds += 1
    } else {
      withIds += 1
    }

    const selectedDetails = formDetails ?? baseDetails
    const abilities = {
      primary:
        selectedDetails && isRecord(selectedDetails.abilities)
          ? selectedDetails.abilities.primary ?? null
          : null,
      secondary:
        selectedDetails && isRecord(selectedDetails.abilities)
          ? selectedDetails.abilities.secondary ?? null
          : null,
      hidden:
        selectedDetails && isRecord(selectedDetails.abilities)
          ? selectedDetails.abilities.hidden ?? null
          : null,
    }

    const eggGroups =
      selectedDetails && Array.isArray(selectedDetails.eggGroups)
        ? selectedDetails.eggGroups.filter((group) => typeof group === 'string')
        : []

    const heldItems = {
      common:
        selectedDetails && isRecord(selectedDetails.heldItems)
          ? selectedDetails.heldItems.common ?? null
          : null,
      rare:
        selectedDetails && isRecord(selectedDetails.heldItems)
          ? selectedDetails.heldItems.rare ?? null
          : null,
    }

    const growthRate =
      selectedDetails && typeof selectedDetails.growthRate === 'string'
        ? selectedDetails.growthRate
        : null

    const catchRate =
      selectedDetails && typeof selectedDetails.catchRate === 'number'
        ? selectedDetails.catchRate
        : null

    const safeBaseStats = isRecord(safeRaw.base_stats) ? safeRaw.base_stats : {}
    const baseStats = {
      hp: numberOrZero(safeBaseStats.hp),
      attack: numberOrZero(safeBaseStats.attack),
      defense: numberOrZero(safeBaseStats.defense),
      sp_attack: numberOrZero(safeBaseStats.sp_attack),
      sp_defense: numberOrZero(safeBaseStats.sp_defense),
      speed: numberOrZero(safeBaseStats.speed),
    }
    const total = STAT_KEYS.reduce((sum, statKey) => sum + baseStats[statKey], 0)

    const learnSet = Array.isArray(safeRaw.learn_set)
      ? safeRaw.learn_set
          .map((move) => {
            const safeMove = isRecord(move) ? move : {}
            return {
              level: numberOrZero(safeMove.level),
              move: typeof safeMove.move === 'string' ? safeMove.move : '',
            }
          })
          .filter((move) => move.move.length > 0)
          .sort((left, right) => left.level - right.level || left.move.localeCompare(right.move))
      : []

    const eggMoves = Array.isArray(safeRaw.egg_moves)
      ? safeRaw.egg_moves
          .filter((move) => typeof move === 'string')
          .sort((left, right) => left.localeCompare(right))
      : []

    const evolutionTable = Array.isArray(safeRaw.evolution_table)
      ? safeRaw.evolution_table
          .map((step) => {
            const safeStep = isRecord(step) ? step : {}
            return {
              method: typeof safeStep.method === 'string' ? safeStep.method : 'UNKNOWN',
              parameter:
                typeof safeStep.parameter === 'string' ||
                typeof safeStep.parameter === 'number' ||
                typeof safeStep.parameter === 'boolean'
                  ? safeStep.parameter
                  : undefined,
              target: typeof safeStep.target === 'string' ? safeStep.target : '',
              extra:
                typeof safeStep.extra === 'string' ||
                typeof safeStep.extra === 'number' ||
                typeof safeStep.extra === 'boolean'
                  ? safeStep.extra
                  : undefined,
            }
          })
          .filter((step) => step.target.length > 0)
      : []

    normalizedPokemon[key] = {
      key,
      id,
      displayName: toDisplayLabel(key),
      baseKey,
      spriteSlug,
      baseSlug,
      baseStats,
      total,
      learnSet,
      eggMoves,
      evolutionTable,
      types,
      abilities,
      eggGroups,
      heldItems,
      growthRate,
      catchRate,
      spriteSources: buildSpriteSources({
        id,
        key,
        baseKey,
        spriteSlug,
        baseSlug,
      }),
    }
  }

  return {
    pokemon: normalizedPokemon,
    counts: {
      totalPokemon: sortedEntries.length,
      withTypes,
      withoutTypes,
      baseTypeFallbacks: typeFallbacksToBaseSpecies,
      typeFallbacksToBaseSpecies,
      withIds,
      withoutIds,
      withSpeciesDetails,
      withoutSpeciesDetails,
    },
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  const baseData = await readJsonFile(options.input)
  if (!isRecord(baseData)) {
    throw new Error(`Expected object data from "${options.input}".`)
  }

  const rawPokemonIds = await readJsonFile(options.idsInput)
  const pokemonIdMap = normalizePokemonIdMap(rawPokemonIds)

  const speciesDetailsByKey = await loadSpeciesDetailsFromBaseStats(options.baseStatsSource)
  const normalized = normalizePokemonData(baseData, speciesDetailsByKey, pokemonIdMap)
  const generatedAt = new Date().toISOString()

  const unifiedCatalog = {
    meta: {
      schemaVersion: 2,
      generatedAt,
      sources: {
        baseDataPath: path.relative(repoRoot, options.input).replaceAll('\\', '/'),
        pokemonIdsPath: path.relative(repoRoot, options.idsInput).replaceAll('\\', '/'),
        baseStatsSourcePath: path
          .relative(repoRoot, options.baseStatsSource)
          .replaceAll('\\', '/'),
        spritePrimarySourceUrl: FRONTSPR_RAW_BASE_URL,
        pokemonDbSpriteFallbackPaths: POKEMON_DB_SPRITE_PATHS,
      },
      counts: normalized.counts,
    },
    pokemon: normalized.pokemon,
  }

  await writeJsonFile(options.output, unifiedCatalog)

  const relativeOutput = path.relative(repoRoot, options.output).replaceAll('\\', '/')
  console.log(`Wrote unified catalog to ${relativeOutput}`)
  console.log(
    `Pokemon: ${normalized.counts.totalPokemon}, with types: ${normalized.counts.withTypes}, without types: ${normalized.counts.withoutTypes}, base fallback types: ${normalized.counts.typeFallbacksToBaseSpecies}`,
  )
  console.log(
    `Pokemon IDs: with id: ${normalized.counts.withIds}, without id: ${normalized.counts.withoutIds}`,
  )
  console.log(
    `Species details: with source data: ${normalized.counts.withSpeciesDetails}, without source data: ${normalized.counts.withoutSpeciesDetails}`,
  )
}

main().catch((error) => {
  console.error(
    `Failed to build unified catalog: ${error instanceof Error ? error.message : String(error)}`,
  )
  process.exit(1)
})
