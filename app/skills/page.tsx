'use client'

import { useState } from 'react'
import type { Skill } from '@/types/game'
import { useGameStore } from '@/store/gameStore'
import Navigation from '@/components/Navigation'
import GameImage from '@/components/GameImage'
import { ASSETS } from '@/app/config/imageAssets'
import { getSkillEffectText } from '@/app/config/gameData'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const SKILL_DISPLAY_ORDER = ['s1', 's2', 's5', 's3', 's4'] as const

const SKILL_IMAGE_MAP: Record<string, string> = {
  s1: ASSETS.ui.thump,
  s2: ASSETS.ui.medicine,
  s3: ASSETS.ui.rage,
  s4: ASSETS.ui.defense,
  s5: ASSETS.ui.frozen,
}

const SKILL_COLOR_MAP: Record<string, { bg: string; border: string; badge: string; barOuter: string }> = {
  s1: { bg: 'from-orange-300 to-amber-300', border: 'border-orange-100', badge: 'bg-amber-100 text-amber-800', barOuter: 'bg-orange-50 border-orange-200' },
  s2: { bg: 'from-emerald-300 to-teal-300', border: 'border-emerald-100', badge: 'bg-emerald-100 text-emerald-800', barOuter: 'bg-emerald-50 border-emerald-200' },
  s5: { bg: 'from-blue-300 to-indigo-300', border: 'border-blue-100', badge: 'bg-blue-100 text-blue-800', barOuter: 'bg-blue-50 border-blue-200' },
  s3: { bg: 'from-purple-300 to-violet-300', border: 'border-purple-100', badge: 'bg-violet-100 text-violet-800', barOuter: 'bg-purple-50 border-purple-200' },
  s4: { bg: 'from-sky-300 to-cyan-300', border: 'border-sky-100', badge: 'bg-sky-100 text-sky-800', barOuter: 'bg-sky-50 border-sky-200' },
}

