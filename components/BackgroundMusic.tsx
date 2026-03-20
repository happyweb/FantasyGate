'use client'

import { useEffect, useRef } from 'react'

const BGM_SRC = '/music/bgm.mp3'
const BGM_VOLUME = 0.12

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const shouldResumeRef = useRef(true)

  useEffect(() => {
    const audio = new Audio(BGM_SRC)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = BGM_VOLUME
    audioRef.current = audio

    const tryPlay = () => {
      const target = audioRef.current
      if (!target) return
      void target.play().catch(() => {
        // Autoplay may be blocked until first user interaction.
      })
    }

    const unlockByGesture = () => {
      const target = audioRef.current
      if (!target) return
      void target.play().then(removeUnlockListeners).catch(() => {
        // Keep listeners for next interaction.
      })
    }

    const unlockEvents: Array<keyof WindowEventMap> = ['pointerdown', 'touchstart', 'keydown']

    const removeUnlockListeners = () => {
      unlockEvents.forEach((eventName) => {
        globalThis.removeEventListener(eventName, unlockByGesture)
      })
    }

    const onVisibilityChange = () => {
      const target = audioRef.current
      if (!target) return

      if (document.hidden) {
        shouldResumeRef.current = !target.paused
        if (!target.paused) target.pause()
        return
      }

      if (shouldResumeRef.current) {
        void target.play().catch(() => {
          // Playback can still be blocked by browser policy.
        })
      }
    }

    const onPageHide = () => {
      const target = audioRef.current
      if (!target) return
      shouldResumeRef.current = !target.paused
      if (!target.paused) target.pause()
    }

    const onPageShow = () => {
      const target = audioRef.current
      if (!target) return
      if (shouldResumeRef.current) {
        void target.play().catch(() => {
          // Playback can still be blocked by browser policy.
        })
      }
    }

    tryPlay()
    unlockEvents.forEach((eventName) => {
      globalThis.addEventListener(eventName, unlockByGesture, { passive: true })
    })
    document.addEventListener('visibilitychange', onVisibilityChange)
    globalThis.addEventListener('pagehide', onPageHide)
    globalThis.addEventListener('pageshow', onPageShow)

    return () => {
      removeUnlockListeners()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      globalThis.removeEventListener('pagehide', onPageHide)
      globalThis.removeEventListener('pageshow', onPageShow)

      const target = audioRef.current
      if (target) {
        target.pause()
        target.currentTime = 0
        target.src = ''
      }
      audioRef.current = null
    }
  }, [])

  return null
}