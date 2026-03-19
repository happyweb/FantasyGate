import Image from 'next/image'

interface GameImageProps {
  src: string
  alt: string
  size?: number
  className?: string
  priority?: boolean
}

export default function GameImage({ src, alt, size = 40, className = '', priority = false }: Readonly<GameImageProps>) {
  return (
    <div
      style={{ width: size, height: size, position: 'relative' }}
      className={`game-image ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${size}px`}
        style={{ objectFit: 'contain', WebkitTouchCallout: 'none' }}
        draggable={false}
        onContextMenu={(event) => event.preventDefault()}
        onDragStart={(event) => event.preventDefault()}
        priority={priority}
      />
    </div>
  )
}