export default function SkillsPage() {
  const { skills, character, upgradeSkill, isHydrated } = useGameStore()
  const orderedSkills = SKILL_DISPLAY_ORDER.map(skillId => skills.find(s => s.id === skillId)).filter(Boolean) as Skill[]
  const [pendingUpgrade, setPendingUpgrade] = useState<{ skillId: string; cost: number } | null>(null)
  const pendingSkill = pendingUpgrade ? orderedSkills.find(s => s.id === pendingUpgrade.skillId) : null
  const pendingColor = pendingSkill ? SKILL_COLOR_MAP[pendingSkill.id] : SKILL_COLOR_MAP.s1
  const pendingSkillImg = pendingSkill ? SKILL_IMAGE_MAP[pendingSkill.id] : SKILL_IMAGE_MAP.s1

  if (!isHydrated) {
    return <div className="px-2.5 pt-6 text-center text-sm text-amber-700">正在载入存档...</div>
  }

  const getNextLevelDesc = (skill: Skill) => {
    const nextSkill: Skill = {
      ...skill,
      level: Math.min(skill.maxLevel, skill.level + 1),
      cost: { ...skill.cost },
      effect: { ...skill.effect }
    }
    return getSkillEffectText(nextSkill)
  }

  const handleUpgrade = () => {
    if (!pendingUpgrade) return
    upgradeSkill(pendingUpgrade.skillId)
    setPendingUpgrade(null)
  }

  return (
    <div className="ui-page-stack ui-page-with-nav px-2.5 pt-2.5 pb-2.5">

      {/* 顶部：金币 + 提示 */}
      <Card
        className="mb-2.5 border-[1.5px] border-amber-100"
        style={{ boxShadow: '0 4px 12px rgba(200,150,80,0.2), inset 0 1px 2px rgba(255,255,255,0.9)' }}
      >
        <CardContent className="p-2.5 flex items-center justify-between">
          <div className="type-body flex items-center gap-1.5 text-amber-600/70">
            💡 战斗获得金币后可升级技能
          </div>
          <div className="type-panel-title flex items-center gap-1 font-bold text-amber-700">
            <GameImage src={ASSETS.ui.gold} alt="金币" size={18} />
            {character.gold}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {orderedSkills.map((skill) => {
          const upgradeCost = skill.cost.gold * skill.level
          const canUpgrade = skill.level < skill.maxLevel && character.gold >= upgradeCost
          const isMaxLevel = skill.level >= skill.maxLevel
          const color = SKILL_COLOR_MAP[skill.id]
          const skillImg = SKILL_IMAGE_MAP[skill.id]
          const effectLabel = getSkillEffectText(skill)

          return (
            <Card
              key={skill.id}
              className={`border-[1.5px] ${color.border}`}
              style={{ boxShadow: '0 3px 8px rgba(0,0,0,0.06), inset 0 1px 2px rgba(255,255,255,0.8)' }}
            >
              <CardContent className="p-2.5">
                <div className="flex items-center gap-3">
                  {/* 技能图片 */}
                  <div
                    className={`w-14 h-14 rounded-xl bg-linear-to-br ${color.bg} flex items-center justify-center shrink-0`}
                    style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.5)' }}
                  >
                    <GameImage src={skillImg} alt={skill.name} size={44} />
                  </div>

                  {/* 技能信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="type-body font-ui-bold text-strong">{skill.name}</h3>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${color.badge}`}>
                        Lv.{skill.level}/{skill.maxLevel}
                      </span>
                    </div>
                    <div className="type-meta text-secondary-ui mb-0.5">{skill.description}</div>
                    <div className="type-micro text-muted-ui">
                      效果: {effectLabel}
                      <span className="ml-2 text-blue-500">蓝耗:{skill.cost.mp}</span>
                    </div>
                  </div>

                  {/* 升级按钮 */}
                  <div className="shrink-0 text-right">
                    {isMaxLevel ? (
                      <div className="type-meta text-primary-ui font-ui-bold px-2 py-1 bg-amber-50 rounded-lg border-[1.5px] border-amber-300">
                        ✓ 满级
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <div className="type-micro flex items-center gap-0.5 text-secondary-ui">
                          <GameImage src={ASSETS.ui.gold} alt="金币" size={14} />
                          <span>{upgradeCost}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setPendingUpgrade({ skillId: skill.id, cost: upgradeCost })}
                          disabled={!canUpgrade}
                          className={`type-meta px-2.5 py-1 h-auto bg-linear-to-r ${color.bg} border-[1.5px] border-white/40 text-white font-ui-semibold`}
                          style={{
                            boxShadow: canUpgrade ? '0 2px 6px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.5)' : 'none'
                          }}
                        >
                          升级
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 等级进度条 */}
                <div className="mt-2">
                  <div className={`h-1.5 ${color.barOuter} rounded-full overflow-hidden border`}>
                    <div
                      className={`h-full bg-linear-to-r ${color.bg} transition-all`}
                      style={{ width: `${(skill.level / skill.maxLevel) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 升级确认弹窗 */}
      {pendingSkill && pendingUpgrade && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-1000"
          onClick={() => setPendingUpgrade(null)}
        >
          <Card
            className="w-4/5 max-w-75 border-[1.5px] border-amber-300"
            style={{
              background: 'linear-gradient(180deg, #fef9f0 0%, #fef3e2 100%)',
              boxShadow: '0 12px 32px rgba(245,158,11,0.35), inset 0 2px 4px rgba(255,255,255,0.9)',
              animation: 'scale-up-center 0.2s ease-out both'
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-12 h-12 rounded-xl bg-linear-to-br ${pendingColor.bg} flex items-center justify-center shrink-0`}
                  style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.5)' }}
                >
                  <GameImage src={pendingSkillImg} alt={pendingSkill.name} size={36} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="type-body font-ui-bold text-strong">{pendingSkill.name}</div>
                  <div className="type-meta text-muted-ui mt-0.5 leading-snug">{pendingSkill.description}</div>
                </div>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 mb-3">
                <div className="type-micro text-gray-400 mb-1">Lv.{pendingSkill.level} → Lv.{pendingSkill.level + 1} 升级后效果</div>
                <div className="type-meta font-ui-semibold text-primary-ui">{getNextLevelDesc(pendingSkill)}</div>
              </div>
              <div className="type-body flex items-center justify-center gap-1.5 mb-3 font-ui-bold text-primary-ui">
                <GameImage src={ASSETS.ui.gold} alt="金币" size={16} />
                消耗 {pendingUpgrade.cost} 金币
              </div>
              <Button
                className={`w-full type-body bg-linear-to-r ${pendingColor.bg} text-white border-0 font-ui-bold`}
                style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
                onClick={handleUpgrade}
              >
                确认升级
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Navigation />
    </div>
  )
}
