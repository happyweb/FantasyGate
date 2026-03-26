import { useState } from 'react'
import SafeImage from './SafeImage'

interface GameImageProps {
  src: string
  alt: string
  size?: number
  className?: string
  priority?: boolean
  showFallbackFrame?: boolean
}

export default function GameImage({
  src,
  alt,
  size = 40,
  className = '',
  priority = false,
  showFallbackFrame = true
}: Readonly<GameImageProps>) {
  const [isFallback, setIsFallback] = useState(false)

  return (
    <div
      style={{ width: size, height: size, position: 'relative' }}
      className={`game-image ${className}`}
    >
      {showFallbackFrame && isFallback && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: Math.max(10, Math.round(size * 0.22)),
            background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(240,224,192,0.16) 100%)',
            border: '1px solid rgba(255,255,255,0.22)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28)'
          }}
        />
      )}
      <SafeImage
        src={src}
        alt={alt}
        fill
        sizes={`${size}px`}
        style={{ objectFit: 'contain', WebkitTouchCallout: 'none' }}
        draggable={false}
        onContextMenu={(event) => event.preventDefault()}
        onDragStart={(event) => event.preventDefault()}
        priority={priority}
        onFallbackChange={setIsFallback}
      />
    </div>
  )
}
