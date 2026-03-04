import { useMemo, useState } from 'react'
import type { SpritePokemon } from './types'
import { buildSpriteSources } from './utils'

type PokemonSpriteProps = {
  pokemon: SpritePokemon
  size: number
  className: string
}

export function PokemonSprite({ pokemon, size, className }: PokemonSpriteProps) {
  const sources = useMemo(
    () => buildSpriteSources(pokemon.spriteSlug, pokemon.baseSlug),
    [pokemon.baseSlug, pokemon.spriteSlug],
  )
  const [spriteState, setSpriteState] = useState<{ index: number; key: string }>({
    index: 0,
    key: pokemon.key,
  })

  const sourceIndex = spriteState.key === pokemon.key ? spriteState.index : 0

  const activeSource = sources[sourceIndex]

  if (!activeSource) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.5)] text-xs font-bold text-[var(--sea-ink-soft)] ${className}`}
        style={{ width: size, height: size }}
      >
        ?
      </div>
    )
  }

  return (
    <img
      src={activeSource}
      alt={pokemon.displayName}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => {
        setSpriteState((previous) => {
          const currentIndex = previous.key === pokemon.key ? previous.index : 0
          return {
            index: currentIndex < sources.length ? currentIndex + 1 : currentIndex,
            key: pokemon.key,
          }
        })
      }}
      className={className}
    />
  )
}
