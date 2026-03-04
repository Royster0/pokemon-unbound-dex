import { useEffect, useId, useMemo, useState } from 'react'
import { getPokemonTypesFromPokemonDb } from './pokemon-types'
import {
  EggMovesCard,
  ErrorNotice,
  EvolutionPathCard,
  LearnSetCard,
  LoadingNotice,
  NoResultsCard,
  PokedexSearchCard,
  PokemonListTable,
  PokemonSummaryCard,
  TypeDefensesCard,
} from './PokedexSections'
import type {
  EvolutionLink,
  PokedexPageProps,
  PokemonDataFile,
  PokemonTypeMap,
} from './types'
import {
  computeDefensiveMultiplierMap,
  getTypesForPokemon,
  normalizePokemonData,
} from './utils'

export function PokedexPage({ showListPage }: PokedexPageProps) {
  const [pokemonData, setPokemonData] = useState<PokemonDataFile | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pokemonTypes, setPokemonTypes] = useState<PokemonTypeMap>({})
  const [typeLoadError, setTypeLoadError] = useState<string | null>(null)
  const [hasLoadedTypes, setHasLoadedTypes] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedKey, setSelectedKey] = useState('')
  const searchInputId = useId()

  useEffect(() => {
    let isMounted = true

    async function loadPokemonData() {
      try {
        const response = await fetch('/pokemon_data.json')
        if (!response.ok) {
          throw new Error(`Could not load pokemon_data.json (status ${response.status}).`)
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
    if (query.trim().length === 0) {
      return []
    }

    return filteredPokemon.slice(0, 8)
  }, [filteredPokemon, query])

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
        {!pokemonData && !loadError ? <LoadingNotice /> : null}

        {pokemonData ? (
          <PokemonListTable
            filteredPokemon={filteredPokemon}
            pokemonRecordsCount={pokemonRecords.length}
            pokemonTypes={pokemonTypes}
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
      {!pokemonData && !loadError ? <LoadingNotice /> : null}

      {pokemonData ? (
        <section className="mt-7 space-y-5">
          {selectedPokemon ? (
            <>
              <PokemonSummaryCard
                hasLoadedTypes={hasLoadedTypes}
                selectedPokemon={selectedPokemon}
                selectedPokemonTypes={selectedPokemonTypes}
                typeLoadError={typeLoadError}
              />

              <article className="grid gap-5 lg:grid-cols-2">
                <EvolutionPathCard
                  evolutionFromLinks={evolutionFromLinks}
                  evolutionToLinks={evolutionToLinks}
                  onJumpToPokemon={jumpToPokemon}
                />
                <TypeDefensesCard
                  hasLoadedTypes={hasLoadedTypes}
                  selectedDefensiveMultipliers={selectedDefensiveMultipliers}
                  selectedPokemonName={selectedPokemon.displayName}
                  selectedPokemonTypes={selectedPokemonTypes}
                  typeLoadError={typeLoadError}
                />
              </article>

              <article className="grid gap-5 lg:grid-cols-2">
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
