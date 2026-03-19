'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import GameImage from '@/components/GameImage'
import { ASSETS } from '@/app/config/imageAssets'
import { CYCLE_CONFIG, EQUIPMENT_TIERS, MONSTER_DATA, getCycleColorByTier, getEquipmentGlowStyleByItem, getSkillEffectText } from '@/app/config/gameData'
import { useGameStore } from '@/store/gameStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import LightToast from '@/components/ui/light-toast'
import type { Skill } from '@/types/game'

const CODEX_TABS = [
  { id: 'players', label: '人物' },
  { id: 'monsters', label: '怪物' },
  { id: 'equipment', label: '装备' },
  { id: 'skills', label: '技能' },
  { id: 'consumables', label: '消耗品' },
] as const

const SKILL_IMAGE_MAP: Record<string, string> = {
  s1: ASSETS.ui.thump,
  s2: ASSETS.ui.medicine,
  s3: ASSETS.ui.rage,
  s4: ASSETS.ui.shield,
  s5: ASSETS.ui.frozen,
}

const SKILL_DISPLAY_ORDER = ['s1', 's2', 's5', 's3', 's4'] as const

const EQUIPMENT_LABELS: Record<'weapon' | 'armor' | 'helmet' | 'horse' | 'accessory', string> = {
  weapon: '武器',
  armor: '护甲',
  helmet: '头盔',
  horse: '坐骑',
  accessory: '饰品',
}

const CONSUMABLE_CODEX: Array<{ name: string; image: string; effect: string; description: string }> = [
  {
    name: '清凉西瓜',
    image: ASSETS.food.watermelon,
    effect: '恢复 100 点生命',
    description: '战后稳血补给。'
  },
  {
    name: '赤焰生命',
    image: ASSETS.food.largeHpPotion,
    effect: '恢复 80% 最大生命',
    description: '高压战局紧急续航。'
  },
  {
    name: '幽蓝魔力',
    image: ASSETS.food.largeMpPotion,
    effect: '恢复 80% 最大魔力',
    description: '快速重启法术循环。'
  },
]

const SPECIAL_WEAPON_CODEX = {
  name: '开荒破阵刃',
  image: ASSETS.cdk.vip666,
  effect: '攻击 +25',
  description: '面向新人的福利武器，帮助快速度过开荒阶段。'
}

const SPECIAL_WISH_CODEX = {
  name: '星潮愿望瓶',
  image: ASSETS.cdk.vip888,
  effect: '开启后随机获得 3 个消耗品或 500 金币',
  description: '来自回廊彼端的神秘祝福，命运会在瓶口打开时给出答案。'
}

type CodexDetail = {
  title: string
  subtitle: string
  image: string
  usage: string
  story: string
  extra?: string
}

const formatCheckpointTime = (value: string) => new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
}).format(new Date(value))

