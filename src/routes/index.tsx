import { createFileRoute } from '@tanstack/react-router'
import { PokedexPage } from '../features/pokedex/PokedexPage'

export const Route = createFileRoute('/')({ component: HomeLookupPage })

function HomeLookupPage() {
  return <PokedexPage showListPage={false} />
}

export { PokedexPage }
