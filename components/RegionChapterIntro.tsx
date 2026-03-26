'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ASSETS } from '@/app/config/imageAssets'
import { getChapterIntroConfig } from '@/app/config/gameData'

interface RegionChapterIntroProps {
  cycle: number
  characterLevel?: number
  characterName?: string
  onEnter: () => void
  actionLabel?: string
}

export default function RegionChapterIntro({
  cycle,
  characterLevel = cycle,
  characterName = '远征者',
  onEnter,
  actionLabel
}: Readonly<RegionChapterIntroProps>) {
  const chapter = getChapterIntroConfig(cycle)
  const safeLevel = Math.min(Math.max(characterLevel, 1), ASSETS.players.length)
  const playerImage = ASSETS.players[safeLevel - 1]
  const regionLogo = ASSETS.plotStory[chapter.cycle - 1]
  const [isLeaving, setIsLeaving] = useState(false)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEnter = () => {
    if (isLeaving) return
    setIsLeaving(true)
    leaveTimerRef.current = setTimeout(() => {
      onEnter()
    }, 320)
  }

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current)
    }
  }, [])

  return (
    <div
      className="h-dvh px-4 py-4 flex items-center justify-center overflow-hidden transition-opacity duration-300 ease-out"
      style={{
        background: chapter.palette.background,
        position: 'relative',
        opacity: isLeaving ? 0 : 1
      }}
    >
      <div
        className="pointer-events-none absolute -top-16 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: chapter.palette.glow, opacity: 0.95 }}
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-14 h-52 w-52 rounded-full blur-3xl"
        style={{ background: chapter.palette.glow, opacity: 0.7 }}
      />
      <div
        className="pointer-events-none absolute -right-16 top-24 h-44 w-44 rounded-full blur-3xl"
        style={{ background: chapter.palette.glow, opacity: 0.78 }}
      />

      <div
        className="relative flex h-full max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-[28px] border p-4 transition-all duration-300 ease-out sm:p-5"
        style={{
          background: chapter.palette.panel,
          borderColor: chapter.palette.border,
          boxShadow: `0 24px 80px ${chapter.palette.glow}, inset 0 1px 0 rgba(255,255,255,0.7)`,
          transform: isLeaving ? 'translateY(10px) scale(0.985)' : 'translateY(0) scale(1)'
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40"
          style={{
            background: `linear-gradient(180deg, ${chapter.palette.glow} 0%, rgba(255,255,255,0) 100%)`,
            opacity: 0.8
          }}
        />

        <div className="relative z-10 flex h-full flex-col">
          <div>
            <div className="mb-3">
              <div
                className="type-label font-ui-bold uppercase tracking-[0.22em]"
                style={{ color: chapter.palette.accent }}
              >
                {chapter.chapterLabel}
              </div>
              <h1 className="type-page-title mt-1 font-bold text-slate-900">{chapter.title}</h1>
              <p className="type-meta mt-1 text-slate-600">{chapter.subtitle}</p>
            </div>

            <div
              className="relative overflow-hidden rounded-3xl border p-3"
              style={{
                borderColor: chapter.palette.border,
                background: 'linear-gradient(180deg, rgba(15,23,42,0.14) 0%, rgba(15,23,42,0.05) 100%)'
              }}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: `url(${regionLogo})`,
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '80%',
                  opacity: 0.16,
                  filter: 'blur(2px) saturate(0.72)',
                  transform: 'scale(1.04)'
                }}
              />

              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `linear-gradient(180deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0.18) 100%), radial-gradient(circle at 50% 34%, ${chapter.palette.glow} 0%, rgba(255,255,255,0) 68%)`,
                  mixBlendMode: 'screen',
                  opacity: 0.72
                }}
              />

              <div
                className="pointer-events-none absolute inset-x-3 inset-y-3 rounded-[20px]"
                style={{
                  border: '1px solid rgba(255,255,255,0.16)',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)'
                }}
              />

              <div
                className="pointer-events-none absolute inset-x-4 top-4 h-16 rounded-full blur-2xl"
                style={{ background: chapter.palette.glow }}
              />

              <div className="relative h-34 sm:h-38">
                <Image
                  src={regionLogo}
                  alt={chapter.title}
                  fill
                  priority
                  sizes="(max-width: 640px) 72vw, 280px"
                  style={{ objectFit: 'contain', objectPosition: 'center top' }}
                />
              </div>

              <div className="mt-2 flex items-center gap-5 rounded-2xl bg-white/55 px-3 py-2">
                <div className="relative h-13 w-10 shrink-0 self-center">
                  <Image
                    src={playerImage}
                    alt={characterName}
                    fill
                    priority
                    sizes="40px"
                    style={{ objectFit: 'contain', objectPosition: 'center bottom' }}
                  />
                </div>

                <div className="min-w-0 flex-1 self-center text-right">
                  <div className="type-micro tracking-[0.18em] text-slate-500">区域徽记</div>
                  <div className="type-card-title font-semibold text-slate-800">{chapter.subtitle}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {chapter.storyParagraphs.map((paragraph, index) => (
              <p
                key={`${chapter.cycle}-${index}`}
                className="type-body rounded-[22px] border px-4 py-3 text-slate-700"
                style={{
                  borderColor: chapter.palette.border,
                  background: index === 0 ? 'rgba(255,255,255,0.62)' : 'rgba(255,255,255,0.5)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.75)'
                }}
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="min-h-3 flex-1 sm:min-h-4" />

          <div className="pt-2">
            <Button
              onClick={handleEnter}
              className="h-13 w-full rounded-2xl border text-white type-panel-title font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: chapter.palette.button,
                borderColor: chapter.palette.border,
                boxShadow: `0 14px 30px ${chapter.palette.glow}, inset 0 1px 0 rgba(255,255,255,0.38)`,
                textShadow: '0 1px 2px rgba(0,0,0,0.28)'
              }}
            >
              {actionLabel || chapter.ctaLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}