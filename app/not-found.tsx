'use client'

import Link from 'next/link'
import { useLanguage } from '@/components/LanguageProvider'

export default function NotFound() {
  const { messages: t } = useLanguage()

  return (
    <div className="min-h-screen bg-[#f7f1e8] px-6 py-12 text-[#18261d]">
      <main className="mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center rounded-[36px] bg-white p-10 text-center shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#68806f]">404</p>
        <h1 className="mt-4 text-5xl font-black tracking-tight">{t.notFound.title}</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-[#5d6a61]">{t.notFound.description}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-full bg-[#1d3124] px-6 py-3 text-sm font-semibold text-white">
            {t.notFound.goToShop}
          </Link>
          <Link
            href="/health"
            className="rounded-full border border-[#1d3124] px-6 py-3 text-sm font-semibold text-[#1d3124]"
          >
            {t.notFound.openHealthCheck}
          </Link>
        </div>
      </main>
    </div>
  )
}
