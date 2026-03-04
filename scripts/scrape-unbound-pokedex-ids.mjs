#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const SITE_URL = 'https://ydarissep.github.io/Unbound-Pokedex/?'
const DEFAULT_GLOBAL_JS_URL =
  'https://ydarissep.github.io/Unbound-Pokedex/src/global.js'
const FETCH_TIMEOUT_MS = 30_000

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const DEFAULT_INPUT = path.join(repoRoot, 'public', 'pokemon_data.json')
const DEFAULT_OUTPUT = path.join(repoRoot, 'public', 'pokemon_ids.json')

function printHelp() {
  console.log(`
Scrape Pokemon IDs from Ydarissep Unbound Pokedex sources.

Usage:
  node scripts/scrape-unbound-pokedex-ids.mjs [options]

Options:
  --input <path>   Local Pokemon source JSON (default: public/pokemon_data.json)
  --output <path>  Output JSON file (default: public/pokemon_ids.json)
  --help           Show this message
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

async function fetchText(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'unbound-wiki-id-scraper/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`Request failed (${response.status}) for ${url}`)
    }

    return response.text()
  } finally {
    clearTimeout(timeout)
  }
}

function findGlobalScriptUrl(siteHtml) {
  const match = siteHtml.match(
    /<script[^>]+src=["']([^"']*src\/global\.js[^"']*)["'][^>]*>/i,
  )

  if (match?.[1]) {
    return new URL(match[1], SITE_URL).href
  }

  return DEFAULT_GLOBAL_JS_URL
}

function parseRepo1(globalJsText) {
  const match = globalJsText.match(/window\.repo1\s*=\s*"([^"]+)"/)
  if (!match?.[1]) {
    throw new Error('Could not parse repo1 from global.js')
  }
  return match[1]
}

function parseSpeciesIds(speciesHeaderText) {
  const idsBySpeciesConstant = {}
  const lines = speciesHeaderText.split(/\r?\n/)

  for (const line of lines) {
    const speciesMatch = line.match(/#define\s+(SPECIES_[A-Z0-9_]+)/i)
    if (!speciesMatch?.[1]) {
      continue
    }

    const idMatch = line.match(/0[xX][0-9a-fA-F]+/)
    if (!idMatch?.[0]) {
      continue
    }

    idsBySpeciesConstant[speciesMatch[1]] = Number.parseInt(idMatch[0], 16)
  }

  return idsBySpeciesConstant
}

function buildLocalPokemonIdMap(localData, idsBySpeciesConstant) {
  const localKeys = Object.keys(localData).sort()
  const idsByKey = {}
  const missingKeys = []

  for (const key of localKeys) {
    const speciesConstant = `SPECIES_${key}`
    const id = idsBySpeciesConstant[speciesConstant]

    if (typeof id === 'number' && Number.isFinite(id)) {
      idsByKey[key] = id
    } else {
      missingKeys.push(key)
    }
  }

  return {
    idsByKey,
    missingKeys,
    localKeys,
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const localData = await readJsonFile(options.input)

  if (!isRecord(localData)) {
    throw new Error(`Expected object data from "${options.input}"`)
  }

  const siteHtml = await fetchText(SITE_URL)
  const globalScriptUrl = findGlobalScriptUrl(siteHtml)
  const globalJsText = await fetchText(globalScriptUrl)
  const repo1 = parseRepo1(globalJsText)
  const speciesHeaderUrl = `https://raw.githubusercontent.com/${repo1}/include/constants/species.h`
  const speciesHeaderText = await fetchText(speciesHeaderUrl)

  const idsBySpeciesConstant = parseSpeciesIds(speciesHeaderText)
  const localMap = buildLocalPokemonIdMap(localData, idsBySpeciesConstant)
  const generatedAt = new Date().toISOString()

  const output = {
    meta: {
      schemaVersion: 1,
      generatedAt,
      source: {
        siteUrl: SITE_URL,
        globalScriptUrl,
        repo1,
        speciesHeaderUrl,
      },
      counts: {
        sourceSpeciesConstants: Object.keys(idsBySpeciesConstant).length,
        localPokemon: localMap.localKeys.length,
        matchedLocalPokemon: Object.keys(localMap.idsByKey).length,
        missingLocalPokemon: localMap.missingKeys.length,
      },
    },
    idsByKey: localMap.idsByKey,
    missingLocalKeys: localMap.missingKeys,
    idsBySpeciesConstant,
  }

  await writeJsonFile(options.output, output)

  const relativeOutput = path.relative(repoRoot, options.output).replaceAll('\\', '/')
  console.log(`Wrote Pokemon IDs to ${relativeOutput}`)
  console.log(
    `Local matched: ${Object.keys(localMap.idsByKey).length}/${localMap.localKeys.length}`,
  )
  console.log(`Missing local keys: ${localMap.missingKeys.length}`)
}

main().catch((error) => {
  console.error(
    `Failed to scrape Pokemon IDs: ${error instanceof Error ? error.message : String(error)}`,
  )
  process.exit(1)
})
