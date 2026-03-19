'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import Navigation from '@/components/Navigation'
import GameImage from '@/components/GameImage'
import LightToast from '@/components/ui/light-toast'
import { ASSETS } from '@/app/config/imageAssets'
import { SHOP_ITEMS, type ShopCategory, type ShopItem } from '@/app/config/shopData'
import { Button } from '@/components/ui/button'

const CATEGORIES: { label: string; value: ShopCategory }[] = [
  { label: '全部', value: 'all' },
  { label: '补血', value: 'hp' },
  { label: '回蓝', value: 'mp' },
]

const GRID_COLUMNS = 5
const DEFAULT_GRID_ROWS = 10
const DEFAULT_GRID_SLOT_COUNT = GRID_COLUMNS * DEFAULT_GRID_ROWS

export default function ShopPage() {
  const { character, buyShopItem, isHydrated } = useGameStore()
  const [category, setCategory] = useState<ShopCategory>('all')
  const shopScrollRef = useRef<HTMLDivElement | null>(null)
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
  const [purchaseQuantity, setPurchaseQuantity] = useState(1)
  const [toastText, setToastText] = useState('')

  const filteredItems = useMemo(() => {
    if (category === 'all') return SHOP_ITEMS
    return SHOP_ITEMS.filter((entry) => entry.category === category)
  }, [category])

  const itemEntries = filteredItems
  const filledSlotCount = Math.max(
    DEFAULT_GRID_SLOT_COUNT,
    Math.ceil(itemEntries.length / GRID_COLUMNS) * GRID_COLUMNS
  )
  const gridSlotKeys = useMemo(
    () => Array.from({ length: filledSlotCount }, (_, index) => `shop-slot-${index + 1}`),
    [filledSlotCount]
  )

  const maxAffordableQuantity = selectedItem
    ? Math.floor(character.gold / selectedItem.price)
    : 0
  const maxSelectableQuantity = maxAffordableQuantity > 0 ? maxAffordableQuantity : 1
  const clampedPurchaseQuantity = selectedItem
    ? Math.max(1, Math.min(purchaseQuantity, maxSelectableQuantity))
    : 1
  const totalPrice = selectedItem ? selectedItem.price * clampedPurchaseQuantity : 0

  useEffect(() => {
    const viewport = shopScrollRef.current
    if (!viewport) return
    viewport.scrollTo({ top: 0, behavior: 'auto' })
  }, [category])

  if (!isHydrated) {
    return <div className="px-2.5 pt-6 text-center text-sm text-amber-700">正在载入存档...</div>
  }

  const handleBuy = () => {
    if (!selectedItem) return
    const result = buyShopItem(selectedItem.id, clampedPurchaseQuantity)
    setToastText(result.message)
    setTimeout(() => setToastText(''), 1500)
    if (result.success) {
      setSelectedItem(null)
      setPurchaseQuantity(1)
    }
  }

  const quantityButtonClass = 'w-12 h-9 rounded-lg border border-amber-300 type-body font-ui-semibold text-amber-700 disabled:opacity-40 shrink-0'

  return (
    <div className="ui-page-stack ui-page-with-nav px-2.5 pt-2.5 pb-2.5 flex flex-col">
      <div
        className="ui-panel-card ui-panel-body flex-1 min-h-0 flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #fef9f0 0%, #fef5e8 100%)',
          boxShadow: '0 4px 12px rgba(200,150,80,0.2), 0 2px 4px rgba(200,150,80,0.1), inset 0 1px 2px rgba(255,255,255,0.9)',
        }}
      >
        <div className="flex items-center justify-between mb-2.5 gap-2">
          <div className="flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <div className="flex items-center gap-1 w-max">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`shrink-0 type-body px-2.5 py-1 rounded-full border transition-all font-medium ${
                    category === cat.value
                      ? 'bg-linear-to-r from-amber-400 to-yellow-300 border-amber-300 text-white'
                      : 'bg-white/80 border-amber-200 text-amber-700 hover:bg-amber-50'
                  }`}
                  style={category === cat.value ? { boxShadow: '0 2px 6px rgba(200,150,80,0.3)' } : {}}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1">
            <GameImage src={ASSETS.ui.gold} alt="金币" size={18} />
            <span className="type-panel-title font-bold text-amber-700">{character.gold}</span>
          </div>
        </div>

        <div ref={shopScrollRef} className="flex-1 min-h-0 overflow-y-auto ui-scrollbar-subtle">
          <div className="grid grid-cols-5 gap-1 content-start items-start">
            {gridSlotKeys.map((slotKey, index) => {
              const entry = itemEntries[index]
              return (
                <div
                  key={slotKey}
                  onClick={() => {
                    if (!entry) return
                    setSelectedItem(entry)
                    setPurchaseQuantity(1)
                  }}
                  className={`w-full aspect-square rounded-xl border-[1.5px] flex items-center justify-center cursor-pointer transition-all relative overflow-hidden self-start pt-1 pb-3 ${
                    entry
                      ? 'border-amber-200 bg-gray-50 hover:scale-95'
                      : 'bg-white/30 border-dashed border-amber-200'
                  }`}
                >
                  {entry && (
                    <>
                      <div className="flex items-center justify-center">
                        <GameImage src={entry.item.image || ASSETS.ui.chest} alt={entry.name} size={42} />
                      </div>
                      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 type-micro text-[10px] leading-none text-amber-700 flex items-center gap-0.5 whitespace-nowrap">
                        <GameImage src={ASSETS.ui.gold} alt="金币" size={10} />
                        <span>{entry.price}</span>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <Navigation />

      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-200" onClick={() => setSelectedItem(null)}>
          <div
            className="w-4/5 max-w-[320px] rounded-2xl border-[1.5px] border-amber-200 p-5"
            style={{
              background: 'linear-gradient(180deg, #fef9f0 0%, #fef5e8 100%)',
              boxShadow: '0 8px 24px rgba(200,150,80,0.3), inset 0 1px 2px rgba(255,255,255,0.9)',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-2.5">
              <GameImage src={selectedItem.item.image || ASSETS.ui.chest} alt={selectedItem.name} size={56} />
              <div className="flex-1">
                <div className="type-card-title font-ui-bold mb-1 text-amber-700">{selectedItem.name}</div>
                <div className="type-meta text-primary-ui mb-1.5">类型：消耗品</div>
                {selectedItem.item.healHp && <div className="type-meta text-emerald-600">❤️ 生命恢复 +{selectedItem.item.healHp}</div>}
                {selectedItem.item.healHpPct && <div className="type-meta text-emerald-600">❤️ 生命恢复 {selectedItem.item.healHpPct * 100}%</div>}
                {selectedItem.item.healMp && <div className="type-meta text-sky-500">✨ 魔法恢复 +{selectedItem.item.healMp}</div>}
                {selectedItem.item.healMpPct && <div className="type-meta text-sky-500">✨ 魔法恢复 {selectedItem.item.healMpPct * 100}%</div>}
              </div>
            </div>

            {selectedItem.item.description && (
              <div className="ui-info-card ui-section-gap bg-amber-50/50">
                <div className="type-meta text-secondary-ui leading-relaxed">{selectedItem.item.description}</div>
              </div>
            )}

            <div className="ui-info-card ui-section-gap bg-amber-50/70 flex items-center justify-between">
              <div className="type-meta text-secondary-ui">单价</div>
              <div className="type-body font-ui-semibold text-primary-ui flex items-center gap-1">
                <GameImage src={ASSETS.ui.gold} alt="金币" size={16} />
                {selectedItem.price}
              </div>
            </div>

            <div className="ui-info-card ui-section-gap bg-amber-50/70">
              <div className="flex items-center justify-between mb-1.5">
                <div className="type-meta text-secondary-ui">购买数量</div>
                <div className="type-micro text-muted-ui">可购上限 {maxAffordableQuantity}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={quantityButtonClass}
                  onClick={() => setPurchaseQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={maxAffordableQuantity <= 0 || clampedPurchaseQuantity <= 1}
                >
                  -
                </button>
                <div className="flex-1 text-center type-panel-title font-ui-semibold text-amber-800">{clampedPurchaseQuantity}</div>
                <button
                  type="button"
                  className={quantityButtonClass}
                  onClick={() => setPurchaseQuantity((prev) => Math.min(maxAffordableQuantity, prev + 1))}
                  disabled={maxAffordableQuantity <= 0 || clampedPurchaseQuantity >= maxAffordableQuantity}
                >
                  +
                </button>
                <button
                  type="button"
                  className={quantityButtonClass}
                  onClick={() => maxAffordableQuantity > 0 && setPurchaseQuantity(maxAffordableQuantity)}
                  disabled={maxAffordableQuantity <= 0 || clampedPurchaseQuantity === maxAffordableQuantity}
                >
                  最大
                </button>
              </div>
            </div>

            <Button
              className="w-full bg-linear-to-r from-amber-300 to-yellow-300 hover:from-amber-400 hover:to-yellow-400 text-amber-900 border-[1.5px] border-amber-300"
              onClick={handleBuy}
              disabled={maxAffordableQuantity <= 0}
            >
              {maxAffordableQuantity <= 0 ? (
                '金币不足'
              ) : (
                <span className="inline-flex items-center justify-center gap-1.5">
                  <span className="inline-flex items-center gap-1">
                    <GameImage src={ASSETS.ui.gold} alt="金币" size={14} />
                    <span>{totalPrice}</span>
                  </span>
                </span>
              )}
            </Button>
          </div>
        </div>
      )}

      <LightToast message={toastText} zIndexClassName="z-2100" />
    </div>
  )
}
