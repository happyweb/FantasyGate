'use client'

import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import Navigation from '@/components/Navigation'
import GameImage from '@/components/GameImage'
import { ASSETS } from '@/app/config/imageAssets'
import { getCycleColorByItem, getEquipmentGlowStyleByItem } from '@/app/config/gameData'
import { Button } from '@/components/ui/button'
import { Item, Equipment } from '@/types/game'

const SLOT_CONFIG: { key: keyof Equipment; label: string; gridArea: string }[] = [
  { key: 'weapon', label: '武器', gridArea: 'weapon' },
  { key: 'accessory', label: '饰品', gridArea: 'accessory' },
  { key: 'helmet', label: '头盔', gridArea: 'helmet' },
  { key: 'armor', label: '护甲', gridArea: 'armor' },
  { key: 'horse', label: '坐骑', gridArea: 'horse' }
]

const CATEGORIES = ['全部', '装备', '消耗品']

const GRID_COLUMNS = 5
const DEFAULT_GRID_ROWS = 10
const DEFAULT_GRID_SLOT_COUNT = GRID_COLUMNS * DEFAULT_GRID_ROWS

const EQUIPMENT_TYPE_TO_SLOT: Partial<Record<Item['type'], keyof Equipment>> = {
  weapon: 'weapon',
  armor: 'armor',
  helmet: 'helmet',
  horse: 'horse',
  accessory: 'accessory'
}

const COMPARABLE_STATS: { key: 'attack' | 'defense' | 'maxHpBonus' | 'critRate' | 'evasionRate'; label: string; icon: string; isRate?: boolean }[] = [
  { key: 'attack', label: '攻击', icon: ASSETS.ui.atk },
  { key: 'defense', label: '防御', icon: ASSETS.ui.armorValue },
  { key: 'maxHpBonus', label: '生命上限', icon: ASSETS.ui.medicine },
  { key: 'critRate', label: '暴击', icon: ASSETS.ui.criticalStrike, isRate: true },
  { key: 'evasionRate', label: '闪避', icon: ASSETS.ui.dodge, isRate: true }
]

const formatCompareValue = (value: number, isRate?: boolean): string => {
  if (isRate) return `${Math.round(value * 100)}%`
  return String(value)
}

const formatCompareDelta = (delta: number, isRate?: boolean): string => {
  if (isRate) {
    const pct = Math.round(delta * 100)
    return `${pct > 0 ? '+' : ''}${pct}%`
  }
  return `${delta > 0 ? '+' : ''}${delta}`
}

// 获取道具图片：优先用 item.image，否则用默认
const getItemImage = (item: Item): string => {
  if (item.image) return item.image
  const defaults: Record<string, string> = {
    weapon: ASSETS.equipment.weapon[0],
    armor: ASSETS.equipment.armor[0],
    helmet: ASSETS.equipment.helmet[0],
    horse: ASSETS.equipment.horse[0],
    accessory: ASSETS.equipment.accessory[0]
  }
  return defaults[item.type] || ASSETS.ui.chest
}

// 获取装备槽默认图片
const getSlotDefaultImage = (key: keyof Equipment): string => {
  if (key === 'weapon') return ASSETS.equipment.weapon[0]
  if (key === 'armor') return ASSETS.equipment.armor[0]
  if (key === 'helmet') return ASSETS.equipment.helmet[0]
  if (key === 'horse') return ASSETS.equipment.horse[0]
  if (key === 'accessory') return ASSETS.equipment.accessory[0]
  return ASSETS.ui.chest
}

