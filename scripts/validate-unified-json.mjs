#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const STAT_KEYS = [
  'hp',
  'attack',
  'defense',
  'sp_attack',
  'sp_defense',
  'speed',
]

const TYPE_NAME_PATTERN = /^[a-z]+$/
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const DEFAULT_INPUT = path.join(repoRoot, 'public', 'pokedex_catalog.json')

function printHelp() {
  console.log(`
Validate a unified Pokedex catalog JSON.

Usage:
  node scripts/validate-unified-json.mjs [options]

Options:
  --input <path>            Catalog JSON path (default: public/pokedex_catalog.json)
  --require-types           Fail if any Pokemon record has no types
  --max-missing-types <n>   Fail if missing type count is greater than n
  --require-ids             Fail if any Pokemon record is missing id
  --max-missing-ids <n>     Fail if missing id count is greater than n
  --help                    Show this message
`.trim())
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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
    requireTypes: false,
    maxMissingTypes: null,
    requireIds: false,
    maxMissingIds: null,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    switch (arg) {
      case '--input': {
        options.input = toAbsolutePath(argv[index + 1])
        index += 1
        break
      }
      case '--require-types':
        options.requireTypes = true
        break
      case '--max-missing-types': {
        const raw = argv[index + 1]
        const parsed = Number.parseInt(raw ?? '', 10)
        if (!Number.isFinite(parsed) || parsed < 0) {
          throw new Error(`Invalid value for --max-missing-types: ${raw}`)
        }
        options.maxMissingTypes = parsed
        index += 1
        break
      }
      case '--require-ids':
        options.requireIds = true
        break
      case '--max-missing-ids': {
        const raw = argv[index + 1]
        const parsed = Number.parseInt(raw ?? '', 10)
        if (!Number.isFinite(parsed) || parsed < 0) {
          throw new Error(`Invalid value for --max-missing-ids: ${raw}`)
        }
        options.maxMissingIds = parsed
        index += 1
        break
      }
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

async function readJsonFile(filePath) {
  const content = await readFile(filePath, 'utf8')
  return JSON.parse(content)
}

function validateCatalog(catalog, options) {
  const errors = []
  const warnings = []

  const pushError = (pathLabel, message) => errors.push(`${pathLabel}: ${message}`)
  const pushWarning = (pathLabel, message) => warnings.push(`${pathLabel}: ${message}`)

  if (!isRecord(catalog)) {
    pushError('$', 'catalog must be an object')
    return { errors, warnings, stats: { totalPokemon: 0, missingTypes: 0 } }
  }

  if (!isRecord(catalog.meta)) {
    pushError('meta', 'meta must be an object')
  }

  if (!isRecord(catalog.pokemon)) {
    pushError('pokemon', 'pokemon must be an object map')
    return { errors, warnings, stats: { totalPokemon: 0, missingTypes: 0 } }
  }

  const pokemonEntries = Object.entries(catalog.pokemon)
  const allPokemonKeys = new Set(pokemonEntries.map(([key]) => key))
  let missingTypes = 0
  let missingIds = 0

  for (const [mapKey, record] of pokemonEntries) {
    const basePath = `pokemon.${mapKey}`

    if (!isRecord(record)) {
      pushError(basePath, 'record must be an object')
      continue
    }

    if (record.key !== mapKey) {
      pushError(basePath, `key mismatch; expected "${mapKey}" and found "${record.key}"`)
    }

    if (!Object.hasOwn(record, 'id')) {
      pushError(`${basePath}.id`, 'must exist and be a non-negative integer or null')
    } else if (record.id === null) {
      missingIds += 1
    } else if (typeof record.id !== 'number' || !Number.isFinite(record.id)) {
      pushError(`${basePath}.id`, 'must be a finite number or null')
    } else {
      if (!Number.isInteger(record.id)) {
        pushWarning(`${basePath}.id`, 'should be an integer')
      }
      if (record.id < 0) {
        pushError(`${basePath}.id`, 'must be >= 0')
      }
    }

    for (const field of ['displayName', 'baseKey', 'baseSlug', 'spriteSlug']) {
      if (typeof record[field] !== 'string' || record[field].trim().length === 0) {
        pushError(`${basePath}.${field}`, 'must be a non-empty string')
      }
    }

    if (typeof record.baseSlug === 'string' && !SLUG_PATTERN.test(record.baseSlug)) {
      pushWarning(`${basePath}.baseSlug`, `unexpected slug format "${record.baseSlug}"`)
    }

    if (typeof record.spriteSlug === 'string' && !SLUG_PATTERN.test(record.spriteSlug)) {
      pushWarning(
        `${basePath}.spriteSlug`,
        `unexpected slug format "${record.spriteSlug}"`,
      )
    }

    if (!isRecord(record.baseStats)) {
      pushError(`${basePath}.baseStats`, 'must be an object')
    } else {
      let computedTotal = 0
      for (const statKey of STAT_KEYS) {
        const statValue = record.baseStats[statKey]

        if (typeof statValue !== 'number' || !Number.isFinite(statValue)) {
          pushError(`${basePath}.baseStats.${statKey}`, 'must be a finite number')
          continue
        }

        if (!Number.isInteger(statValue)) {
          pushWarning(`${basePath}.baseStats.${statKey}`, 'should be an integer')
        }

        if (statValue < 0) {
          pushError(`${basePath}.baseStats.${statKey}`, 'must be >= 0')
        }

        if (statValue > 255) {
          pushWarning(
            `${basePath}.baseStats.${statKey}`,
            `value ${statValue} exceeds standard cap 255`,
          )
        }

        computedTotal += statValue
      }

      if (typeof record.total !== 'number' || !Number.isFinite(record.total)) {
        pushError(`${basePath}.total`, 'must be a finite number')
      } else if (record.total !== computedTotal) {
        pushError(
          `${basePath}.total`,
          `expected ${computedTotal} from baseStats, found ${record.total}`,
        )
      }
    }

    if (!Array.isArray(record.learnSet)) {
      pushError(`${basePath}.learnSet`, 'must be an array')
    } else {
      for (let index = 0; index < record.learnSet.length; index += 1) {
        const move = record.learnSet[index]
        const movePath = `${basePath}.learnSet[${index}]`
        if (!isRecord(move)) {
          pushError(movePath, 'must be an object')
          continue
        }

        if (typeof move.level !== 'number' || !Number.isFinite(move.level) || move.level < 0) {
          pushError(`${movePath}.level`, 'must be a finite number >= 0')
        }

        if (typeof move.move !== 'string' || move.move.trim().length === 0) {
          pushError(`${movePath}.move`, 'must be a non-empty string')
        }
      }
    }

    if (!Array.isArray(record.eggMoves)) {
      pushError(`${basePath}.eggMoves`, 'must be an array')
    } else {
      const seen = new Set()
      for (let index = 0; index < record.eggMoves.length; index += 1) {
        const move = record.eggMoves[index]
        const movePath = `${basePath}.eggMoves[${index}]`

        if (typeof move !== 'string' || move.trim().length === 0) {
          pushError(movePath, 'must be a non-empty string')
          continue
        }

        if (seen.has(move)) {
          pushWarning(movePath, `duplicate egg move "${move}"`)
        }
        seen.add(move)
      }
    }

    if (!Array.isArray(record.evolutionTable)) {
      pushError(`${basePath}.evolutionTable`, 'must be an array')
    } else {
      for (let index = 0; index < record.evolutionTable.length; index += 1) {
        const step = record.evolutionTable[index]
        const stepPath = `${basePath}.evolutionTable[${index}]`
        if (!isRecord(step)) {
          pushError(stepPath, 'must be an object')
          continue
        }

        if (typeof step.method !== 'string' || step.method.trim().length === 0) {
          pushError(`${stepPath}.method`, 'must be a non-empty string')
        }

        if (typeof step.target !== 'string' || step.target.trim().length === 0) {
          pushError(`${stepPath}.target`, 'must be a non-empty string')
        } else if (!allPokemonKeys.has(step.target)) {
          pushWarning(`${stepPath}.target`, `target "${step.target}" not found in catalog`)
        }
      }
    }

    if (!Array.isArray(record.types)) {
      pushError(`${basePath}.types`, 'must be an array')
    } else {
      if (record.types.length === 0) {
        missingTypes += 1
      }
      if (record.types.length > 2) {
        pushWarning(`${basePath}.types`, 'contains more than 2 types')
      }

      const seen = new Set()
      for (let index = 0; index < record.types.length; index += 1) {
        const type = record.types[index]
        const typePath = `${basePath}.types[${index}]`

        if (typeof type !== 'string' || type.trim().length === 0) {
          pushError(typePath, 'must be a non-empty string')
          continue
        }

        const normalized = type.trim().toLowerCase()
        if (normalized !== type) {
          pushWarning(typePath, `type "${type}" should be lowercase`)
        }

        if (!TYPE_NAME_PATTERN.test(normalized)) {
          pushWarning(typePath, `unexpected type format "${type}"`)
        }

        if (seen.has(normalized)) {
          pushWarning(typePath, `duplicate type "${type}"`)
        }
        seen.add(normalized)
      }
    }

    if (!Array.isArray(record.spriteSources)) {
      pushError(`${basePath}.spriteSources`, 'must be an array')
    } else if (record.spriteSources.length === 0) {
      pushError(`${basePath}.spriteSources`, 'must include at least one source URL')
    } else {
      for (let index = 0; index < record.spriteSources.length; index += 1) {
        const source = record.spriteSources[index]
        const sourcePath = `${basePath}.spriteSources[${index}]`

        if (typeof source !== 'string' || source.trim().length === 0) {
          pushError(sourcePath, 'must be a non-empty string URL')
          continue
        }

        try {
          const parsed = new URL(source)
          if (parsed.protocol !== 'https:') {
            pushWarning(sourcePath, 'URL should use https')
          }
        } catch {
          pushError(sourcePath, `invalid URL "${source}"`)
        }
      }
    }
  }

  if (options.requireTypes && missingTypes > 0) {
    pushError('pokemon', `missing types for ${missingTypes} Pokemon records`)
  }

  if (
    typeof options.maxMissingTypes === 'number' &&
    missingTypes > options.maxMissingTypes
  ) {
    pushError(
      'pokemon',
      `missing types ${missingTypes} exceeds max allowed ${options.maxMissingTypes}`,
    )
  }

  if (options.requireIds && missingIds > 0) {
    pushError('pokemon', `missing ids for ${missingIds} Pokemon records`)
  }

  if (typeof options.maxMissingIds === 'number' && missingIds > options.maxMissingIds) {
    pushError(
      'pokemon',
      `missing ids ${missingIds} exceeds max allowed ${options.maxMissingIds}`,
    )
  }

  return {
    errors,
    warnings,
    stats: {
      totalPokemon: pokemonEntries.length,
      missingTypes,
      missingIds,
    },
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const catalog = await readJsonFile(options.input)
  const result = validateCatalog(catalog, options)

  const relativeInput = path.relative(repoRoot, options.input).replaceAll('\\', '/')
  console.log(`Validated ${relativeInput}`)
  console.log(
    `Records: ${result.stats.totalPokemon}, Missing types: ${result.stats.missingTypes}, Missing ids: ${result.stats.missingIds}`,
  )
  console.log(`Warnings: ${result.warnings.length}, Errors: ${result.errors.length}`)

  if (result.warnings.length > 0) {
    console.warn('\nWarnings:')
    for (const warning of result.warnings) {
      console.warn(`- ${warning}`)
    }
  }

  if (result.errors.length > 0) {
    console.error('\nErrors:')
    for (const error of result.errors) {
      console.error(`- ${error}`)
    }
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(
    `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
  )
  process.exit(1)
})
