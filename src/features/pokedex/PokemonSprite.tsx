import { useEffect, useMemo, useState } from 'react'
import type { SpritePokemon } from './types'

type PokemonSpriteProps = {
  pokemon: SpritePokemon
  size: number
  className: string
}

type Rgb = {
  r: number
  g: number
  b: number
}

const processedSpriteCache = new Map<string, string>()
const processingSpriteCache = new Map<string, Promise<string>>()
const COLOR_MATCH_TOLERANCE_SQUARED = 16 * 16

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.crossOrigin = 'anonymous'

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load image source: ${source}`))
    image.src = source
  })
}

function getDominantBorderColor(data: Uint8ClampedArray, width: number, height: number): Rgb | null {
  if (width <= 0 || height <= 0) {
    return null
  }

  const colorCounts = new Map<number, number>()
  const countPixel = (x: number, y: number) => {
    const pixelIndex = (y * width + x) * 4
    const alpha = data[pixelIndex + 3]
    if (alpha < 8) {
      return
    }

    const r = data[pixelIndex]
    const g = data[pixelIndex + 1]
    const b = data[pixelIndex + 2]
    const packed = (r << 16) | (g << 8) | b
    colorCounts.set(packed, (colorCounts.get(packed) ?? 0) + 1)
  }

  for (let x = 0; x < width; x += 1) {
    countPixel(x, 0)
    if (height > 1) {
      countPixel(x, height - 1)
    }
  }

  for (let y = 1; y < height - 1; y += 1) {
    countPixel(0, y)
    if (width > 1) {
      countPixel(width - 1, y)
    }
  }

  let topColor: number | null = null
  let topCount = 0
  for (const [packedColor, count] of colorCounts.entries()) {
    if (count > topCount) {
      topColor = packedColor
      topCount = count
    }
  }

  if (topColor === null) {
    return null
  }

  return {
    r: (topColor >> 16) & 255,
    g: (topColor >> 8) & 255,
    b: topColor & 255,
  }
}

function isPixelNearColor(
  data: Uint8ClampedArray,
  pixelOffset: number,
  color: Rgb,
): boolean {
  const alpha = data[pixelOffset + 3]
  if (alpha < 8) {
    return false
  }

  const redDelta = data[pixelOffset] - color.r
  const greenDelta = data[pixelOffset + 1] - color.g
  const blueDelta = data[pixelOffset + 2] - color.b
  const distanceSquared = redDelta ** 2 + greenDelta ** 2 + blueDelta ** 2
  return distanceSquared <= COLOR_MATCH_TOLERANCE_SQUARED
}

function clearBorderConnectedColor(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  backgroundColor: Rgb,
): boolean {
  const totalPixels = width * height
  if (totalPixels === 0) {
    return false
  }

  const queue = new Uint32Array(totalPixels)
  const queued = new Uint8Array(totalPixels)
  let queueHead = 0
  let queueTail = 0

  const enqueueIfMatch = (pixelNumber: number) => {
    if (queued[pixelNumber] === 1) {
      return
    }

    const pixelOffset = pixelNumber * 4
    if (!isPixelNearColor(data, pixelOffset, backgroundColor)) {
      return
    }

    queued[pixelNumber] = 1
    queue[queueTail] = pixelNumber
    queueTail += 1
  }

  for (let x = 0; x < width; x += 1) {
    enqueueIfMatch(x)
    if (height > 1) {
      enqueueIfMatch((height - 1) * width + x)
    }
  }

  for (let y = 1; y < height - 1; y += 1) {
    enqueueIfMatch(y * width)
    if (width > 1) {
      enqueueIfMatch(y * width + (width - 1))
    }
  }

  if (queueTail === 0) {
    return false
  }

  while (queueHead < queueTail) {
    const pixelNumber = queue[queueHead]
    queueHead += 1

    const pixelOffset = pixelNumber * 4
    data[pixelOffset + 3] = 0

    const x = pixelNumber % width
    const y = Math.floor(pixelNumber / width)

    if (x > 0) {
      enqueueIfMatch(pixelNumber - 1)
    }
    if (x + 1 < width) {
      enqueueIfMatch(pixelNumber + 1)
    }
    if (y > 0) {
      enqueueIfMatch(pixelNumber - width)
    }
    if (y + 1 < height) {
      enqueueIfMatch(pixelNumber + width)
    }
  }

  return true
}

async function processSpriteWithColorKey(source: string): Promise<string> {
  if (source.startsWith('data:')) {
    return source
  }

  if (processedSpriteCache.has(source)) {
    return processedSpriteCache.get(source) as string
  }

  if (processingSpriteCache.has(source)) {
    return processingSpriteCache.get(source) as Promise<string>
  }

  const processingPromise = (async () => {
    try {
      const image = await loadImage(source)
      const width = image.naturalWidth
      const height = image.naturalHeight

      if (width <= 0 || height <= 0) {
        return source
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) {
        return source
      }

      context.imageSmoothingEnabled = false
      context.clearRect(0, 0, width, height)
      context.drawImage(image, 0, 0, width, height)

      let imageData: ImageData
      try {
        imageData = context.getImageData(0, 0, width, height)
      } catch {
        // Cross-origin image data can be blocked for canvas reads.
        return source
      }

      const backgroundColor = getDominantBorderColor(imageData.data, width, height)
      if (!backgroundColor) {
        return source
      }

      const changed = clearBorderConnectedColor(
        imageData.data,
        width,
        height,
        backgroundColor,
      )
      if (!changed) {
        return source
      }

      context.putImageData(imageData, 0, 0)
      return canvas.toDataURL('image/png')
    } catch {
      return source
    } finally {
      processingSpriteCache.delete(source)
    }
  })()

  processingSpriteCache.set(source, processingPromise)
  const processedSource = await processingPromise
  processedSpriteCache.set(source, processedSource)
  return processedSource
}

export function PokemonSprite({ pokemon, size, className }: PokemonSpriteProps) {
  const sources = useMemo(
    () => pokemon.spriteSources ?? [],
    [pokemon.spriteSources],
  )
  const [spriteState, setSpriteState] = useState<{ index: number; key: string }>({
    index: 0,
    key: pokemon.key,
  })

  const sourceIndex = spriteState.key === pokemon.key ? spriteState.index : 0

  const activeSource = sources[sourceIndex]
  const [displaySource, setDisplaySource] = useState<string | null>(activeSource ?? null)

  useEffect(() => {
    let cancelled = false

    if (!activeSource) {
      setDisplaySource(null)
      return () => {
        cancelled = true
      }
    }

    setDisplaySource(activeSource)

    void processSpriteWithColorKey(activeSource).then((processedSource) => {
      if (!cancelled) {
        setDisplaySource(processedSource)
      }
    })

    return () => {
      cancelled = true
    }
  }, [activeSource])

  if (!activeSource) {
    return (
      <div
        className={`inline-flex items-center justify-center pixel-art text-xs font-bold text-[var(--sea-ink-soft)] ${className}`}
        style={{ width: size, height: size }}
      >
        ?
      </div>
    )
  }

  return (
    <img
      src={displaySource ?? activeSource}
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
      className={`pixel-art ${className}`}
    />
  )
}
