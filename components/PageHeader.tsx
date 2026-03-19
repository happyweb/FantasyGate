import GameImage from './GameImage'

interface PageHeaderProps {
  title: string
  icon: string
}

export default function PageHeader({ title, icon }: Readonly<PageHeaderProps>) {
  return (
    <div
      className="text-center py-2.5 mb-2.5 rounded-2xl border-[1.5px] border-amber-200"
      style={{
        background: 'linear-gradient(180deg, #fef9f0 0%, #fef5e8 100%)',
        boxShadow: '0 4px 12px rgba(200,150,80,0.2), inset 0 1px 2px rgba(255,255,255,0.9)'
      }}
    >
      <div className="flex items-center justify-center gap-2">
        <GameImage src={icon} alt={title} size={28} />
        <h1 className="type-page-title font-bold text-amber-700" style={{ textShadow: '0 2px 4px rgba(200,150,80,0.15)' }}>
          {title}
        </h1>
      </div>
    </div>
  )
}
