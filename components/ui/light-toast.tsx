import React from 'react'

type LightToastProps = {
  message: string
  zIndexClassName?: string
}

export default function LightToast({ message, zIndexClassName = 'z-1000' }: Readonly<LightToastProps>) {
  if (!message) return null

  return (
    <div className={`fixed inset-0 ${zIndexClassName} pointer-events-none flex items-center justify-center px-4`}>
      <div className="type-body rounded-full border border-amber-200 bg-amber-50/95 px-3 py-1.5 text-amber-700 shadow-[0_6px_18px_rgba(200,150,80,0.18)] backdrop-blur-sm">
        {message}
      </div>
    </div>
  )
}
