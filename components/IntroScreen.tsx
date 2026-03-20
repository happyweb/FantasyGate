'use client'

import { useState } from 'react'
import GameImage from './GameImage'
import { ASSETS } from '@/app/config/imageAssets'
import { Button } from './ui/button'
import LightToast from './ui/light-toast'

interface IntroScreenProps {
  onStart: (playerName: string) => { success: boolean; message?: string }
}

const STORY_PARAGRAPHS = [
  '千年前，光明神以神躯化环，才把暗影魔王与冥火军团封在回廊深处。',
  '如今封印裂纹从雾原蔓延到王庭，五大战区相继失守。唯有重集传说套装，才能让封印纹阵再次闭合。',
  '你在前线营地醒来，手边只有一把旧剑与一枚未熄的徽印，却被委以整片大陆最后的进攻权。',
  '从雾原前线到终焉王庭，每一场胜利都会点亮一道封印纹。走到尽头的人，才有资格直面焚冠冥皇。'
]

const RANDOM_PLAYER_NAMES = [
  '莱昂斯',
  '奥瑞克',
  '加雷斯',
  '埃文斯',
  '罗南德',
  '凯尔德',
  '索兰迪',
  '格伦纳',
  '杜恩特',
  '博林格',
  '鲁格纳',
  '诺瓦克',
  '伊泽尔',
  '塞兰登',
  '迦南德',
  '马尔科',
  '雷蒙德',
  '基兰德',
  '阿尔文',
  '弗林特'
]

const pickRandomName = (exclude?: string): string => {
  if (!exclude) {
    return RANDOM_PLAYER_NAMES[Math.floor(Math.random() * RANDOM_PLAYER_NAMES.length)]
  }
  const pool = RANDOM_PLAYER_NAMES.filter(name => name !== exclude)
  if (pool.length === 0) return exclude
  return pool[Math.floor(Math.random() * pool.length)]
}

export default function IntroScreen({ onStart }: Readonly<IntroScreenProps>) {
  const [initialName] = useState(() => pickRandomName())
  const [suggestedName, setSuggestedName] = useState(initialName)
  const [playerName, setPlayerName] = useState(initialName)
  const [toastText, setToastText] = useState('')

  const handleRandomizeName = () => {
    const currentName = playerName.trim() || suggestedName
    const nextName = pickRandomName(currentName)
    setSuggestedName(nextName)
    setPlayerName(nextName)
  }

  const handleStart = () => {
    const name = playerName.trim() || suggestedName
    const result = onStart(name)
    if (!result.success) {
      setToastText(result.message || '无法开始，请检查输入。')
      setTimeout(() => setToastText(''), 1800)
    }
  }

  return (
    <div
      className="fixed inset-0 z-2000 flex flex-col items-center justify-between p-2.5 overflow-y-auto"
      style={{
        background: 'linear-gradient(180deg, #1a0a2e 0%, #2d1b4e 40%, #1a0a2e 100%)'
      }}
    >
      {/* 顶部图标 */}
      <div className="flex flex-col items-center pt-2.5">
        <div
          className="mb-2.5"
          style={{ animation: 'bounce-in-top 0.8s cubic-bezier(0.230, 1.000, 0.320, 1.000) both' }}
        >
          <GameImage src={ASSETS.ui.init} alt="命运回廊" size={120} priority />
        </div>
        <h1
          className="type-display font-bold text-amber-300 mb-1"
          style={{
            textShadow: '0 0 20px rgba(245,158,11,0.8), 0 2px 4px rgba(0,0,0,0.5)',
            animation: 'scale-up-center 0.5s cubic-bezier(0.390, 0.575, 0.565, 1.000) 0.3s both'
          }}
        >
          命运回廊
        </h1>
        <p
          className="type-meta text-amber-500/70 tracking-widest"
          style={{ animation: 'scale-up-center 0.5s ease 0.5s both' }}
        >
          — 艾尔大陆传说 —
        </p>
      </div>

      {/* 故事内容 */}
      <div className="w-full max-w-sm my-2.5 space-y-2">
        {STORY_PARAGRAPHS.map((para, i) => (
          <p
            key={`${i}-${para.slice(0, 8)}`}
            className="type-body-relaxed px-2"
            style={{
              animation: `scale-up-center 0.4s ease ${0.6 + i * 0.15}s both`,
              borderLeft: i === 1 ? '2px solid rgba(245,158,11,0.6)' : 'none',
              paddingLeft: i === 1 ? '10px' : '8px',
              color: i === 1 ? '#fcd34d' : '#f3f4f6'
            }}
          >
            {para}
          </p>
        ))}
      </div>

      {/* 输入框和开始按钮 */}
      <div
        className="w-full max-w-sm pb-2.5 space-y-4"
        style={{ animation: 'scale-up-center 0.5s cubic-bezier(0.390, 0.575, 0.565, 1.000) 1.2s both' }}
      >
        {/* 名字输入框 */}
        <div>
          <label htmlFor="player-name" className="type-card-title block text-amber-400 mb-2 text-center">请输入你的名字</label>
          <div className="relative">
            <input
              id="player-name"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={10}
              className="w-full h-12 px-2.5 text-center type-panel-title font-bold rounded-lg border-[1.5px] border-amber-300/50 bg-black/30 text-amber-100 placeholder-amber-700/50 focus:outline-none focus:border-amber-300 focus:bg-black/50 transition-all"
              style={{
                boxShadow: '0 0 12px rgba(245,158,11,0.2), inset 0 2px 4px rgba(0,0,0,0.3)'
              }}
            />
            <button
              type="button"
              onClick={handleRandomizeName}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-lg bg-black/22 hover:bg-black/30 active:scale-95 transition-all"
              style={{ boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.16), 0 1px 2px rgba(0,0,0,0.3)' }}
              aria-label="随机名字"
            >
              <GameImage src="/logo/others/dice.png" alt="随机名字" size={26} />
            </button>
          </div>
        </div>

        {/* 开始按钮 */}
        <Button
          onClick={handleStart}
          className="w-full h-12 type-panel-title font-bold border-[1.5px] border-amber-300 text-amber-900 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #f59e0b 100%)',
            boxShadow: '0 0 24px rgba(245,158,11,0.5), 0 4px 12px rgba(0,0,0,0.3), inset 0 2px 2px rgba(255,255,255,0.3)',
            textShadow: '0 1px 2px rgba(255,255,255,0.4)'
          }}
        >
          <GameImage src={ASSETS.ui.combat} alt="战斗" size={24} />
          开启征程
        </Button>
      </div>

      <LightToast message={toastText} zIndexClassName="z-2100" />
    </div>
  )
}
