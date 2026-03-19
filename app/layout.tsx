import type { Metadata } from 'next'
import './globals.css'
import StoreBootstrap from '@/components/StoreBootstrap'

export const metadata: Metadata = {
  title: '开局史莱姆',
  description: '回合制 RPG 小游戏',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh">
      <body>
        <StoreBootstrap />
        {children}
      </body>
    </html>
  )
}
