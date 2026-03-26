'use client'

import { useGameStore } from '@/store/gameStore'
import Navigation from '@/components/Navigation'
import GameImage from '@/components/GameImage'
import IntroScreen from '@/components/IntroScreen'
import RegionChapterIntro from '@/components/RegionChapterIntro'
import { ASSETS } from '@/app/config/imageAssets'
import { CYCLE_CONFIG, getCycleColorByItem, getEquipmentGlowStyleByItem, getSkillEffectText } from '@/app/config/gameData'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useEffect, useRef, useState } from 'react'

type ActionSfxKey = 'attack' | 's1' | 's2' | 's3' | 's4' | 's5'
type ActionSfxMap = Record<ActionSfxKey, HTMLAudioElement>

export default function BattlePage() {
  const {
    character, currentMonster, battleLog, isPlayerTurn,
    rewardModal, deathModal, monsterIndex, cycle, hasSeenIntro, isHydrated,
    chapterIntro,
    startBattle, attack, useSkill: castSkill, skills,
    closeRewardModal, claimCycleReward, dismissChapterIntroAndStartBattle, resetGame, setHasSeenIntro,
    checkpoints, restartFromLastCheckpoint, equipment,
    battlePhase
  } = useGameStore()

  const logRef = useRef<HTMLDivElement>(null)
  const lastLogIdRef = useRef<string>('')
  const logReplayInitializedRef = useRef(false)
  const playerFloatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const monsterFloatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playerShakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const monsterShakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playerWaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sealWaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const thawBurstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousFrozenTurnsRef = useRef(0)
  const sfxTemplateRef = useRef<ActionSfxMap | null>(null)
  const activeSfxRef = useRef<HTMLAudioElement[]>([])

  const [playerDamageFloat, setPlayerDamageFloat] = useState<{ key: number; text: string } | null>(null)
  const [monsterDamageFloat, setMonsterDamageFloat] = useState<{ key: number; text: string } | null>(null)
  const [playerHitShake, setPlayerHitShake] = useState(false)
  const [monsterHitShake, setMonsterHitShake] = useState(false)
  const [playerSkillWave, setPlayerSkillWave] = useState<'heal' | 'rage' | 'guard' | null>(null)
  const [sealWaveActive, setSealWaveActive] = useState(false)
  const [thawBurstActive, setThawBurstActive] = useState(false)
  const [showCharacterInfoModal, setShowCharacterInfoModal] = useState(false)
  const [showMonsterInfoModal, setShowMonsterInfoModal] = useState(false)

  const getSfxTemplates = () => {
    if (sfxTemplateRef.current) return sfxTemplateRef.current

    const templates: ActionSfxMap = {
      attack: new Audio('/music/normal-attack.mp3'),
      s1: new Audio('/music/thunder-slash.mp3'),
      s2: new Audio('/music/creatorshome-drink-332368.mp3'),
      s3: new Audio('/music/battlecry.mp3'),
      s4: new Audio('/music/holy-shield.mp3'),
      s5: new Audio('/music/sealing-technique.mp3')
    }

    Object.values(templates).forEach((audio) => {
      audio.preload = 'auto'
      audio.volume = 0.72
    })

    sfxTemplateRef.current = templates
    return templates
  }

  const playActionSfx = (action: ActionSfxKey) => {
    const template = getSfxTemplates()[action]
    const clip = template.cloneNode(true) as HTMLAudioElement
    clip.volume = template.volume

    const startAt = action === 'attack' ? 0 : 0.05
    clip.currentTime = startAt

    const detach = () => {
      activeSfxRef.current = activeSfxRef.current.filter((item) => item !== clip)
    }

    const scheduleTruncatedCutoff = (ratio: number, maxCapSeconds = 1) => {
      const rawDuration = clip.duration
      const baseDuration = Number.isFinite(rawDuration) ? rawDuration : 1
      const cappedDuration = Math.min(baseDuration, maxCapSeconds)
      const maxDuration = Math.min(cappedDuration * ratio, maxCapSeconds)
      const playWindow = Math.max(0.05, maxDuration - startAt)
      const cutoffTimer = setTimeout(() => {
        clip.pause()
        detach()
      }, playWindow * 1000)
      clip.addEventListener('ended', () => clearTimeout(cutoffTimer), { once: true })
    }

    const maybeScheduleCutoff = (ratio: number, maxCapSeconds = 1) => {
      if (Number.isFinite(clip.duration) && clip.duration > 0) {
        scheduleTruncatedCutoff(ratio, maxCapSeconds)
      } else {
        clip.addEventListener('loadedmetadata', () => scheduleTruncatedCutoff(ratio, maxCapSeconds), { once: true })
      }
    }

    if (action === 's5') {
      maybeScheduleCutoff(1, 1.5)
    } else if (action !== 'attack') {
      maybeScheduleCutoff(1)
    }

    clip.addEventListener('ended', detach, { once: true })
    clip.addEventListener('error', detach, { once: true })
    activeSfxRef.current.push(clip)

    void clip.play().catch(() => {
      detach()
    })
  }

  useEffect(() => {
    if (!isHydrated) return
    if (!currentMonster && !rewardModal && !deathModal && !chapterIntro && hasSeenIntro) startBattle()
  }, [currentMonster, rewardModal, deathModal, chapterIntro, hasSeenIntro, isHydrated, startBattle])

  useEffect(() => {
    return () => {
      activeSfxRef.current.forEach((clip) => {
        clip.pause()
        clip.currentTime = 0
      })
      activeSfxRef.current = []
      sfxTemplateRef.current = null
    }
  }, [])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [battleLog])

  useEffect(() => {
    if (!isHydrated || logReplayInitializedRef.current) return
    if (battleLog.length > 0) {
      const lastLog = battleLog.at(-1)
      if (lastLog) lastLogIdRef.current = lastLog.id
    }
    logReplayInitializedRef.current = true
  }, [isHydrated, battleLog])

  useEffect(() => {
    if (!logReplayInitializedRef.current) return
    if (!battleLog.length) return
    const lastLog = battleLog.at(-1)
    if (!lastLog) return
    if (lastLog.id === lastLogIdRef.current) return
    lastLogIdRef.current = lastLog.id

    if (lastLog.type === 'player') {
      if (lastLog.message.includes('使用封印术')) {
        setSealWaveActive(true)
        if (sealWaveTimerRef.current) clearTimeout(sealWaveTimerRef.current)
        sealWaveTimerRef.current = setTimeout(() => setSealWaveActive(false), 680)
      }
      let playerWaveType: 'heal' | 'rage' | 'guard' | null = null
      if (lastLog.message.includes('使用治疗术')) {
        playerWaveType = 'heal'
      } else if (lastLog.message.includes('使用战吼术')) {
        playerWaveType = 'rage'
      } else if (lastLog.message.includes('使用圣盾术')) {
        playerWaveType = 'guard'
      }
      if (playerWaveType) {
        setPlayerSkillWave(playerWaveType)
        if (playerWaveTimerRef.current) clearTimeout(playerWaveTimerRef.current)
        playerWaveTimerRef.current = setTimeout(() => setPlayerSkillWave(null), 700)
      }
    }

    const damageMatch = /造成(\d+)点伤害/.exec(lastLog.message)
    if (!damageMatch) return

    const damageText = `-${damageMatch[1]}`
    if (lastLog.type === 'player') {
      setMonsterHitShake(true)
      if (monsterShakeTimerRef.current) clearTimeout(monsterShakeTimerRef.current)
      monsterShakeTimerRef.current = setTimeout(() => {
        setMonsterHitShake(false)
        setMonsterDamageFloat({ key: Date.now(), text: damageText })
      }, 180)
      if (monsterFloatTimerRef.current) clearTimeout(monsterFloatTimerRef.current)
      monsterFloatTimerRef.current = setTimeout(() => setMonsterDamageFloat(null), 760)
    } else if (lastLog.type === 'monster') {
      setPlayerHitShake(true)
      if (playerShakeTimerRef.current) clearTimeout(playerShakeTimerRef.current)
      playerShakeTimerRef.current = setTimeout(() => {
        setPlayerHitShake(false)
        setPlayerDamageFloat({ key: Date.now(), text: damageText })
      }, 180)
      if (playerFloatTimerRef.current) clearTimeout(playerFloatTimerRef.current)
      playerFloatTimerRef.current = setTimeout(() => setPlayerDamageFloat(null), 760)
    }
  }, [battleLog])

  useEffect(() => {
    const frozenTurns = currentMonster?.frozenTurns ?? 0
    const previousFrozenTurns = previousFrozenTurnsRef.current

    if (previousFrozenTurns > 0 && frozenTurns === 0) {
      setThawBurstActive(true)
      if (thawBurstTimerRef.current) clearTimeout(thawBurstTimerRef.current)
      thawBurstTimerRef.current = setTimeout(() => setThawBurstActive(false), 420)
    }

    previousFrozenTurnsRef.current = frozenTurns
  }, [currentMonster?.frozenTurns, currentMonster?.id])

  useEffect(() => {
    if (!currentMonster) {
      setShowMonsterInfoModal(false)
    }
  }, [currentMonster])

  useEffect(() => {
    return () => {
      if (playerFloatTimerRef.current) clearTimeout(playerFloatTimerRef.current)
      if (monsterFloatTimerRef.current) clearTimeout(monsterFloatTimerRef.current)
      if (playerShakeTimerRef.current) clearTimeout(playerShakeTimerRef.current)
      if (monsterShakeTimerRef.current) clearTimeout(monsterShakeTimerRef.current)
      if (playerWaveTimerRef.current) clearTimeout(playerWaveTimerRef.current)
      if (sealWaveTimerRef.current) clearTimeout(sealWaveTimerRef.current)
      if (thawBurstTimerRef.current) clearTimeout(thawBurstTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isHydrated || !currentMonster || rewardModal || deathModal) return
    if (battlePhase === 'idle' && isPlayerTurn) return

    const timer = setTimeout(() => {
      const liveState = useGameStore.getState()
      if (!liveState.currentMonster || liveState.rewardModal || liveState.deathModal) return
      if (liveState.battlePhase === 'idle' && liveState.isPlayerTurn) return

      useGameStore.setState({
        isPlayerTurn: true,
        battlePhase: 'idle',
        battleTransitionText: ''
      })
      liveState.addLog('检测到战斗中断，已自动恢复到可操作状态。', 'system')
    }, 1800)

    return () => clearTimeout(timer)
  }, [isHydrated, currentMonster, rewardModal, deathModal, battlePhase, isPlayerTurn])

  const attackBuff = character.buffs?.attackBoost?.value || 0
  const defenseBuff = character.buffs?.defenseBoost?.value || 0
  const effectiveMaxHp = character.maxHp + (equipment.helmet?.maxHpBonus || 0)
  const totalAttack = character.attack + (equipment.weapon?.attack || 0) + attackBuff
  const totalDefense = character.defense + (equipment.armor?.defense || 0) + defenseBuff
  const totalCritRate = Math.min(0.4, character.critRate + (equipment.accessory?.critRate || 0))
  const totalEvasionRate = Math.min(0.4, character.evasionRate + (equipment.horse?.evasionRate || 0))
  const cycleName = CYCLE_CONFIG[cycle - 1]?.name ?? '比武草原'
  const isFinalVictory = Boolean(rewardModal?.finalVictory)
  const playerWaveClassMap = {
    heal: 'is-heal',
    rage: 'is-rage',
    guard: 'is-guard'
  } as const
  const playerWaveClass = playerSkillWave ? playerWaveClassMap[playerSkillWave] : ''
  const canInteract = Boolean(
    currentMonster &&
    isPlayerTurn &&
    battlePhase === 'idle' &&
    !rewardModal &&
    !deathModal
  )

  if (!isHydrated) {
    return <div className="px-2.5 pt-6 text-center text-sm text-amber-700">正在载入存档...</div>
  }

  // 显示首屏
  if (!hasSeenIntro) {
    return <IntroScreen onStart={setHasSeenIntro} />
  }

  if (chapterIntro?.show) {
    return (
      <RegionChapterIntro
        cycle={chapterIntro.cycle}
        characterLevel={character.level}
        characterName={character.playerName || character.name}
        onEnter={dismissChapterIntroAndStartBattle}
      />
    )
  }

  return (
    <div className="ui-page-stack ui-page-with-nav px-2.5 pt-2.5 pb-2.5">
      <div className="flex ui-grid-gap">
        <Card
          className="ui-panel-card flex-1"
          style={{ boxShadow: '0 4px 12px rgba(200,150,80,0.2), inset 0 1px 2px rgba(255,255,255,0.9)' }}
        >
          <CardContent className="ui-panel-body">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                Lv.{character.level}
              </span>
              <span className="type-micro text-gray-600">{character.exp}/100</span>
            </div>
            <div
              className="text-center mb-2 flex justify-center cursor-pointer"
              onClick={() => setShowCharacterInfoModal(true)}
              title="查看人物详情"
            >
              <div className={`relative w-20 h-20 ${playerHitShake ? 'battle-hit-shake' : ''}`}>
                <GameImage src={ASSETS.players[cycle - 1]} alt="玩家" size={80} priority />
                {playerSkillWave && <div className={`battle-player-wave ${playerWaveClass}`} />}
                {playerDamageFloat && (
                  <div key={playerDamageFloat.key} className="battle-damage-float text-red-500">
                    {playerDamageFloat.text}
                  </div>
                )}
              </div>
            </div>
            <h3
              className="text-center mb-2 type-card-title font-semibold"
              style={{ color: CYCLE_CONFIG[cycle - 1].color }}
            >
              {character.playerName || character.name}
            </h3>
            <div className="hp-bar relative mt-1" style={{ height: '16px' }}>
              <div className="hp-bar-fill" style={{ width: `${(character.hp / effectiveMaxHp) * 100}%` }} />
              <span className="absolute inset-0 flex items-center justify-center type-micro font-semibold text-red-900/80">{character.hp}/{effectiveMaxHp}</span>
            </div>
            <div className="mp-bar relative mt-1" style={{ height: '16px' }}>
              <div className="mp-bar-fill" style={{ width: `${(character.mp / character.maxMp) * 100}%` }} />
              <span className="absolute inset-0 flex items-center justify-center type-micro font-semibold text-blue-900/80">{character.mp}/{character.maxMp}</span>
            </div>
            <div className="text-xs mt-2 flex justify-between">
              <span className="flex items-center gap-0.5"><GameImage src={ASSETS.ui.atk} alt="攻击" size={14} /> {totalAttack}{attackBuff > 0 && <span className="text-red-400"> (+{attackBuff})</span>}</span>
              <span className="flex items-center gap-0.5"><GameImage src={ASSETS.ui.armorValue} alt="防御" size={14} /> {totalDefense}{defenseBuff > 0 && <span className="text-blue-400"> (+{defenseBuff})</span>}</span>
            </div>
            <div className="text-xs mt-1 flex justify-between text-amber-700">
              <span className="flex items-center gap-0.5"><GameImage src={ASSETS.ui.criticalStrike} alt="暴击" size={14} /> {(totalCritRate * 100).toFixed(0)}%</span>
              <span className="flex items-center gap-0.5"><GameImage src={ASSETS.ui.dodge} alt="闪避" size={14} /> {(totalEvasionRate * 100).toFixed(0)}%</span>
            </div>
            <div className="border-t border-amber-200 my-2" />
            <div className="text-xs flex justify-between items-center px-1 min-h-6">
              <div className="flex items-center gap-1.5">
                {character.buffs?.attackBoost ? (
                  <>
                    <GameImage src={ASSETS.ui.rage} alt="狂暴" size={18} />
                    <span className="text-purple-600 font-bold">{character.buffs.attackBoost.turnsLeft}回合</span>
                  </>
                ) : (
                  <span className="type-meta text-amber-400/80">战意未燃</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {character.buffs?.defenseBoost ? (
                  <>
                    <GameImage src={ASSETS.ui.shield} alt="厚甲" size={18} />
                    <span className="text-sky-600 font-bold">{character.buffs.defenseBoost.turnsLeft}回合</span>
                  </>
                ) : (
                  <span className="type-meta text-amber-400/80">护纹未启</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="ui-panel-card flex-1"
          style={{ boxShadow: '0 4px 12px rgba(200,150,80,0.2), inset 0 1px 2px rgba(255,255,255,0.9)' }}
        >
          <CardContent className="ui-panel-body">
            {currentMonster ? (
              <>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                    style={{
                      color: CYCLE_CONFIG[cycle - 1].color,
                      backgroundColor: `${CYCLE_CONFIG[cycle - 1].color}18`,
                      borderColor: `${CYCLE_CONFIG[cycle - 1].color}50`
                    }}
                  >
                    {cycleName}
                  </span>
                  <span className="type-micro text-gray-600">第{monsterIndex + 1}关</span>
                </div>
                <div
                  className="text-center mb-2 flex justify-center cursor-pointer"
                  onClick={() => setShowMonsterInfoModal(true)}
                  title="查看怪物详情"
                >
                  <div
                    className={`relative w-20 h-20 ${monsterHitShake ? 'battle-hit-shake' : ''} ${sealWaveActive ? 'battle-seal-impact' : ''} ${currentMonster.frozenTurns && currentMonster.frozenTurns > 0 ? 'battle-frozen-target' : ''}`}
                  >
                    <GameImage src={currentMonster.image || ASSETS.ui.combat} alt={currentMonster.name} size={80} priority />
                    {Boolean(currentMonster.frozenTurns && currentMonster.frozenTurns > 0) && <div className="battle-frozen-crystals" />}
                    {thawBurstActive && <div className="battle-thaw-burst" />}
                    {monsterDamageFloat && (
                      <div key={monsterDamageFloat.key} className="battle-damage-float text-red-500">
                        {monsterDamageFloat.text}
                      </div>
                    )}
                    {sealWaveActive && <div className="battle-seal-wave" />}
                  </div>
                </div>
                <h3
                  className="text-center mb-2 type-card-title font-semibold"
                  style={{ color: CYCLE_CONFIG[cycle - 1].color }}
                >
                  {currentMonster.name}
                </h3>
                <div className="hp-bar relative mt-1" style={{ height: '16px' }}>
                  <div className="hp-bar-fill" style={{ width: `${(currentMonster.hp / currentMonster.maxHp) * 100}%` }} />
                  <span className="absolute inset-0 flex items-center justify-center type-micro font-semibold text-red-900/80">{currentMonster.hp}/{currentMonster.maxHp}</span>
                </div>
                <div className="mp-bar relative mt-1" style={{ height: '16px' }}>
                  <div className="mp-bar-fill" style={{ width: '100%' }} />
                  <span className="absolute inset-0 flex items-center justify-center type-micro font-semibold text-blue-900/80">{currentMonster.maxHp}/{currentMonster.maxHp}</span>
                </div>
                <div className="text-xs mt-2 flex justify-between">
                  <span className="flex items-center gap-0.5"><GameImage src={ASSETS.ui.atk} alt="攻击" size={14} /> {currentMonster.attack}</span>
                  <span className="flex items-center gap-0.5"><GameImage src={ASSETS.ui.armorValue} alt="防御" size={14} /> {currentMonster.defense}</span>
                </div>
                <div className="text-xs mt-1 flex justify-between text-amber-700">
                  <span className="flex items-center gap-0.5"><GameImage src={ASSETS.ui.criticalStrike} alt="暴击" size={14} /> {((currentMonster.critRate || 0) * 100).toFixed(0)}%</span>
                  <span className="flex items-center gap-0.5"><GameImage src={ASSETS.ui.dodge} alt="闪避" size={14} /> {((currentMonster.evasionRate || 0) * 100).toFixed(0)}%</span>
                </div>
                <div className="border-t border-amber-200 my-2" />
                <div className="text-xs flex justify-between items-center px-1 min-h-6">
                  <div className="flex items-center gap-1.5">
                    {currentMonster.frozenTurns && currentMonster.frozenTurns > 0 ? (
                      <>
                        <GameImage src={ASSETS.ui.frozen} alt="封印" size={18} />
                        <span className="text-blue-600 font-bold">{currentMonster.frozenTurns}回合</span>
                      </>
                    ) : (
                      <span className="type-meta text-amber-400/80">封印静默</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {currentMonster.frozenTurns && currentMonster.frozenTurns > 0 ? (
                      <span className="text-blue-500 font-bold">封印中</span>
                    ) : (
                      <span className="type-meta text-amber-400/80">状态稳定</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-2.5">
                <Button onClick={startBattle} disabled={battlePhase !== 'idle'}>开始战斗</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card
        className="ui-panel-card"
        style={{
          boxShadow: '0 4px 12px rgba(200,150,80,0.2), inset 0 1px 2px rgba(255,255,255,0.9)',
          marginBottom: '5px'
        }}
      >
        <CardContent className="ui-panel-body">
          <div className="flex items-center gap-2 mb-2">
            <GameImage src={ASSETS.ui.map} alt="日志" size={18} />
            <h3 className="type-card-title font-semibold text-amber-800">战斗日志</h3>
          </div>
          <div
            ref={logRef}
            className="battle-log-scroll h-19.5 overflow-y-auto text-xs leading-relaxed rounded-lg border border-amber-200 bg-amber-50/30 p-2"
          >
            {battleLog.map((log, i) => {
              if (log.type === 'round-end') {
                return (
                  <div key={log.id} className="type-micro flex items-center gap-1.5 py-1 font-semibold tracking-[0.08em] text-amber-500">
                    <span className="h-px flex-1 bg-amber-300/70" />
                    <span>{log.message}</span>
                    <span className="h-px flex-1 bg-amber-300/70" />
                  </div>
                )
              }
              let textColor = 'text-gray-700'
              if (log.type === 'player') {
                textColor = 'text-blue-600'
              } else if (log.type === 'monster') {
                textColor = 'text-red-600'
              }

              return (
                <div
                  key={log.id}
                  className={`${textColor} py-0.5`}
                  style={{ animation: i === battleLog.length - 1 ? 'scale-up-center 0.2s ease-out' : 'none' }}
                >
                  {log.message}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 攻击技能区：3行2列统一格式 */}
      <div className="grid grid-cols-2 auto-rows-fr ui-grid-gap mt-0">
        {/* 普通攻击 */}
        <Button
          onClick={() => {
            playActionSfx('attack')
            attack()
          }}
          disabled={!canInteract}
          className="battle-skill-btn-soft ui-button-card px-3 py-2.5 gap-2.5 type-meta h-full! flex flex-row items-center bg-linear-to-r from-amber-300 to-yellow-300 hover:from-amber-400 hover:to-yellow-400 text-amber-900 border border-amber-200/50"
          style={{
            minHeight: '3.5rem',
            boxShadow: '2px 2px 4px rgba(200,150,80,0.15), -2px -2px 4px rgba(255,255,255,0.7)',
            transition: 'all 0.2s ease'
          }}
        >
          <div className="ui-button-icon" style={{ width: '2.6rem', height: '2.6rem' }}>
            <GameImage src={ASSETS.ui.atk} alt="攻击" size={34} />
          </div>
          <div className="flex flex-col items-start text-left flex-1 min-w-0 gap-0.5">
            <span className="type-body font-ui-bold mb-0.5">普通攻击</span>
            <span className="type-micro opacity-70">伤害: 攻击 {totalAttack}</span>
          </div>
        </Button>

        {/* 技能按钮：行1右=s1, 行2=s2/s5, 行3=s3/s4 */}
        {(['s1', 's2', 's5', 's3', 's4'] as const).map(sid => {
          const skill = skills.find(s => s.id === sid)!
          const canUse = character.mp >= skill.cost.mp
          const cfgMap: Record<string, { icon: string; gradient: string; text: string; border: string; shadow: string }> = {
            s1: { icon: ASSETS.ui.thump,   gradient: 'from-orange-300 to-amber-300 hover:from-orange-400 hover:to-amber-400', text: 'text-orange-900', border: 'border-orange-200/50', shadow: 'rgba(251,146,60,0.15)' },
            s2: { icon: ASSETS.ui.medicine, gradient: 'from-emerald-300 to-teal-300 hover:from-emerald-400 hover:to-teal-400', text: 'text-emerald-900', border: 'border-emerald-200/50', shadow: 'rgba(52,211,153,0.15)' },
            s3: { icon: ASSETS.ui.rage,    gradient: 'from-purple-300 to-violet-300 hover:from-purple-400 hover:to-violet-400', text: 'text-purple-900', border: 'border-purple-200/50', shadow: 'rgba(168,85,247,0.15)' },
            s4: { icon: ASSETS.ui.shield, gradient: 'from-sky-300 to-cyan-300 hover:from-sky-400 hover:to-cyan-400', text: 'text-sky-900', border: 'border-sky-200/50', shadow: 'rgba(56,189,248,0.15)' },
            s5: { icon: ASSETS.ui.frozen,  gradient: 'from-blue-300 to-indigo-300 hover:from-blue-400 hover:to-indigo-400', text: 'text-blue-900', border: 'border-blue-200/50', shadow: 'rgba(99,102,241,0.15)' },
          }
          const cfg = cfgMap[sid]
          const effectText = getSkillEffectText(skill, {
            maxHp: effectiveMaxHp,
            totalAttack,
            totalDefense
          })
          return (
            <Button
              key={sid}
              onClick={() => {
                playActionSfx(sid)
                castSkill(sid)
              }}
              disabled={!canInteract || !canUse}
              style={{
                minHeight: '3.5rem',
                opacity: canUse ? 1 : 0.5,
                boxShadow: canUse ? `2px 2px 4px ${cfg.shadow}, -2px -2px 4px rgba(255,255,255,0.7)` : 'none',
                transition: 'all 0.2s ease'
              }}
              className={`battle-skill-btn-soft ui-button-card px-3 py-2.5 gap-2.5 type-meta h-full! flex flex-row items-center bg-linear-to-r ${cfg.gradient} ${cfg.text} border ${cfg.border}`}
            >
              <div className="ui-button-icon" style={{ width: '2.6rem', height: '2.6rem' }}>
                <GameImage src={cfg.icon} alt={skill.name} size={34} />
              </div>
              <div className="flex flex-col items-start text-left flex-1 min-w-0 gap-0.5">
                <div className="flex items-center justify-between w-full gap-1 min-w-0">
                  <span className="type-body font-ui-bold truncate">{skill.name}</span>
                  <span className="type-micro italic opacity-70 font-medium shrink-0">-MP:{skill.cost.mp}</span>
                </div>
                <div className="type-micro opacity-80 leading-snug w-full whitespace-normal wrap-break-word max-h-10 overflow-hidden">{effectText}</div>
              </div>
            </Button>
          )
        })}
      </div>

      {showCharacterInfoModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-200"
          onClick={() => setShowCharacterInfoModal(false)}
        >
          <div
            className="w-4/5 max-w-85 rounded-2xl border-[1.5px] border-amber-200 p-5"
            style={{
              background: 'linear-gradient(180deg, #fef9f0 0%, #fef5e8 100%)',
              boxShadow: '0 8px 24px rgba(200,150,80,0.3), inset 0 1px 2px rgba(255,255,255,0.9)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-2.5">
              <GameImage src={ASSETS.players[cycle - 1]} alt="玩家" size={64} />
              <div>
                <div className="type-panel-title font-ui-bold text-strong">{character.playerName || character.name}</div>
                <div className="type-meta text-primary-ui">Lv.{character.level} / EXP {character.exp}/100</div>
              </div>
            </div>

            <div className="ui-info-card ui-section-gap bg-amber-50/60">
              <div className="hp-bar relative" style={{ height: '16px' }}>
                <div className="hp-bar-fill" style={{ width: `${(character.hp / effectiveMaxHp) * 100}%` }} />
                <span className="absolute inset-0 flex items-center justify-center type-micro font-semibold text-red-800/70">{character.hp}/{effectiveMaxHp}</span>
              </div>
              <div className="mp-bar relative mt-1.5" style={{ height: '16px' }}>
                <div className="mp-bar-fill" style={{ width: `${(character.mp / character.maxMp) * 100}%` }} />
                <span className="absolute inset-0 flex items-center justify-center type-micro font-semibold text-blue-800/70">{character.mp}/{character.maxMp}</span>
              </div>
            </div>

            <div className="ui-info-card ui-section-gap bg-amber-50/60">
              <div className="text-xs text-red-600 flex justify-between items-center"><span className="flex items-center gap-1"><GameImage src={ASSETS.ui.atk} alt="攻击" size={14} />攻击</span><span>{totalAttack}</span></div>
              <div className="text-xs text-blue-600 flex justify-between items-center mt-1"><span className="flex items-center gap-1"><GameImage src={ASSETS.ui.armorValue} alt="防御" size={14} />防御</span><span>{totalDefense}</span></div>
              <div className="text-xs text-amber-600 flex justify-between items-center mt-1"><span className="flex items-center gap-1"><GameImage src={ASSETS.ui.criticalStrike} alt="暴击" size={14} />暴击率</span><span>{Math.round(totalCritRate * 100)}%</span></div>
              <div className="text-xs text-cyan-600 flex justify-between items-center mt-1"><span className="flex items-center gap-1"><GameImage src={ASSETS.ui.dodge} alt="闪避" size={14} />闪避率</span><span>{Math.round(totalEvasionRate * 100)}%</span></div>
            </div>

            <Button
              className="w-full bg-linear-to-r from-amber-300 to-yellow-300 hover:from-amber-400 hover:to-yellow-400 text-amber-900 border-[1.5px] border-amber-300"
              onClick={() => setShowCharacterInfoModal(false)}
            >
              关闭
            </Button>
          </div>
        </div>
      )}

      {showMonsterInfoModal && currentMonster && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-200"
          onClick={() => setShowMonsterInfoModal(false)}
        >
          <div
            className="w-4/5 max-w-85 rounded-2xl border-[1.5px] border-amber-200 p-5"
            style={{
              background: 'linear-gradient(180deg, #fef9f0 0%, #fef5e8 100%)',
              boxShadow: '0 8px 24px rgba(200,150,80,0.3), inset 0 1px 2px rgba(255,255,255,0.9)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-2.5">
              <GameImage src={currentMonster.image || ASSETS.ui.combat} alt={currentMonster.name} size={64} />
              <div>
                <div className="type-panel-title font-ui-bold text-strong">{currentMonster.name}</div>
                <div className="type-meta text-primary-ui">{cycleName} / 第{monsterIndex + 1}关</div>
              </div>
            </div>

            <div className="ui-info-card ui-section-gap bg-amber-50/60">
              <div className="hp-bar relative" style={{ height: '16px' }}>
                <div className="hp-bar-fill" style={{ width: `${(currentMonster.hp / currentMonster.maxHp) * 100}%` }} />
                <span className="absolute inset-0 flex items-center justify-center type-micro font-semibold text-red-800/70">{currentMonster.hp}/{currentMonster.maxHp}</span>
              </div>
            </div>

            <div className="ui-info-card ui-section-gap bg-amber-50/60">
              <div className="text-xs text-red-600 flex justify-between items-center"><span className="flex items-center gap-1"><GameImage src={ASSETS.ui.atk} alt="攻击" size={14} />攻击</span><span>{currentMonster.attack}</span></div>
              <div className="text-xs text-blue-600 flex justify-between items-center mt-1"><span className="flex items-center gap-1"><GameImage src={ASSETS.ui.armorValue} alt="防御" size={14} />防御</span><span>{currentMonster.defense}</span></div>
              <div className="text-xs text-amber-600 flex justify-between items-center mt-1"><span className="flex items-center gap-1"><GameImage src={ASSETS.ui.criticalStrike} alt="暴击" size={14} />暴击率</span><span>{Math.round((currentMonster.critRate || 0) * 100)}%</span></div>
              <div className="text-xs text-cyan-600 flex justify-between items-center mt-1"><span className="flex items-center gap-1"><GameImage src={ASSETS.ui.dodge} alt="闪避" size={14} />闪避率</span><span>{Math.round((currentMonster.evasionRate || 0) * 100)}%</span></div>
              <div className="text-xs text-indigo-600 flex justify-between items-center mt-1"><span className="flex items-center gap-1"><GameImage src={ASSETS.ui.frozen} alt="封印" size={14} />封印状态</span><span>{currentMonster.frozenTurns && currentMonster.frozenTurns > 0 ? `剩余${currentMonster.frozenTurns}回合` : '无'}</span></div>
            </div>

            {currentMonster.description && (
              <div className="ui-info-card ui-section-gap bg-amber-50/60">
                <div className="type-meta text-secondary-ui leading-relaxed">{currentMonster.description}</div>
              </div>
            )}

            <Button
              className="w-full bg-linear-to-r from-amber-300 to-yellow-300 hover:from-amber-400 hover:to-yellow-400 text-amber-900 border-[1.5px] border-amber-300"
              onClick={() => setShowMonsterInfoModal(false)}
            >
              关闭
            </Button>
          </div>
        </div>
      )}

      {/* 普通奖励弹窗 */}
      {rewardModal?.show && !rewardModal.cycleReward && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-1000">
          <Card
            className="w-4/5 max-w-[320px] border-[1.5px] border-amber-300"
            style={{
              background: 'linear-gradient(180deg, #fef9f0 0%, #fef3e2 100%)',
              boxShadow: '0 12px 32px rgba(245,158,11,0.4), 0 6px 12px rgba(245,158,11,0.3), inset 0 2px 4px rgba(255,255,255,0.9)',
              animation: 'scale-up-center 0.3s cubic-bezier(0.390, 0.575, 0.565, 1.000) both'
            }}
          >
            <CardContent className="p-5 text-center">
              {isFinalVictory ? (
                <>
                  <div
                    className="flex justify-center mb-2"
                    style={{ animation: 'bounce-in-top 0.6s both' }}
                  >
                    <GameImage src={ASSETS.ui.init} alt="封印重燃" size={96} />
                  </div>
                  <h2
                    className="type-page-title font-bold text-amber-600 mb-2"
                    style={{
                      textShadow: '0 2px 4px rgba(245,158,11,0.2)',
                      animation: 'slide-in-blurred-top 0.4s cubic-bezier(0.230, 1.000, 0.320, 1.000) both'
                    }}
                  >
                    封印重燃！
                  </h2>
                  <div className="space-y-4 text-left mb-6">
                    <p
                      className="type-meta text-amber-700 leading-relaxed"
                      style={{ animation: 'scale-up-center 0.3s ease 0.12s both' }}
                    >
                      　　当第五阶传说套装的辉芒汇聚，你踏过王庭深井的断阶，看见封锁纹阵被逐层点亮，像深渊尽头回返的第一束天光。
                    </p>
                    <p
                      className="type-meta text-amber-700 leading-relaxed"
                      style={{ animation: 'scale-up-center 0.3s ease 0.2s both' }}
                    >
                      　　焚冠冥皇的王冠冥火在此刻熄灭，冥火骸军失去统御，亡潮像退去的黑潮般坍散。曾经濒临崩塌的王庭防线，终于等到裂隙回廊重新闭合。
                    </p>
                    <p
                      className="type-meta text-amber-700 leading-relaxed"
                      style={{ animation: 'scale-up-center 0.3s ease 0.28s both' }}
                    >
                      　　你回望来路，每一次破阵、每一次进阶，都为这束天光添上一道纹章。从比武草原到深渊王座，你已成为回廊传说，艾尔大陆迎来久违的黎明。
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="flex justify-center mb-2"
                    style={{ animation: 'bounce-in-top 0.6s both' }}
                  >
                    <GameImage src={ASSETS.ui.award} alt="奖励" size={84} />
                  </div>
                  <h2
                    className="type-page-title font-bold text-amber-600 mb-3"
                    style={{
                      textShadow: '0 2px 4px rgba(245,158,11,0.2)',
                      animation: 'slide-in-blurred-top 0.4s cubic-bezier(0.230, 1.000, 0.320, 1.000) both'
                    }}
                  >
                    破阵得胜
                  </h2>
                </>
              )}

              {!isFinalVictory && (
                <>
                  <div className="mb-3 rounded-2xl border border-amber-200 bg-linear-to-r from-amber-50 via-white to-blue-50 px-3 py-3"
                    style={{
                      boxShadow: '0 4px 14px rgba(245,158,11,0.12), inset 0 1px 2px rgba(255,255,255,0.9)',
                      animation: 'scale-up-center 0.25s cubic-bezier(0.390, 0.575, 0.565, 1.000) 0.12s both'
                    }}
                  >
                    <div className="type-meta flex items-center justify-center gap-1.5 text-blue-700 leading-relaxed">
                      <span>恭喜你获得</span>
                      <GameImage src={ASSETS.ui.empiricalValue} alt="经验" size={18} />
                      <span>经验 +{rewardModal.exp}</span>
                    </div>
                    <div className="type-meta flex items-center justify-center gap-1.5 text-amber-700 leading-relaxed mt-1">
                      <span>恭喜你获得</span>
                      <GameImage src={ASSETS.ui.gold} alt="金币" size={18} />
                      <span>金币 +{rewardModal.gold}</span>
                    </div>
                    <div className="type-meta mt-1.5 flex items-center justify-center gap-1.5 text-cyan-700">
                      <span>经过了一番休整</span>
                      <GameImage src={ASSETS.food.largeMpPotion} alt="幽蓝魔力" size={18} />
                      <span>回蓝+50%</span>
                    </div>
                    {rewardModal.chapterLine && (
                      <div className="type-meta mt-2 rounded-xl border border-amber-200/80 bg-amber-100/60 px-2.5 py-2 text-left text-amber-800 leading-relaxed">
                        {rewardModal.chapterLine}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mb-5">
                    {rewardModal.foodDrop && (
                      <div
                        className="rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-white overflow-hidden"
                        style={{
                          boxShadow: '0 2px 8px rgba(52,211,153,0.15), inset 0 1px 2px rgba(255,255,255,0.8)',
                          animation: 'scale-up-center 0.25s cubic-bezier(0.390, 0.575, 0.565, 1.000) 0.24s both'
                        }}
                      >
                        <div className="flex items-center gap-2 py-2.5 px-3 border-b border-emerald-100/80 bg-emerald-100/40">
                          <GameImage src={rewardModal.foodDrop.item.image || ''} alt={rewardModal.foodDrop.item.name} size={30} />
                          <div className="text-left">
                            <div className="type-micro tracking-[0.16em] text-emerald-500">额外掉落</div>
                            <span className="type-card-title font-bold text-emerald-700">{rewardModal.foodDrop.item.name}</span>
                          </div>
                        </div>
                        <p className="type-meta text-emerald-600 italic px-3 py-2.5 leading-relaxed text-left">
                          {rewardModal.foodDrop.lootMessage}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Button
                onClick={() => {
                  closeRewardModal()
                  startBattle()
                }}
                className="w-full py-2.5 type-panel-title font-bold bg-linear-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-amber-900 border-[1.5px] border-amber-300 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mt-1"
                style={{
                  boxShadow: '0 4px 12px rgba(245,158,11,0.3), inset 0 2px 2px rgba(255,255,255,0.6)',
                  textShadow: '0 1px 2px rgba(255,255,255,0.5)',
                  animation: 'scale-up-center 0.25s cubic-bezier(0.390, 0.575, 0.565, 1.000) 0.35s both'
                }}
              >
                {isFinalVictory ? '终攀顶峰' : '继续战斗'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 等级进阶奖励弹窗 */}
      {rewardModal?.show && rewardModal.cycleReward && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-1000">
          <Card
            className="w-4/5 max-w-90 border-[1.5px] border-amber-300"
            style={{
              background: 'linear-gradient(180deg, #fef9f0 0%, #fef3e2 100%)',
              boxShadow: '0 12px 32px rgba(245,158,11,0.4), 0 6px 12px rgba(245,158,11,0.3), inset 0 2px 4px rgba(255,255,255,0.9)',
              animation: 'scale-up-center 0.3s cubic-bezier(0.390, 0.575, 0.565, 1.000) both'
            }}
          >
            <CardContent className="p-5 text-center">
              <div className="flex justify-center mb-2">
                <GameImage src={ASSETS.ui.pass} alt="等级提升" size={84} />
              </div>
              <h2
                className="type-page-title font-bold text-amber-600 mb-2.5"
                style={{
                  textShadow: '0 2px 4px rgba(245,158,11,0.2)',
                  animation: 'slide-in-blurred-top 0.4s cubic-bezier(0.230, 1.000, 0.320, 1.000) both'
                }}
              >
                等级提升
              </h2>

              <div
                className="mb-2.5 rounded-2xl border border-amber-200 bg-linear-to-r from-amber-50 via-white to-blue-50 px-3 py-3"
                style={{
                  boxShadow: '0 4px 14px rgba(245,158,11,0.12), inset 0 1px 2px rgba(255,255,255,0.9)'
                }}
              >
                <div className="type-meta flex items-center justify-center gap-1.5 text-blue-700 leading-relaxed">
                  <span>恭喜你获得</span>
                  <GameImage src={ASSETS.ui.empiricalValue} alt="经验" size={18} />
                  <span>经验 +{rewardModal.exp}</span>
                </div>
                <div className="type-meta flex items-center justify-center gap-1.5 text-amber-700 leading-relaxed mt-1">
                  <span>恭喜你获得</span>
                  <GameImage src={ASSETS.ui.gold} alt="金币" size={18} />
                  <span>金币 +{rewardModal.gold}</span>
                </div>
                <div className="type-meta mt-1.5 flex items-center justify-center gap-1.5 text-cyan-700">
                  <span>经过了一番休整</span>
                  <GameImage src={ASSETS.food.largeMpPotion} alt="幽蓝魔力" size={18} />
                  <span>回蓝+50%</span>
                </div>
                {rewardModal.chapterLine && (
                  <div className="type-meta mt-2 rounded-xl border border-amber-200/80 bg-amber-100/60 px-2.5 py-2 text-left text-amber-800 leading-relaxed">
                    {rewardModal.chapterLine}
                  </div>
                )}
              </div>

              {rewardModal.foodDrop && (
                <div
                  className="mb-2.5 rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-white overflow-hidden"
                  style={{
                    boxShadow: '0 2px 8px rgba(52,211,153,0.15), inset 0 1px 2px rgba(255,255,255,0.8)'
                  }}
                >
                  <div className="flex items-center gap-2 py-2.5 px-3 border-b border-emerald-100/80 bg-emerald-100/40">
                    <GameImage src={rewardModal.foodDrop.item.image || ''} alt={rewardModal.foodDrop.item.name} size={30} />
                    <div className="text-left">
                      <div className="type-micro tracking-[0.16em] text-emerald-500">额外掉落</div>
                      <span className="type-card-title font-bold text-emerald-700">{rewardModal.foodDrop.item.name}</span>
                    </div>
                  </div>
                  <p className="type-meta text-emerald-600 italic px-3 py-2.5 leading-relaxed text-left">
                    {rewardModal.foodDrop.lootMessage}
                  </p>
                </div>
              )}

              <div className="mb-2.5">
                <h3 className="font-bold mb-2.5 text-purple-700">获得装备套装：</h3>
                <div className="mx-auto grid max-w-75 grid-cols-6 gap-1.5">
                  {[
                    {
                      item: rewardModal.cycleReward.weapon,
                      alt: '武器'
                    },
                    {
                      item: rewardModal.cycleReward.armor,
                      alt: '盔甲'
                    },
                    {
                      item: rewardModal.cycleReward.helmet,
                      alt: '头盔'
                    },
                    {
                      item: rewardModal.cycleReward.horse,
                      alt: '坐骑'
                    },
                    {
                      item: rewardModal.cycleReward.accessory,
                      alt: '饰品'
                    }
                  ].map(({ item, alt }, index, arr) => {
                    const remain = arr.length % 3
                    let alignClass = ''
                    if (remain === 1 && index === arr.length - 1) {
                      alignClass = 'col-start-3'
                    } else if (remain === 2 && index === arr.length - 2) {
                      alignClass = 'col-start-2'
                    }

                    return (
                    <div key={item.id} className={`col-span-2 ${alignClass} aspect-square rounded-lg border border-amber-200 bg-gray-50 px-1.5 py-1.5 text-center flex flex-col items-center justify-center`}>
                      <div className="flex justify-center" style={getEquipmentGlowStyleByItem(item)}>
                        <GameImage src={item.image!} alt={alt} size={32} />
                      </div>
                      <p className="type-micro mt-1 font-semibold leading-tight" style={{ color: getCycleColorByItem(item) }}>{item.name}</p>
                    </div>
                    )
                  })}
                </div>
              </div>

              <Button
                onClick={claimCycleReward}
                className="w-full py-2.5 type-panel-title font-bold bg-linear-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white border-[1.5px] border-purple-300 transition-all hover:scale-105 active:scale-95"
                style={{
                  boxShadow: '0 4px 12px rgba(168,85,247,0.3), inset 0 2px 2px rgba(255,255,255,0.6)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}
              >
                🎁 领取奖励
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 死亡弹窗 */}
      {deathModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-1000">
          <Card
            className="w-4/5 max-w-[320px] border-[1.5px] border-red-300"
            style={{
              background: 'linear-gradient(180deg, #fef0f0 0%, #fee2e2 100%)',
              boxShadow: '0 12px 32px rgba(239,68,68,0.4), 0 6px 12px rgba(239,68,68,0.3), inset 0 2px 4px rgba(255,255,255,0.9)',
              animation: 'scale-up-center 0.3s cubic-bezier(0.390, 0.575, 0.565, 1.000) both'
            }}
          >
            <CardContent className="p-5 text-center">
              <div
                className="flex justify-center mb-3.5"
                style={{ animation: 'slide-in-blurred-top 0.4s cubic-bezier(0.230, 1.000, 0.320, 1.000) both' }}
              >
                <GameImage src={ASSETS.ui.humanSkeleton} alt="战败" size={96} />
              </div>
              <h2
                className="type-page-title font-bold text-red-600 mb-3"
                style={{
                  textShadow: '0 2px 4px rgba(239,68,68,0.2)',
                  animation: 'slide-in-blurred-top 0.4s cubic-bezier(0.230, 1.000, 0.320, 1.000) 0.1s both'
                }}
              >
                回廊失守
              </h2>

              <p
                className="type-card-title text-gray-600 mb-4"
                style={{ animation: 'scale-up-center 0.25s cubic-bezier(0.390, 0.575, 0.565, 1.000) 0.2s both' }}
              >
                你在此役倒下，但封印之战尚未终结。
              </p>

              <div className="space-y-3">
                {checkpoints.length > 0 && (
                  <Button
                    onClick={() => {
                      const resumed = restartFromLastCheckpoint()
                      if (!resumed) {
                        resetGame()
                        startBattle()
                      }
                    }}
                    className="w-full py-2.5 type-panel-title font-bold bg-linear-to-r from-sky-400 to-cyan-400 hover:from-sky-500 hover:to-cyan-500 text-white border-[1.5px] border-sky-300 transition-all hover:scale-105 active:scale-95"
                    style={{
                      boxShadow: '0 4px 12px rgba(56,189,248,0.3), inset 0 2px 2px rgba(255,255,255,0.6)',
                      textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                      animation: 'scale-up-center 0.25s cubic-bezier(0.390, 0.575, 0.565, 1.000) 0.3s both'
                    }}
                  >
                    加载最近存档
                  </Button>
                )}

                <Button
                  onClick={() => {
                    resetGame()
                    startBattle()
                  }}
                  className="w-full py-2.5 type-card-title font-bold bg-linear-to-r from-red-400 to-orange-400 hover:from-red-500 hover:to-orange-500 text-white border-[1.5px] border-red-300 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  style={{
                    boxShadow: '0 4px 12px rgba(239,68,68,0.28), inset 0 2px 2px rgba(255,255,255,0.6)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    animation: 'scale-up-center 0.25s cubic-bezier(0.390, 0.575, 0.565, 1.000) 0.35s both'
                  }}
                >
                  <GameImage src={ASSETS.ui.combat} alt="开启征程" size={18} />
                  重新开始（新旅程）
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Navigation />
    </div>
  )
}
