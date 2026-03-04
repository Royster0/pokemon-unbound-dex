import { useEffect, useId, useMemo, useState } from 'react'
import {
  EggMovesCard,
  ErrorNotice,
  InfoCard,
  LearnSetCard,
  LoadingNotice,
  NoResultsCard,
  PokedexSearchCard,
  PokemonListTable,
  PokemonSummaryCard,
  TypeDefensesCard,
} from './PokedexSections'
import type { PokedexCatalogFile, PokedexPageProps, PokemonRecord } from './types'
import {
  computeDefensiveMultiplierMap,
  formatPokemonId,
  normalizePokemonCatalogData,
  toDisplayLabel,
} from './utils'

const DEFAULT_TAB_TITLE = 'Unbound Pokedex'

function findPokemonByRouteKey(
  routeKey: string,
  pokemonList: PokemonRecord[],
): PokemonRecord | undefined {
  const normalized = decodeURIComponent(routeKey).trim().toLowerCase()
  const normalizedKey = normalized.replaceAll('-', '_')

  return pokemonList.find(
    (pokemon) =>
      pokemon.key.toLowerCase() === normalizedKey ||
      pokemon.spriteSlug === normalized ||
      pokemon.baseSlug === normalized,
  )
}

export function PokedexPage({
  showListPage,
  initialSelectedKey,
}: PokedexPageProps) {
  const [pokemonCatalog, setPokemonCatalog] = useState<PokedexCatalogFile | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selectedKey, setSelectedKey] = useState('')
  const searchInputId = useId()

  useEffect(() => {
    let isMounted = true

    async function loadPokemonCatalog() {
      try {
        const response = await fetch('/pokedex_catalog.json')
        if (!response.ok) {
          throw new Error(`Could not load pokedex_catalog.json (status ${response.status}).`)
        }

        const json = (await response.json()) as PokedexCatalogFile
        if (!isMounted) {
          return
        }

        setPokemonCatalog(json)
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Unknown error loading pokedex_catalog.json.'
        setLoadError(message)
      }
    }

    void loadPokemonCatalog()

    return () => {
      isMounted = false
    }
  }, [])

  const pokemonRecords = useMemo(
    () => (pokemonCatalog ? normalizePokemonCatalogData(pokemonCatalog) : []),
    [pokemonCatalog],
  )

  useEffect(() => {
    if (initialSelectedKey) {
      setQuery('')
    }
  }, [initialSelectedKey])

  const filteredPokemon = useMemo(() => {
    const cleaned = query.trim().toLowerCase()
    if (!cleaned) {
      return pokemonRecords
    }

    return pokemonRecords.filter((pokemon) => {
      const display = pokemon.displayName.toLowerCase()
      const key = pokemon.key.toLowerCase()
      const id = (formatPokemonId(pokemon.id) ?? '').toLowerCase()
      return display.includes(cleaned) || key.includes(cleaned) || id.includes(cleaned)
    })
  }, [pokemonRecords, query])

  const quickSearchMatches = useMemo(() => {
    if (query.trim().length === 0) {
      return []
    }

    return filteredPokemon.slice(0, 8)
  }, [filteredPokemon, query])

  useEffect(() => {
    if (filteredPokemon.length === 0) {
      return
    }

    setSelectedKey((currentSelectedKey) => {
      if (
        currentSelectedKey &&
        filteredPokemon.some((pokemon) => pokemon.key === currentSelectedKey)
      ) {
        return currentSelectedKey
      }

      if (initialSelectedKey) {
        const routeMatchedPokemon =
          findPokemonByRouteKey(initialSelectedKey, filteredPokemon) ??
          findPokemonByRouteKey(initialSelectedKey, pokemonRecords)

        if (routeMatchedPokemon) {
          return routeMatchedPokemon.key
        }
      }

      return filteredPokemon[0].key
    })
  }, [filteredPokemon, initialSelectedKey, pokemonRecords])

  const selectedPokemon = useMemo(() => {
    if (filteredPokemon.length === 0) {
      return null
    }

    return (
      filteredPokemon.find((pokemon) => pokemon.key === selectedKey) ??
      filteredPokemon[0]
    )
  }, [filteredPokemon, selectedKey])

  useEffect(() => {
    if (showListPage) {
      document.title = DEFAULT_TAB_TITLE
      return
    }

    if (selectedPokemon) {
      document.title = `${selectedPokemon.displayName} | ${DEFAULT_TAB_TITLE}`
      return
    }

    if (initialSelectedKey) {
      const fallbackName = toDisplayLabel(
        decodeURIComponent(initialSelectedKey).trim().replaceAll('-', '_'),
      )
      document.title = `${fallbackName} | ${DEFAULT_TAB_TITLE}`
      return
    }

    document.title = DEFAULT_TAB_TITLE
  }, [initialSelectedKey, selectedPokemon, showListPage])

  const selectedPokemonTypes = useMemo(() => {
    if (!selectedPokemon) {
      return []
    }

    return selectedPokemon.types
  }, [selectedPokemon])

  const selectedDefensiveMultipliers = useMemo(
    () => computeDefensiveMultiplierMap(selectedPokemonTypes),
    [selectedPokemonTypes],
  )

  function jumpToPokemon(key: string) {
    setSelectedKey(key)
    if (query.trim().length > 0) {
      setQuery('')
    }
  }

  function selectPokemonFromSearch(key: string) {
    setSelectedKey(key)
    setQuery('')
  }

  if (showListPage) {
    return (
      <main className="page-wrap px-4 pb-14 pt-10">
        <PokedexSearchCard
          actionLabel="Back to Search"
          actionTo="/"
          inputId={searchInputId}
          query={query}
          onQueryChange={setQuery}
        />

        {loadError ? <ErrorNotice message={loadError} /> : null}
        {!pokemonCatalog && !loadError ? <LoadingNotice /> : null}

        {pokemonCatalog ? (
          <PokemonListTable
            filteredPokemon={filteredPokemon}
            pokemonRecordsCount={pokemonRecords.length}
          />
        ) : null}
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 pb-14 pt-10">
      <PokedexSearchCard
        actionLabel="Open Full List"
        actionTo="/pokemon"
        inputId={searchInputId}
        query={query}
        onQueryChange={setQuery}
        quickMatches={quickSearchMatches}
        onQuickSelect={selectPokemonFromSearch}
      />

      {loadError ? <ErrorNotice message={loadError} /> : null}
      {!pokemonCatalog && !loadError ? <LoadingNotice /> : null}

      {pokemonCatalog ? (
        <section className="mt-7 space-y-5">
          {selectedPokemon ? (
            <>
              <PokemonSummaryCard
                selectedPokemon={selectedPokemon}
                selectedPokemonTypes={selectedPokemonTypes}
                pokemonRecords={pokemonRecords}
                onJumpToPokemon={jumpToPokemon}
              />

              <TypeDefensesCard
                selectedDefensiveMultipliers={selectedDefensiveMultipliers}
                selectedPokemonName={selectedPokemon.displayName}
                selectedPokemonTypes={selectedPokemonTypes}
              />

              <article className="grid gap-5 lg:grid-cols-3">
                <InfoCard pokemon={selectedPokemon} />
                <LearnSetCard pokemon={selectedPokemon} />
                <EggMovesCard pokemon={selectedPokemon} />
              </article>
            </>
          ) : (
            <NoResultsCard />
          )}
        </section>
      ) : null}
    </main>
  )
}
