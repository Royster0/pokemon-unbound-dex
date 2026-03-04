import { createFileRoute } from '@tanstack/react-router'
import { PokedexPage } from './index'

export const Route = createFileRoute('/pokemon')({
  component: PokemonListPage,
})

function PokemonListPage() {
  return <PokedexPage showListPage />
}
