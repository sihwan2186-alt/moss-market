'use client'

import Link from 'next/link'
import { ReactNode } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import { Locale } from '@/lib/i18n'

type AuthShellProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  const { locale, messages: t, setLocale } = useLanguage()

  return (
    <div className="min-h-screen bg-[#f7f1e8] px-4 py-10 text-[#18261d]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <Link href="/" className="inline-flex text-sm font-semibold text-[#1d3124] underline underline-offset-4">
          {t.authShell.backToShop}
        </Link>
        <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white/70 p-1 text-xs font-bold uppercase">
          {(['en', 'ko'] as Locale[]).map((option) => (
            <button
              key={option}
              onClick={() => setLocale(option)}
              className={`rounded-full px-3 py-1 transition ${
                locale === option ? 'bg-[#1d3124] text-white' : 'text-[#506255]'
              }`}
              type="button"
              aria-label={`${t.header.language}: ${option.toUpperCase()}`}
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-md rounded-[32px] bg-white p-8 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,_#111827_0%,_#334155_100%)] text-2xl font-black text-white">
          {t.authShell.shopLabel}
        </div>
        <h1 className="mt-6 text-center text-3xl font-black tracking-tight">{title}</h1>
        <p className="mt-3 text-center text-sm leading-6 text-[#5d6a61]">{subtitle}</p>

        <div className="mt-8 space-y-4">{children}</div>

        {footer && <div className="mt-6 text-center text-sm text-[#5d6a61]">{footer}</div>}
      </div>
    </div>
  )
}
