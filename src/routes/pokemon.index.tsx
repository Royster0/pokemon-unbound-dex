import { createFileRoute } from '@tanstack/react-router'
import { PokedexPage } from '../features/pokedex/PokedexPage'

export const Route = createFileRoute('/pokemon/')({
  component: PokemonListPage,
})

function PokemonListPage() {
  return <PokedexPage showListPage />
}