const AccordionToggleIcon = ({ open }: Readonly<{ open: boolean }>) => (
  <span className={`accordion-toggle-icon inline-flex h-5.5 w-5.5 items-center justify-center rounded-full border border-amber-200 bg-amber-50/80 text-amber-700 ${open ? 'is-open' : ''}`}>
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`accordion-toggle-arrow h-3.5 w-3.5 ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
)

export default function ArchivePage() {
  const {
    checkpoints,
    refreshCheckpoints,
    isHydrated,
    character,
    cycle,
    monsterIndex,
    skills,
    redeemCode,
    loadCheckpoint,
    deleteCheckpoint,
    startNewGame,
  } = useGameStore()

  const [activeTab, setActiveTab] = useState<(typeof CODEX_TABS)[number]['id']>('players')
  const [isAdventureOpen, setIsAdventureOpen] = useState(true)
  const [isCodexOpen, setIsCodexOpen] = useState(false)
  const [isRedeemOpen, setIsRedeemOpen] = useState(false)
  const [statusText, setStatusText] = useState('自动存档已启用，战斗进度会实时保存，退出后重进可继续冒险。')
  const [selectedCodex, setSelectedCodex] = useState<CodexDetail | null>(null)
  const [redeemCodeInput, setRedeemCodeInput] = useState('')
  const [toastText, setToastText] = useState('')
  const [newGameConfirmOpen, setNewGameConfirmOpen] = useState(false)
  const [saveElapsedText, setSaveElapsedText] = useState('')
  const [checkpointAction, setCheckpointAction] = useState<{ type: 'load' | 'delete'; id: string; title: string } | null>(null)
  const [redeemReward, setRedeemReward] = useState<{
    title: string
    story: string
    items?: Array<{ name: string; image?: string; attack?: number; description?: string }>
    gold?: number
  } | null>(null)
  const router = useRouter()

  const getEquipmentStatText = (type: keyof typeof EQUIPMENT_TIERS, item: any) => {
    if (type === 'weapon') return `攻击 +${item.attack}`
    if (type === 'horse') return `闪避 +${Math.round(item.evasionRate * 100)}%`
    if (type === 'accessory') return `暴击 +${Math.round(item.critRate * 100)}%`
    if (type === 'helmet') return `生命上限 +${item.maxHpBonus}`
    return `防御 +${item.defense}`
  }

  const getPlayerDetail = (index: number) => {
    const cycleInfo = CYCLE_CONFIG[index]
    return {
      title: cycleInfo.title,
      subtitle: `Lv.${index + 1} · ${cycleInfo.name}`,
      image: ASSETS.players[index],
      usage: `该等级代表当前成长阶段的位阶，进入更高 Lv. 后，角色基础生存与输出需求都会显著上升。`,
      story: `光明神留下的守护纹章会在每次进阶后再度亮起。勇者在 Lv.${index + 1} 时继承前序战痕，逐步接近封印裂隙的核心。`
    }
  }

  const getMonsterDetail = (index: number) => {
    const monster = MONSTER_DATA[index]
    const cycleTier = Math.min(
      Math.max(cycle, 1),
      Math.min(EQUIPMENT_TIERS.accessory.length, EQUIPMENT_TIERS.horse.length)
    )
    const cycleAccessory = EQUIPMENT_TIERS.accessory[cycleTier - 1] as { critRate?: number }
    const cycleHorse = EQUIPMENT_TIERS.horse[cycleTier - 1] as { evasionRate?: number }
    const monsterCritRate = (cycleAccessory.critRate || 0) * 0.5
    const monsterEvasionRate = (cycleHorse.evasionRate || 0) * 0.5
    return {
      title: monster.name,
      subtitle: `第${index + 1}关出现 · 攻${monster.attack} 防${monster.defense} 血${monster.hp} · 暴${Math.round(monsterCritRate * 100)}% 闪${Math.round(monsterEvasionRate * 100)}%`,
      image: ASSETS.monsters[index],
      usage: `用于提供阶段性挑战与资源产出，不同怪物决定了当前关卡更偏向抗压、生存或爆发。`,
      story: `${monster.name}受暗影裂隙污染而生，常驻于前线废墟。击败它们可夺回失落补给，维持王国防线。`
    }
  }

  const getEquipmentDetail = (type: keyof typeof EQUIPMENT_TIERS, item: any, index: number) => ({
    title: item.name,
    subtitle: `${EQUIPMENT_LABELS[type]} · Lv.${item.tier}`,
    image: ASSETS.equipment[type][index],
    usage: `${getEquipmentStatText(type, item)}，用于构建不同战斗流派。与技能搭配后可覆盖爆发、续航和容错。`,
    story: `${item.description || '这件装备由王国工坊与神殿共同锻造，用于对抗暗影军团。'}`
  })

  const getSkillDetail = (skill: Skill) => ({
    title: skill.name,
    subtitle: `Lv.${skill.level}/${skill.maxLevel}`,
    image: SKILL_IMAGE_MAP[skill.id],
    usage: `${getSkillEffectText(skill)}，蓝耗 ${skill.cost.mp}。合理穿插技能可显著提升回合收益。`,
    story: `${skill.description}。这些术式源自光明神殿的古籍，历经战场验证后成为勇者的核心战斗手段。`
  })

  const getConsumableDetail = (item: (typeof CONSUMABLE_CODEX)[number]) => ({
    title: item.name,
    subtitle: item.effect,
    image: item.image,
    usage: `${item.effect}。适合在关键回合兜底，避免节奏断档。`,
    story: `${item.name}来自艾尔大陆补给体系。王国后勤会将其封装后送往前线，保障勇者能持续推进封印战线。`
  })

  const getSpecialWeaponDetail = () => ({
    title: SPECIAL_WEAPON_CODEX.name,
    subtitle: `特殊武器 · ${SPECIAL_WEAPON_CODEX.effect}`,
    image: SPECIAL_WEAPON_CODEX.image,
    usage: `兑换码 vip666 专属福利。${SPECIAL_WEAPON_CODEX.effect}，可显著降低前期开荒压力。`,
    story: '王都军备署将这把武器列为新兵特供。它不追求华丽符文，只追求每一次挥砍都足够有效。'
  })

  const getSpecialWishDetail = () => ({
    title: SPECIAL_WISH_CODEX.name,
    subtitle: '特殊消耗品 · 命运奖励',
    image: SPECIAL_WISH_CODEX.image,
    usage: `兑换码 vip888 专属奖励。${SPECIAL_WISH_CODEX.effect}。`,
    story: '古老传说中，星潮退去时会留下这种愿望瓶。它不会回答问题，只会直接给出结果。'
  })

  const handleRedeem = () => {
    const result = redeemCode(redeemCodeInput)
    if (result.success && result.reward) {
      setToastText(result.message)
      setRedeemReward(result.reward)
      setRedeemCodeInput('')
      return
    }

    setToastText(result.message)
  }

  useEffect(() => {
    if (!isHydrated) return
    refreshCheckpoints()
  }, [isHydrated, refreshCheckpoints])

  useEffect(() => {
    if (!toastText) return
    const timer = setTimeout(() => setToastText(''), 1800)
    return () => clearTimeout(timer)
  }, [toastText])

  if (!isHydrated) {
    return <div className="px-2.5 pt-6 text-center text-sm text-amber-700">正在载入档案馆...</div>
  }

  const getElapsedFromLastSave = () => {
    if (globalThis.window === undefined) return '刚刚'
    const raw = globalThis.window.localStorage.getItem('paly-auto-save')
    if (!raw) return '刚刚'
    try {
      const parsed = JSON.parse(raw) as { lastSavedAt?: string }
      if (!parsed.lastSavedAt) return '刚刚'
      const diff = Math.max(0, Date.now() - new Date(parsed.lastSavedAt).getTime())
      const mins = Math.floor(diff / 60000)
      if (mins < 1) return '不到1分钟'
      if (mins < 60) return `${mins}分钟`
      const hours = Math.floor(mins / 60)
      if (hours < 24) return `${hours}小时${mins % 60}分钟`
      const days = Math.floor(hours / 24)
      return `${days}天${hours % 24}小时`
    } catch {
      return '刚刚'
    }
  }

  const handleOpenNewGameConfirm = () => {
    setSaveElapsedText(getElapsedFromLastSave())
    setNewGameConfirmOpen(true)
  }

  const handleConfirmNewGame = () => {
    startNewGame()
    setNewGameConfirmOpen(false)
    setStatusText('已创建新游戏，正在进入命运回廊首屏。')
    router.push('/')
  }

  const handleLoadCheckpoint = (checkpointId: string) => {
    const ok = loadCheckpoint(checkpointId)
    setToastText(ok ? '已载入该存档。' : '载入失败，请稍后重试。')
    if (ok) router.push('/')
  }

  const handleDeleteCheckpoint = (checkpointId: string) => {
    const ok = deleteCheckpoint(checkpointId)
    setToastText(ok ? '该历史存档已删除。' : '删除失败，请稍后重试。')
  }

  const handleConfirmCheckpointAction = () => {
    if (!checkpointAction) return
    if (checkpointAction.type === 'load') {
      handleLoadCheckpoint(checkpointAction.id)
    } else {
      handleDeleteCheckpoint(checkpointAction.id)
    }
    setCheckpointAction(null)
  }

  return (
    <div className="ui-page-stack ui-page-with-nav px-2.5 pt-2.5 pb-2.5">
      <Card
        className="ui-panel-card ui-section-gap"
        style={{ boxShadow: '0 4px 12px rgba(200,150,80,0.2), inset 0 1px 2px rgba(255,255,255,0.9)' }}
      >
        <CardContent className="ui-panel-body">
          <button
            onClick={() => setIsAdventureOpen(v => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="type-card-title font-semibold text-amber-800">冒险存档</div>
            <AccordionToggleIcon open={isAdventureOpen} />
          </button>

          {isAdventureOpen && (
            <>
              <div className="flex items-center justify-between gap-3 mt-3 mb-3">
                <div>
                  <p className="type-card-title font-bold text-amber-800">{character.playerName || character.name}</p>
                  <p className="type-body text-gray-600 mt-0.5">Lv.{character.level} · 第{monsterIndex + 1}关</p>
                </div>
                <Button
                  onClick={handleOpenNewGameConfirm}
                  className="type-body px-2.5 py-1.5 h-auto bg-linear-to-r from-red-400 to-orange-400 text-white border-[1.5px] border-red-300 shrink-0"
                >
                  新游戏
                </Button>
              </div>

              {statusText !== '自动存档已启用，战斗进度会实时保存，退出后重进可继续冒险。' && (
                <div className="type-body mb-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-amber-700">
                  {statusText}
                </div>
              )}

              <div className="type-meta text-amber-600 mb-1.5">历史存档</div>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {checkpoints.length === 0 && (
                  <div className="type-body rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-amber-700">
                    你的回廊碑刻尚未点亮。通关当前章节后，将自动刻下第一枚存档印记。
                  </div>
                )}
                {checkpoints.map((node) => (
                  <div key={node.id} className="rounded-lg border border-amber-100 bg-amber-50/40 px-2.5 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="type-body font-semibold text-amber-700">{node.playerName}（Lv.{node.cycle} 记录）</div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          onClick={() => setCheckpointAction({ type: 'delete', id: node.id, title: `${node.playerName}（Lv.${node.cycle} 记录）` })}
                          className="type-meta px-2 py-1 h-auto bg-linear-to-r from-red-400 to-orange-400 text-white border border-red-300"
                        >
                          删除
                        </Button>
                        <Button
                          onClick={() => setCheckpointAction({ type: 'load', id: node.id, title: `${node.playerName}（Lv.${node.cycle} 记录）` })}
                          className="type-meta px-2 py-1 h-auto bg-linear-to-r from-sky-400 to-cyan-300 text-white border border-sky-300"
                        >
                          载入游戏
                        </Button>
                      </div>
                    </div>
                    <div className="type-meta text-gray-600 mt-0.5">Lv.{node.level} · 金币 {node.gold}</div>
                    <div className="type-meta text-gray-500 mt-0.5">{formatCheckpointTime(node.createdAt)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card
        className="ui-panel-card ui-section-gap"
        style={{ boxShadow: '0 4px 12px rgba(200,150,80,0.2), inset 0 1px 2px rgba(255,255,255,0.9)' }}
      >
        <CardContent className="ui-panel-body">
          <button
            onClick={() => setIsCodexOpen(v => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="type-card-title font-semibold text-amber-800">图鉴</div>
            <AccordionToggleIcon open={isCodexOpen} />
          </button>

          {isCodexOpen && (
            <div className="mt-2">
              <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {CODEX_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 type-body px-3 py-1.5 rounded-full border transition-all ${activeTab === tab.id ? 'bg-linear-to-r from-amber-400 to-yellow-300 text-white border-amber-300' : 'bg-white/80 border-amber-200 text-amber-700'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <LightToast message={toastText} />

      {newGameConfirmOpen && (
        <div
          className="fixed inset-0 bg-black/55 flex items-center justify-center z-1000 px-3"
          onClick={() => setNewGameConfirmOpen(false)}
        >
          <Card
            className="w-full max-w-90 border-[1.5px] border-amber-300"
            style={{
              background: 'linear-gradient(180deg, #fef9f0 0%, #fef3e2 100%)',
              boxShadow: '0 12px 32px rgba(245,158,11,0.32), inset 0 2px 4px rgba(255,255,255,0.9)',
              animation: 'scale-up-center 0.2s ease-out both'
            }}
            onClick={e => e.stopPropagation()}
          >
            <CardContent className="p-4">
              <h3 className="type-panel-title font-bold text-gray-800">确认开启新游戏？</h3>
              <p className="type-body text-gray-700 leading-relaxed mt-2 mb-3">
                你将放弃当前活跃进度。距离上次自动存档已过去 {saveElapsedText}。
              </p>
              <div className="flex gap-2">
                <Button
                  className="flex-1 border border-red-300 bg-linear-to-r from-red-400 to-orange-400 text-white"
                  onClick={handleConfirmNewGame}
                >
                  确认放弃
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {checkpointAction && (
        <div
          className="fixed inset-0 bg-black/55 flex items-center justify-center z-1000 px-3"
          onClick={() => setCheckpointAction(null)}
        >
          <Card
            className="w-full max-w-90 border-[1.5px] border-amber-300"
            style={{
              background: 'linear-gradient(180deg, #fef9f0 0%, #fef3e2 100%)',
              boxShadow: '0 12px 32px rgba(245,158,11,0.32), inset 0 2px 4px rgba(255,255,255,0.9)',
              animation: 'scale-up-center 0.2s ease-out both'
            }}
            onClick={e => e.stopPropagation()}
          >
            <CardContent className="p-4">
              <h3 className="type-panel-title font-bold text-gray-800">{checkpointAction.type === 'load' ? '确认载入存档？' : '确认删除存档？'}</h3>
              <p className="type-body text-gray-700 leading-relaxed mt-2 mb-3">
                {checkpointAction.type === 'load' ? '将切换到以下进度：' : '删除后不可恢复：'} {checkpointAction.title}
              </p>
              <Button
                className={`w-full border text-white ${checkpointAction.type === 'load' ? 'border-sky-300 bg-linear-to-r from-sky-400 to-cyan-300' : 'border-red-300 bg-linear-to-r from-red-400 to-orange-400'}`}
                onClick={handleConfirmCheckpointAction}
              >
                {checkpointAction.type === 'load' ? '确认载入' : '确认删除'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {isCodexOpen && activeTab === 'players' && (
        <div className="grid grid-cols-2 ui-grid-gap ui-section-gap">
          {CYCLE_CONFIG.map((cycleInfo, index) => (
            <Card
              key={cycleInfo.name}
              className="ui-panel-card cursor-pointer transition-transform hover:scale-[1.01]"
              style={{ boxShadow: '0 3px 10px rgba(0,0,0,0.06)' }}
              onClick={() => setSelectedCodex(getPlayerDetail(index))}
            >
              <CardContent className="p-2.5 text-center">
                <div className="flex justify-center mb-2"><GameImage src={ASSETS.players[index]} alt={cycleInfo.title} size={76} /></div>
                <div className="type-body font-ui-bold" style={{ color: cycleInfo.color }}>{cycleInfo.title}</div>
                <div className="type-meta text-secondary-ui mt-1">Lv.{index + 1}</div>
                <div className="type-micro text-muted-ui mt-1">难度：{cycleInfo.name} · 强度倍率 {cycleInfo.multiplier}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isCodexOpen && activeTab === 'monsters' && (
        <div className="grid grid-cols-2 ui-grid-gap ui-section-gap">
          {MONSTER_DATA.map((monster, index) => (
            <Card
              key={monster.name}
              className="ui-panel-card cursor-pointer transition-transform hover:scale-[1.01]"
              style={{ boxShadow: '0 3px 10px rgba(0,0,0,0.06)' }}
              onClick={() => setSelectedCodex(getMonsterDetail(index))}
            >
              <CardContent className="p-2.5 text-center">
                <div className="flex justify-center mb-2"><GameImage src={ASSETS.monsters[index]} alt={monster.name} size={72} /></div>
                <div className="type-body font-ui-bold text-strong">{monster.name}</div>
                <div className="type-meta text-primary-ui mt-1">第{index + 1}关出现</div>
                <div className="type-micro text-muted-ui mt-1">HP {monster.hp} · 攻击 {monster.attack} · 防御 {monster.defense}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isCodexOpen && activeTab === 'equipment' && (
        <div className="space-y-2.5 mb-2.5">
          {(Object.entries(EQUIPMENT_TIERS) as Array<[keyof typeof EQUIPMENT_TIERS, Array<any>]>).map(([type, items]) => (
            <Card key={type} className="ui-panel-card" style={{ boxShadow: '0 3px 10px rgba(0,0,0,0.06)' }}>
              <CardContent className="p-2.5">
                <div className="type-body font-ui-bold text-primary-ui mb-2">{EQUIPMENT_LABELS[type]}</div>
                <div className="grid grid-cols-2 gap-2">
                  {items.map((item, index) => {
                    const image = ASSETS.equipment[type][index]
                    const statText = getEquipmentStatText(type, item)

                    return (
                      <div
                        key={item.name}
                        className="rounded-xl border border-amber-100 bg-amber-50/50 p-1.5 text-center cursor-pointer transition-transform hover:scale-[1.01]"
                        onClick={() => setSelectedCodex(getEquipmentDetail(type, item, index))}
                      >
                        <div className="flex justify-center mb-1.5">
                          <div style={getEquipmentGlowStyleByItem(item)}>
                            <GameImage src={image} alt={item.name} size={56} />
                          </div>
                        </div>
                        <div className="type-meta font-ui-semibold" style={{ color: getCycleColorByTier(item.tier) }}>{item.name}</div>
                        <div className="type-micro text-primary-ui mt-1">Lv.{item.tier} · {statText}</div>
                      </div>
                    )
                  })}
                  {type === 'weapon' && (
                    <div
                      className="relative rounded-xl border border-amber-200 bg-amber-50/70 p-2 text-center cursor-pointer transition-transform hover:scale-[1.01]"
                      onClick={() => setSelectedCodex(getSpecialWeaponDetail())}
                    >
                      <span className="absolute top-1 right-1 type-micro px-1.5 py-0.5 rounded-full bg-amber-500 text-white">特殊</span>
                      <div className="flex justify-center mb-1.5"><GameImage src={SPECIAL_WEAPON_CODEX.image} alt={SPECIAL_WEAPON_CODEX.name} size={56} /></div>
                      <div className="type-meta font-ui-semibold text-strong">{SPECIAL_WEAPON_CODEX.name}</div>
                      <div className="type-micro text-primary-ui mt-1">{SPECIAL_WEAPON_CODEX.effect}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isCodexOpen && activeTab === 'skills' && (
        <div className="grid ui-grid-gap ui-section-gap">
          {SKILL_DISPLAY_ORDER.map(skillId => {
            const skill = skills.find(s => s.id === skillId)
            if (!skill) return null

            return (
            <Card
              key={skill.id}
              className="ui-panel-card cursor-pointer transition-transform hover:scale-[1.01]"
              style={{ boxShadow: '0 3px 10px rgba(0,0,0,0.06)' }}
              onClick={() => setSelectedCodex(getSkillDetail(skill))}
            >
              <CardContent className="p-2.5 flex items-start gap-2.5">
                <div className="ui-card-icon bg-amber-50 border border-amber-200">
                  <GameImage src={SKILL_IMAGE_MAP[skill.id]} alt={skill.name} size={40} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="type-body font-ui-bold text-strong">{skill.name}</div>
                    <span className="type-micro px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Lv.{skill.level}/{skill.maxLevel}</span>
                  </div>
                  <div className="type-meta text-secondary-ui leading-relaxed">{skill.description}</div>
                  <div className="type-micro text-primary-ui mt-2">{getSkillEffectText(skill)}</div>
                  <div className="type-micro text-blue-500 mt-1">蓝耗 {skill.cost.mp}</div>
                </div>
              </CardContent>
            </Card>
            )
          })}
        </div>
      )}

      {isCodexOpen && activeTab === 'consumables' && (
        <div className="grid ui-grid-gap ui-section-gap">
          {CONSUMABLE_CODEX.map(item => (
            <Card
              key={item.name}
              className="ui-panel-card cursor-pointer transition-transform hover:scale-[1.01]"
              style={{ boxShadow: '0 3px 10px rgba(0,0,0,0.06)' }}
              onClick={() => setSelectedCodex(getConsumableDetail(item))}
            >
              <CardContent className="p-2.5 flex items-start gap-2.5">
                <div className="ui-card-icon bg-emerald-50 border border-emerald-200">
                  <GameImage src={item.image} alt={item.name} size={42} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="type-body font-ui-bold text-strong">{item.name}</div>
                  <div className="type-micro text-emerald-700 mt-1">{item.effect}</div>
                  <div className="type-meta text-secondary-ui leading-relaxed mt-1">{item.description}</div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Card
            className="ui-panel-card cursor-pointer transition-transform hover:scale-[1.01]"
            style={{ boxShadow: '0 3px 10px rgba(0,0,0,0.06)' }}
            onClick={() => setSelectedCodex(getSpecialWishDetail())}
          >
            <CardContent className="p-2.5 flex items-start gap-2.5 relative">
              <span className="absolute top-2.5 right-2.5 type-micro px-1.5 py-0.5 rounded-full bg-amber-500 text-white">特殊</span>
              <div className="ui-card-icon bg-amber-50 border border-amber-200">
                <GameImage src={SPECIAL_WISH_CODEX.image} alt={SPECIAL_WISH_CODEX.name} size={42} />
              </div>
              <div className="min-w-0 flex-1 pr-8">
                <div className="type-body font-ui-bold text-strong">{SPECIAL_WISH_CODEX.name}</div>
                <div className="type-micro text-primary-ui mt-1">{SPECIAL_WISH_CODEX.effect}</div>
                <div className="type-meta text-secondary-ui leading-relaxed mt-1">{SPECIAL_WISH_CODEX.description}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card
        className="ui-panel-card ui-section-gap"
        style={{ boxShadow: '0 4px 12px rgba(200,150,80,0.2), inset 0 1px 2px rgba(255,255,255,0.9)' }}
      >
        <CardContent className="ui-panel-body">
          <button
            onClick={() => setIsRedeemOpen(v => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="type-card-title font-semibold text-amber-800">兑换码</div>
            <AccordionToggleIcon open={isRedeemOpen} />
          </button>

          {isRedeemOpen && (
            <div className="mt-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5 mb-2.5">
                <p className="type-body text-gray-700 leading-relaxed">
                  回廊补给官偶尔会放出神秘礼包。输入兑换码后可直接发放到背包，部分道具会改变你的开荒节奏。
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  value={redeemCodeInput}
                  onChange={(e) => setRedeemCodeInput(e.target.value)}
                  placeholder="输入兑换码"
                  className="type-body flex-1 rounded-lg border border-amber-200 bg-white/90 px-2.5 py-2 outline-none focus:border-amber-400"
                />
                <Button
                  onClick={handleRedeem}
                  className="type-body px-3 py-2 h-auto bg-linear-to-r from-amber-400 to-yellow-300 text-amber-900 border-[1.5px] border-amber-300"
                >
                  领取
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {redeemReward && (
        <div
          className="fixed inset-0 bg-black/55 flex items-center justify-center z-1000 px-3"
          onClick={() => setRedeemReward(null)}
        >
          <Card
            className="w-full max-w-90 border-[1.5px] border-amber-300"
            style={{
              background: 'linear-gradient(180deg, #fef9f0 0%, #fef3e2 100%)',
              boxShadow: '0 12px 32px rgba(245,158,11,0.32), inset 0 2px 4px rgba(255,255,255,0.9)',
              animation: 'scale-up-center 0.2s ease-out both'
            }}
            onClick={e => e.stopPropagation()}
          >
            <CardContent className="p-4">
              <h3 className="type-panel-title font-bold text-gray-800">{redeemReward.title}</h3>
              <p className="type-body text-gray-700 leading-relaxed mt-2 mb-3">{redeemReward.story}</p>

              {redeemReward.items && redeemReward.items.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 mb-2.5">
                  <div className="type-meta font-semibold text-amber-700 mb-2">获得物品</div>
                  <div className="space-y-1.5">
                    {redeemReward.items.map((item, index) => (
                      <div key={`${item.name}-${index}`} className="flex items-center gap-2">
                        <GameImage src={item.image || ASSETS.ui.chest} alt={item.name} size={40} />
                        <span className="type-body text-gray-700">{item.name}{item.attack ? ` · 攻击 +${item.attack}` : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {redeemReward.gold ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 mb-2.5 flex items-center gap-2">
                  <GameImage src={ASSETS.ui.gold} alt="金币" size={40} />
                  <span className="type-card-title font-semibold text-amber-700">金币 +{redeemReward.gold}</span>
                </div>
              ) : null}

              <Button
                className="w-full border-[1.5px] border-amber-300 bg-linear-to-r from-amber-400 to-yellow-300 text-amber-900"
                onClick={() => setRedeemReward(null)}
              >
                关闭
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedCodex && (
        <div
          className="fixed inset-0 bg-black/55 flex items-center justify-center z-1000 px-3"
          onClick={() => setSelectedCodex(null)}
        >
          <Card
            className="w-full max-w-90 border-[1.5px] border-amber-300"
            style={{
              background: 'linear-gradient(180deg, #fef9f0 0%, #fef3e2 100%)',
              boxShadow: '0 12px 32px rgba(245,158,11,0.32), inset 0 2px 4px rgba(255,255,255,0.9)',
              animation: 'scale-up-center 0.2s ease-out both'
            }}
            onClick={e => e.stopPropagation()}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-14 h-14 rounded-xl border border-amber-200 bg-amber-50 flex items-center justify-center shrink-0">
                  <GameImage src={selectedCodex.image} alt={selectedCodex.title} size={44} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="type-panel-title font-bold text-gray-800 leading-snug">{selectedCodex.title}</h3>
                  <p className="type-meta text-amber-600 mt-1">{selectedCodex.subtitle}</p>
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 mb-2.5">
                <p className="type-body text-gray-700 leading-relaxed">{selectedCodex.usage}</p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-white/70 p-2.5 mb-3">
                <div className="type-meta font-semibold text-amber-700 mb-1">背景故事</div>
                <p className="type-body text-gray-700 leading-relaxed">{selectedCodex.story}</p>
              </div>

              <Button
                className="w-full border-[1.5px] border-amber-300 bg-linear-to-r from-amber-400 to-yellow-300 text-amber-900"
                onClick={() => setSelectedCodex(null)}
              >
                关闭
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Navigation />
    </div>
  )
}