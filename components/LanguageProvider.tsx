'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Locale, Messages, messages } from '@/lib/i18n'

type LanguageContextValue = {
  locale: Locale
  messages: Messages
  setLocale: (locale: Locale) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

type LanguageProviderProps = {
  initialLocale: Locale
  children: React.ReactNode
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export function LanguageProvider({ initialLocale, children }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  useEffect(() => {
    setLocaleState(initialLocale)
  }, [initialLocale])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale)
    document.documentElement.lang = nextLocale
    document.cookie = `locale=${nextLocale}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`
  }

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      messages: messages[locale],
      setLocale,
    }),
    [locale]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider.')
  }

  return context
}