export default function InventoryPage() {
  const { equipment, inventory, character, cycle, equipItem, unequipItem, useItem: consumeItem, isHydrated } = useGameStore()
  const [category, setCategory] = useState('全部')
  const inventoryScrollRef = useRef<HTMLDivElement | null>(null)
  const [selectedItem, setSelectedItem] = useState<{ item: Item; source: 'equipment' | 'inventory' } | null>(null)
  const [showCharacterModal, setShowCharacterModal] = useState(false)
  const [wishRewardModal, setWishRewardModal] = useState<{
    title: string
    story: string
    items?: Item[]
    gold?: number
  } | null>(null)

  const totalAttack = character.attack + (equipment.weapon?.attack || 0)
  const totalDefense = character.defense + (equipment.armor?.defense || 0)
  const effectiveMaxHp = character.maxHp + (equipment.helmet?.maxHpBonus || 0)
  const totalCritRate = Math.min(0.4, character.critRate + (equipment.accessory?.critRate || 0))
  const totalEvasionRate = Math.min(0.4, character.evasionRate + (equipment.horse?.evasionRate || 0))

  // 战斗力方案（稳定低膨胀版）：
  // 1) 基础战力以面板属性为核心
  // 2) 等级采用“平方参与、低倍率”增长，避免中后期膨胀过快
  // 3) 装备只看实际属性，不再使用 tier 加分，避免“低攻却高分”
  const basePower =
    character.attack * 5.4 +
    character.defense * 4.8 +
    character.maxHp * 0.22 +
    character.maxMp * 0.16 +
    character.critRate * 100 * 15 +
    character.evasionRate * 100 * 13
  const levelSquared = character.level * character.level
  const levelGrowthFactor = 1 + (levelSquared - 1) * 0.08

  const equipmentAttack = equipment.weapon?.attack || 0
  const equipmentDefense = equipment.armor?.defense || 0
  const equipmentHp = equipment.helmet?.maxHpBonus || 0
  const equipmentCrit = (equipment.accessory?.critRate || 0) * 100
  const equipmentEvasion = (equipment.horse?.evasionRate || 0) * 100
  const equipmentPower =
    equipmentAttack * 6.5 +
    equipmentDefense * 5.8 +
    equipmentHp * 0.28 +
    equipmentCrit * 18 +
    equipmentEvasion * 16
  const cycleEquipmentFactor = 1 + (cycle - 1) * 0.08
  const combatPower = Math.max(1, Math.round(basePower * levelGrowthFactor + equipmentPower * cycleEquipmentFactor))

  let rawFiltered = inventory
  if (category === '装备') {
    rawFiltered = inventory.filter(
      i => i.type === 'weapon' || i.type === 'armor' || i.type === 'helmet' || i.type === 'horse' || i.type === 'accessory'
    )
  } else if (category === '消耗品') {
    rawFiltered = inventory.filter(i => i.type === 'consumable')
  } else if (category !== '全部') {
    rawFiltered = inventory
  }

  // 消耗品按名字合并，其他保持原样
  const displayItems: { item: Item; count: number }[] = []
  const seen = new Map<string, number>()
  for (const item of rawFiltered) {
    if (item.type === 'consumable') {
      if (seen.has(item.name)) {
        displayItems[seen.get(item.name)!].count++
      } else {
        seen.set(item.name, displayItems.length)
        displayItems.push({ item, count: 1 })
      }
    } else {
      displayItems.push({ item, count: 1 })
    }
  }

  const filledSlotCount = Math.max(
    DEFAULT_GRID_SLOT_COUNT,
    Math.ceil(displayItems.length / GRID_COLUMNS) * GRID_COLUMNS
  )
  const gridSlotKeys = Array.from({ length: filledSlotCount }, (_, index) => `inventory-slot-${index + 1}`)

  useEffect(() => {
    const viewport = inventoryScrollRef.current
    if (!viewport) return
    viewport.scrollTo({ top: 0, behavior: 'auto' })
  }, [category])

  if (!isHydrated) {
    return <div className="px-2.5 pt-6 text-center text-sm text-amber-700">正在载入存档...</div>
  }

  return (
    <div className="ui-page-stack ui-page-with-nav px-2.5 pt-2.5 pb-2.5 flex flex-col">

      {/* 装备栏 */}
      <div className="flex-none">
        <div
          className="ui-panel-card ui-panel-body"
          style={{
            background: 'linear-gradient(180deg, #fef9f0 0%, #fef5e8 100%)',
            boxShadow: '0 4px 12px rgba(200,150,80,0.2), 0 2px 4px rgba(200,150,80,0.1), inset 0 1px 2px rgba(255,255,255,0.9)'
          }}
        >
          <div className="grid grid-cols-[56px_1fr_56px] gap-2 items-center" style={{ minHeight: '200px' }}>
            {/* 左列：武器 + 饰品 */}
            <div className="flex flex-col justify-around h-full gap-2">
              {['weapon', 'accessory'].map(key => {
                const slot = SLOT_CONFIG.find(s => s.key === key)!
                const item = equipment[slot.key]
                const imgSrc = item ? getItemImage(item) : getSlotDefaultImage(slot.key)
                return (
                  <div
                    key={slot.key}
                    onClick={() => item && setSelectedItem({ item, source: 'equipment' })}
                    className={`ui-card-icon border-[1.5px] cursor-pointer transition-all ${
                      item ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 hover:scale-105' : 'bg-white/60 border-dashed border-amber-200'
                    }`}
                    style={{
                      boxShadow: item ? '0 2px 6px rgba(200,150,80,0.15), inset 0 1px 1px rgba(255,255,255,0.8)' : 'none'
                    }}
                    title={item ? item.name : slot.label}
                  >
                    {item
                      ? (
                        <div style={getEquipmentGlowStyleByItem(item)}>
                          <GameImage src={imgSrc} alt={slot.label} size={42} />
                        </div>
                      )
                      : <span className="type-micro text-amber-200">{slot.label}</span>
                    }
                  </div>
                )
              })}
            </div>

            {/* 中列：角色 */}
            <div
              className="flex items-center justify-center cursor-pointer"
              onClick={() => setShowCharacterModal(true)}
              title="查看角色属性"
            >
              <div className="flex flex-col items-center">
                <GameImage src={ASSETS.players[cycle - 1]} alt="玩家" size={120} />
                <div className="type-micro mt-3 font-semibold text-amber-700">
                  战斗力：{combatPower}
                </div>
              </div>
            </div>

            {/* 右列：头盔 + 护甲 + 坐骑 */}
            <div className="flex flex-col justify-around h-full gap-2">
              {['helmet', 'armor', 'horse'].map(key => {
                const slot = SLOT_CONFIG.find(s => s.key === key)!
                const item = equipment[slot.key]
                const imgSrc = item ? getItemImage(item) : getSlotDefaultImage(slot.key)
                return (
                  <div
                    key={slot.key}
                    onClick={() => item && setSelectedItem({ item, source: 'equipment' })}
                    className={`ui-card-icon border-[1.5px] cursor-pointer transition-all ${
                      item ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 hover:scale-105' : 'bg-white/60 border-dashed border-amber-200'
                    }`}
                    style={{
                      boxShadow: item ? '0 2px 6px rgba(200,150,80,0.15), inset 0 1px 1px rgba(255,255,255,0.8)' : 'none'
                    }}
                    title={item ? item.name : slot.label}
                  >
                    {item
                      ? (
                        <div style={getEquipmentGlowStyleByItem(item)}>
                          <GameImage src={imgSrc} alt={slot.label} size={42} />
                        </div>
                      )
                      : <span className="type-micro text-amber-200">{slot.label}</span>
                    }
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 背包 */}
      <div
        className="ui-panel-card ui-panel-body flex flex-col flex-1 min-h-0"
        style={{
          background: 'linear-gradient(180deg, #fef9f0 0%, #fef5e8 100%)',
          boxShadow: '0 4px 12px rgba(200,150,80,0.2), 0 2px 4px rgba(200,150,80,0.1), inset 0 1px 2px rgba(255,255,255,0.9)'
        }}
      >
        <div className="flex items-center justify-between mb-2.5 gap-2">
          {/* 分类胶囊筛选 */}
          <div className="flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <div className="flex items-center gap-1 w-max">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`shrink-0 type-body px-2.5 py-1 rounded-full border transition-all font-medium ${
                    category === cat
                      ? 'bg-linear-to-r from-amber-400 to-yellow-300 border-amber-300 text-white'
                      : 'bg-white/80 border-amber-200 text-amber-700 hover:bg-amber-50'
                  }`}
                  style={category === cat ? { boxShadow: '0 2px 6px rgba(200,150,80,0.3)' } : {}}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          {/* 金币 */}
          <div className="shrink-0 flex items-center gap-1">
            <GameImage src={ASSETS.ui.gold} alt="金币" size={18} />
            <span className="type-panel-title font-bold text-amber-700">{character.gold}</span>
          </div>
        </div>

        <div ref={inventoryScrollRef} className="flex-1 min-h-0 overflow-y-auto ui-scrollbar-subtle">
          <div className="grid grid-cols-5 gap-1 content-start items-start">
            {gridSlotKeys.map((slotKey, i) => {
              const entry = displayItems[i]
              const item = entry?.item
              const count = entry?.count ?? 0
              const itemImage = item ? getItemImage(item) : null

              return (
                <div
                  key={slotKey}
                  onClick={() => item && setSelectedItem({ item, source: 'inventory' })}
                  className={`w-full aspect-square rounded-xl border-[1.5px] flex flex-col items-center justify-center cursor-pointer transition-all relative ${
                    item
                      ? `border-amber-200 bg-gray-50 hover:scale-95`
                      : 'bg-white/30 border-dashed border-amber-200'
                  }`}
                >
                  {item && itemImage && (
                    <>
                      {item.type === 'consumable' ? (
                        <GameImage src={itemImage} alt={item.name} size={42} />
                      ) : (
                        <div style={getEquipmentGlowStyleByItem(item)}>
                          <GameImage src={itemImage} alt={item.name} size={42} />
                        </div>
                      )}
                      {count > 1 && (
                        <span className="absolute bottom-0.5 right-1 type-micro font-bold text-amber-700">{count}</span>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <Navigation />

      {/* 人物属性弹窗 */}
      {showCharacterModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-200"
          onClick={() => setShowCharacterModal(false)}
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
              <GameImage src={ASSETS.players[useGameStore.getState().cycle - 1]} alt="玩家" size={64} />
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
              onClick={() => setShowCharacterModal(false)}
            >
              关闭
            </Button>
          </div>
        </div>
      )}

      {/* 道具信息弹窗 */}
      {selectedItem && (() => {
        const { item, source } = selectedItem
        const imgSrc = getItemImage(item)
        const typeLabels: Record<string, string> = {
          weapon: '武器', armor: '护甲', helmet: '头盔', horse: '坐骑', accessory: '饰品', consumable: '消耗品'
        }
        const isConsumable = item.type === 'consumable'
        const isEquipped = source === 'equipment'
        const stackCount = isConsumable ? inventory.filter(i => i.name === item.name).length : 1
        const compareSlot = isEquipped ? undefined : EQUIPMENT_TYPE_TO_SLOT[item.type]
        const equippedSameType = compareSlot ? equipment[compareSlot] : undefined
        const equipmentNameColor = item.type === 'consumable' ? undefined : getCycleColorByItem(item)

        const compareRows = equippedSameType
          ? COMPARABLE_STATS
              .map(({ key, label, icon, isRate }) => {
                const candidateValue = item[key] || 0
                const currentValue = equippedSameType[key] || 0
                if (candidateValue === 0 && currentValue === 0) return null

                const delta = candidateValue - currentValue
                let trendSymbol = '→'
                let trendClass = 'text-gray-500'
                if (delta > 0) {
                  trendSymbol = '↑'
                  trendClass = 'text-emerald-600'
                } else if (delta < 0) {
                  trendSymbol = '↓'
                  trendClass = 'text-rose-500'
                }

                return {
                  key,
                  label,
                  icon,
                  currentDisplay: formatCompareValue(currentValue, isRate),
                  candidateDisplay: formatCompareValue(candidateValue, isRate),
                  deltaDisplay: formatCompareDelta(delta, isRate),
                  trendSymbol,
                  trendClass
                }
              })
              .filter((row): row is NonNullable<typeof row> => row !== null)
          : []

        const handleAction = () => {
          if (isEquipped) {
            const slot = Object.keys(equipment).find(k => equipment[k as keyof Equipment]?.id === item.id) as keyof Equipment
            if (slot) unequipItem(slot)
            setSelectedItem(null)
          } else if (isConsumable) {
              const reward = consumeItem(item.id)
              setSelectedItem(null)
              if (reward) {
                setWishRewardModal({
                  title: reward.title,
                  story: reward.story,
                  items: reward.items,
                  gold: reward.gold
                })
              }
          } else {
            equipItem(item)
            setSelectedItem(null)
          }
        }

        let actionLabel = '穿戴'
        if (isEquipped) {
          actionLabel = '卸下装备'
        } else if (isConsumable) {
          actionLabel = '使用'
        }

        const actionClass = isConsumable
          ? 'w-full bg-linear-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white border-[1.5px] border-emerald-300'
          : 'w-full bg-linear-to-r from-amber-300 to-yellow-300 hover:from-amber-400 hover:to-yellow-400 text-amber-900 border-[1.5px] border-amber-300'

        return (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-200"
            onClick={() => setSelectedItem(null)}
          >
            <div
              className="w-4/5 max-w-[320px] rounded-2xl border-[1.5px] border-amber-200 p-5"
              style={{
                background: 'linear-gradient(180deg, #fef9f0 0%, #fef5e8 100%)',
                boxShadow: '0 8px 24px rgba(200,150,80,0.3), inset 0 1px 2px rgba(255,255,255,0.9)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-2.5">
                {item.type === 'consumable' ? (
                  <GameImage src={imgSrc} alt={item.name} size={56} />
                ) : (
                  <div style={getEquipmentGlowStyleByItem(item)}>
                    <GameImage src={imgSrc} alt={item.name} size={56} />
                  </div>
                )}
                <div className="flex-1">
                  <div className="type-card-title font-ui-bold mb-1" style={equipmentNameColor ? { color: equipmentNameColor } : undefined}>{item.name}</div>
                  <div className="type-meta text-primary-ui mb-1.5">
                    类型：{typeLabels[item.type]}
                    {isConsumable && stackCount > 0 && <span className="ml-2 text-muted-ui">持有 {stackCount} 个</span>}
                  </div>
                  {item.attack && <div className="type-meta text-red-500 flex items-center gap-1"><GameImage src={ASSETS.ui.atk} alt="攻击" size={13} /> 攻击 +{item.attack}</div>}
                  {item.defense && <div className="type-meta text-blue-500 flex items-center gap-1"><GameImage src={ASSETS.ui.armorValue} alt="防御" size={13} /> 防御 +{item.defense}</div>}
                  {item.maxHpBonus && <div className="type-meta text-rose-500 flex items-center gap-1"><GameImage src={ASSETS.ui.medicine} alt="生命" size={13} /> 生命上限 +{item.maxHpBonus}</div>}
                  {item.critRate && <div className="type-meta text-amber-600 flex items-center gap-1"><GameImage src={ASSETS.ui.criticalStrike} alt="暴击" size={13} /> 暴击 +{Math.round(item.critRate * 100)}%</div>}
                  {item.evasionRate && <div className="type-meta text-cyan-600 flex items-center gap-1"><GameImage src={ASSETS.ui.dodge} alt="闪避" size={13} /> 闪避 +{Math.round(item.evasionRate * 100)}%</div>}
                  {item.healHp && <div className="type-meta text-emerald-600">❤️ 生命恢复 +{item.healHp}</div>}
                  {item.healMp && <div className="type-meta text-sky-500">✨ 魔法恢复 +{item.healMp}</div>}
                  {item.healHpPct && <div className="type-meta text-emerald-600">❤️ 生命恢复 {item.healHpPct * 100}%</div>}
                  {item.healMpPct && <div className="type-meta text-sky-500">✨ 魔法恢复 {item.healMpPct * 100}%</div>}
                  {item.drainHpPct && <div className="type-meta text-purple-500">💀 生命消耗 {Math.round(item.drainHpPct * 100)}%（当前血量）→ 魔力回满</div>}
                </div>
              </div>
              {item.description && (
                <div className="ui-info-card ui-section-gap bg-amber-50/50">
                  <div className="type-meta text-secondary-ui leading-relaxed">{item.description}</div>
                </div>
              )}
              {compareRows.length > 0 && equippedSameType && (
                <div className="ui-info-card ui-section-gap bg-white/70">
                  <div className="type-meta font-ui-semibold text-primary-ui mb-1.5">
                    对比当前装备：
                    {' '}
                    <span>{equippedSameType.name}</span>
                  </div>
                  <div className="space-y-1.5">
                    {compareRows.map((row) => (
                      <div key={row.key} className="type-meta flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-secondary-ui shrink-0">
                          <GameImage src={row.icon} alt={row.label} size={12} />
                          <span>{row.label}</span>
                        </div>
                        <div className="text-right min-w-0">
                          <div className="text-secondary-ui">
                            {row.currentDisplay} → {row.candidateDisplay}
                            <span className={`ml-0.5 ${row.trendClass}`}>({row.trendSymbol}{row.deltaDisplay})</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button
                className={actionClass}
                style={{ boxShadow: '0 2px 6px rgba(245,158,11,0.2)' }}
                onClick={handleAction}
              >
                {actionLabel}
              </Button>
            </div>
          </div>
        )
      })()}

      {wishRewardModal && (
        <div
          className="fixed inset-0 bg-black/55 flex items-center justify-center z-220"
          onClick={() => setWishRewardModal(null)}
        >
          <div
            className="w-4/5 max-w-[320px] rounded-2xl border-[1.5px] border-amber-200 p-5"
            style={{
              background: 'linear-gradient(180deg, #fef9f0 0%, #fef5e8 100%)',
              boxShadow: '0 8px 24px rgba(200,150,80,0.3), inset 0 1px 2px rgba(255,255,255,0.9)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="type-card-title font-ui-bold text-primary-ui mb-2">{wishRewardModal.title}</div>
            <p className="type-meta text-secondary-ui leading-relaxed mb-2.5">{wishRewardModal.story}</p>

            {wishRewardModal.items && wishRewardModal.items.length > 0 && (
              <div className="ui-info-card ui-section-gap bg-amber-50/70 space-y-1.5">
                {wishRewardModal.items.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex items-center gap-2">
                    <GameImage src={item.image || ASSETS.ui.chest} alt={item.name} size={20} />
                    <span className="type-meta text-secondary-ui">{item.name}</span>
                  </div>
                ))}
              </div>
            )}

            {wishRewardModal.gold ? (
              <div className="ui-info-card ui-section-gap bg-amber-50/70 flex items-center gap-2">
                <GameImage src={ASSETS.ui.gold} alt="金币" size={20} />
                <span className="type-body font-ui-semibold text-primary-ui">金币 +{wishRewardModal.gold}</span>
              </div>
            ) : null}

            <Button
              className="w-full bg-linear-to-r from-amber-300 to-yellow-300 hover:from-amber-400 hover:to-yellow-400 text-amber-900 border-[1.5px] border-amber-300"
              onClick={() => setWishRewardModal(null)}
            >
              收下奖励
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
