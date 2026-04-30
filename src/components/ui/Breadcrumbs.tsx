'use client'
import { ChevronRight, Home } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useT } from '@/lib/language-store'

interface BreadcrumbItem {
  label: string
  action?: () => void
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const { navigate } = useAppStore()
  const t = useT()

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm mb-4 flex-wrap">
      <button onClick={() => navigate('home')} className="flex items-center gap-1 text-gray-400 hover:text-[#C59F00] transition-colors">
        <Home className="w-3.5 h-3.5" />
        <span>{t('breadcrumbs.home')}</span>
      </button>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          {i === items.length - 1 ? (
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{item.label}</span>
          ) : (
            <button onClick={item.action} className="text-gray-400 hover:text-[#C59F00] transition-colors truncate max-w-[200px]">{item.label}</button>
          )}
        </span>
      ))}
    </nav>
  )
}
