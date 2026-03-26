'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface SafeImageProps {
  src?: string
  alt: string
  fallbackSrc?: string
  width?: number
  height?: number
  fill?: boolean
  sizes?: string
  className?: string
  style?: React.CSSProperties
  priority?: boolean
  draggable?: boolean
  onContextMenu?: React.MouseEventHandler<HTMLImageElement>
  onDragStart?: React.DragEventHandler<HTMLImageElement>
  onFallbackChange?: (hasFallenBack: boolean) => void
}

const DEFAULT_FALLBACK_SRC = '/logo/others/box.png'

const normalizeSource = (src: string | undefined, fallbackSrc: string) => {
  if (!src) return fallbackSrc
  const trimmed = src.trim()
  return trimmed.length > 0 ? trimmed : fallbackSrc
}

export default function SafeImage({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK_SRC,
  width,
  height,
  fill = false,
  sizes,
  className,
  style,
  priority = false,
  draggable = false,
  onContextMenu,
  onDragStart,
  onFallbackChange
}: Readonly<SafeImageProps>) {
  const normalizedSrc = normalizeSource(src, fallbackSrc)
  const startedFromFallback = normalizedSrc === fallbackSrc
  const [resolvedSrc, setResolvedSrc] = useState(normalizedSrc)
  const [hasFallenBack, setHasFallenBack] = useState(startedFromFallback)

  useEffect(() => {
    setResolvedSrc(normalizedSrc)
    setHasFallenBack(startedFromFallback)
  }, [normalizedSrc, startedFromFallback])

  useEffect(() => {
    onFallbackChange?.(hasFallenBack)
  }, [hasFallenBack, onFallbackChange])

  const handleError = () => {
    if (hasFallenBack) return
    setResolvedSrc(fallbackSrc)
    setHasFallenBack(true)
  }

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      sizes={sizes}
      className={className}
      style={style}
      priority={priority}
      unoptimized
      draggable={draggable}
      onError={handleError}
      onContextMenu={onContextMenu}
      onDragStart={onDragStart}
    />
  )
}