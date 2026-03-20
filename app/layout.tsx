import type { Metadata, Viewport } from 'next'
import './globals.css'
import StoreBootstrap from '@/components/StoreBootstrap'
import BackgroundMusic from '@/components/BackgroundMusic'

export const metadata: Metadata = {
  title: '命运回廊：艾尔大陆传说',
  description: '在回合制征途中穿越五大战区，集齐传说套装并重燃封印，对抗终焉王庭的冥火亡潮。'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh">
      <body>
        <StoreBootstrap />
        <BackgroundMusic />
        {children}
      </body>
    </html>
  )
}
