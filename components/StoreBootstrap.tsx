'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

export default function StoreBootstrap() {
  const initializePersistence = useGameStore(state => state.initializePersistence)

  useEffect(() => {
    initializePersistence()
  }, [initializePersistence])

  return null
}