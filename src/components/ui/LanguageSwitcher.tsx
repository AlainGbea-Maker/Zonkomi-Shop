'use client'

import { useLanguageStore, type Language } from '@/lib/language-store'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguageStore()

  const nextLang: Language = language === 'en' ? 'fr' : 'en'
  const label = language === 'en' ? 'FR' : 'EN'

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-1 text-gray-300 hover:text-white hover:bg-white/10 h-auto px-2 py-0.5 text-xs font-medium rounded transition-colors"
    >
      <Globe className="w-3.5 h-3.5" />
      <span>{label}</span>
    </Button>
  )
}
