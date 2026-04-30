import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { translations } from './i18n'

// Re-export for convenience
export { translations } from './i18n'

export type Language = 'en' | 'fr'

interface LanguageStore {
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
      toggleLanguage: () => set({ language: get().language === 'en' ? 'fr' : 'en' }),
    }),
    {
      name: 'zonkomi-language',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} }
        }
        return localStorage
      }),
      skipHydration: true,
    }
  )
)

export function useT() {
  const { language } = useLanguageStore()
  return (key: string, params?: Record<string, string | number>): string => {
    let text = translations[language][key] || translations['en'][key] || key
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v))
      })
    }
    return text
  }
}
