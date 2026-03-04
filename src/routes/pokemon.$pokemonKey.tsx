import { createFileRoute } from '@tanstack/react-router'
import { PokedexPage } from '../features/pokedex/PokedexPage'

export const Route = createFileRoute('/pokemon/$pokemonKey')({
  component: PokemonDetailPage,
})

function PokemonDetailPage() {
  const { pokemonKey } = Route.useParams()
  const normalizedPokemonKey = decodeURIComponent(pokemonKey).toLowerCase()

  return <PokedexPage showListPage={false} initialSelectedKey={normalizedPokemonKey} />
}
