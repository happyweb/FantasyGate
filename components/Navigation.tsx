'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ASSETS } from '@/app/config/imageAssets'
import GameImage from './GameImage'

export default function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: '战斗', icon: ASSETS.ui.combat },
    { href: '/shop', label: '商城', icon: ASSETS.ui.gold },
    { href: '/inventory', label: '背包', icon: ASSETS.ui.box },
    { href: '/skills', label: '技能', icon: ASSETS.ui.magicArts },
    { href: '/archive', label: '档案', icon: ASSETS.ui.record }
  ]

  return (
    <nav className="nav">
      {navItems.map(({ href, label, icon }) => (
        <Link key={href} href={href} className={pathname === href ? 'active' : ''}>
          <span className="icon">
            <GameImage src={icon} alt={label} size={32} showFallbackFrame={false} />
          </span>
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}
