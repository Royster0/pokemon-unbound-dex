#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const TYPE_SOURCE_URL = 'https://pokemondb.net/pokedex/all'
const FETCH_TIMEOUT_MS = 30_000
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
const DEFAULT_TYPES_CACHE = path.join(
  repoRoot,
  'scripts',
  '.cache',
  'pokemon-types.json',
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
  --types-cache <path>  Type map cache file path (default: scripts/.cache/pokemon-types.json)
  --offline             Skip live fetch; load types from cache only
  --no-cache-write      Do not update type cache after successful live fetch
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
    typesCache: DEFAULT_TYPES_CACHE,
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
      case '--types-cache': {
        options.typesCache = toAbsolutePath(argv[index + 1])
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

function parsePokemonTypesFromHtml(html) {
  const typeMap = {}
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
      .filter((type, index, list) => type.length > 0 && list.indexOf(type) === index)

    if (types.length > 0) {
      typeMap[slug] = types
    }
  }

  return typeMap
}

function normalizeTypeMap(rawMap) {
  const normalized = {}

  if (!isRecord(rawMap)) {
    return normalized
  }

  for (const [slug, value] of Object.entries(rawMap)) {
    if (!Array.isArray(value)) {
      continue
    }

    const types = value
      .filter((item) => typeof item === 'string')
      .map((type) => type.trim().toLowerCase())
      .filter((type, index, list) => type.length > 0 && list.indexOf(type) === index)

    if (types.length > 0) {
      normalized[slug.toLowerCase()] = types
    }
  }

  return normalized
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

async function readTypeMapCache(cachePath) {
  const parsed = await readJsonFile(cachePath)

  if (isRecord(parsed) && isRecord(parsed.typeMap)) {
    return {
      typeMap: normalizeTypeMap(parsed.typeMap),
      fetchedAt:
        typeof parsed.fetchedAt === 'string' && parsed.fetchedAt.length > 0
          ? parsed.fetchedAt
          : null,
      source: 'cache-payload',
    }
  }

  return {
    typeMap: normalizeTypeMap(parsed),
    fetchedAt: null,
    source: 'cache-raw',
  }
}

async function fetchTypeMapFromPokemonDb() {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(TYPE_SOURCE_URL, {
      signal: controller.signal,
      headers: {
        'user-agent': 'unbound-wiki-data-build/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`PokemonDB request failed with status ${response.status}.`)
    }

    const html = await response.text()
    const typeMap = parsePokemonTypesFromHtml(html)
    if (Object.keys(typeMap).length === 0) {
      throw new Error('PokemonDB type parsing produced no records.')
    }

    return typeMap
  } finally {
    clearTimeout(timeout)
  }
}

async function loadPokemonTypeMap(options) {
  if (options.offline) {
    const cached = await readTypeMapCache(options.typesCache)
    if (Object.keys(cached.typeMap).length === 0) {
      throw new Error(
        `Offline mode enabled, but cache at "${options.typesCache}" has no usable type records.`,
      )
    }

    return {
      typeMap: cached.typeMap,
      mode: 'cache',
      fetchedAt: cached.fetchedAt,
    }
  }

  try {
    const typeMap = await fetchTypeMapFromPokemonDb()
    const fetchedAt = new Date().toISOString()

    if (options.writeCache) {
      await writeJsonFile(options.typesCache, {
        schemaVersion: 1,
        sourceUrl: TYPE_SOURCE_URL,
        fetchedAt,
        typeMap,
      })
    }

    return {
      typeMap,
      mode: 'live',
      fetchedAt,
    }
  } catch (error) {
    try {
      const cached = await readTypeMapCache(options.typesCache)
      if (Object.keys(cached.typeMap).length === 0) {
        throw error
      }

      console.warn(
        `Live type fetch failed (${error instanceof Error ? error.message : String(error)}). Falling back to cache at "${options.typesCache}".`,
      )
      return {
        typeMap: cached.typeMap,
        mode: 'cache',
        fetchedAt: cached.fetchedAt,
      }
    } catch {
      throw error
    }
  }
}

function normalizePokemonData(rawData, typeMap, idMap) {
  const keySet = new Set(Object.keys(rawData))
  const normalizedPokemon = {}

  let withTypes = 0
  let withoutTypes = 0
  let baseTypeFallbacks = 0
  let withIds = 0
  let withoutIds = 0

  const sortedEntries = Object.entries(rawData).sort(([left], [right]) =>
    left.localeCompare(right),
  )

  for (const [key, raw] of sortedEntries) {
    const safeRaw = isRecord(raw) ? raw : {}
    const baseKey = getBaseSpeciesKey(key, keySet)
    const spriteSlug = keyToSlug(key)
    const baseSlug = keyToSlug(baseKey)

    const formTypes = typeMap[spriteSlug]
    const baseTypes = typeMap[baseSlug]
    const types =
      Array.isArray(formTypes) && formTypes.length > 0
        ? formTypes
        : Array.isArray(baseTypes) && baseTypes.length > 0
          ? baseTypes
          : []

    if ((!Array.isArray(formTypes) || formTypes.length === 0) && types.length > 0) {
      baseTypeFallbacks += 1
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
      baseTypeFallbacks,
      withIds,
      withoutIds,
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

  const typeLoad = await loadPokemonTypeMap(options)
  const normalized = normalizePokemonData(baseData, typeLoad.typeMap, pokemonIdMap)
  const generatedAt = new Date().toISOString()

  const unifiedCatalog = {
    meta: {
      schemaVersion: 1,
      generatedAt,
      sources: {
        baseDataPath: path.relative(repoRoot, options.input).replaceAll('\\', '/'),
        pokemonIdsPath: path.relative(repoRoot, options.idsInput).replaceAll('\\', '/'),
        typeSourceUrl: TYPE_SOURCE_URL,
        typeLoadMode: typeLoad.mode,
        typeDataFetchedAt: typeLoad.fetchedAt,
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
    `Pokemon: ${normalized.counts.totalPokemon}, with types: ${normalized.counts.withTypes}, without types: ${normalized.counts.withoutTypes}, base fallback types: ${normalized.counts.baseTypeFallbacks}`,
  )
  console.log(
    `Pokemon IDs: with id: ${normalized.counts.withIds}, without id: ${normalized.counts.withoutIds}`,
  )
  console.log(`Type source mode: ${typeLoad.mode}`)
}

main().catch((error) => {
  console.error(
    `Failed to build unified catalog: ${error instanceof Error ? error.message : String(error)}`,
  )
  process.exit(1)
})
