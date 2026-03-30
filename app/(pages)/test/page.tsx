'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import StoreHeader from '@/components/StoreHeader'

type HealthResponse = {
  ok: boolean
  message: string
  database?: string
  host?: string
  readyState?: number
  collections?: {
    users: number
  }
  error?: string
  hint?: string
}

export default function DatabaseCheckPage() {
  const { messages: t } = useLanguage()
  const [result, setResult] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const hasDiagnosticDetails = Boolean(
    result?.database || result?.host || result?.readyState !== undefined || result?.collections?.users !== undefined
  )

  const checkDatabase = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/test', {
        cache: 'no-store',
      })
      const data = (await response.json()) as HealthResponse
      setResult(data)
    } catch {
      setResult({
        ok: false,
        message: t.health.requestFailed,
        error: t.health.serverHint,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f1e8] text-[#18261d]">
      <StoreHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <section className="rounded-[36px] bg-[radial-gradient(circle_at_top_left,_rgba(108,148,123,0.28),_transparent_38%),linear-gradient(135deg,_#efe5d6_0%,_#f8f2ea_48%,_#e4ecdf_100%)] p-8 shadow-[0_25px_80px_rgba(23,31,26,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#577363]">{t.health.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">{t.health.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#49584c]">{t.health.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={checkDatabase}
              disabled={loading}
              className="rounded-full bg-[#1d3124] px-6 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? t.health.checking : t.health.runHealthCheck}
            </button>
            <Link
              href="/"
              className="rounded-full border border-[#1d3124] px-6 py-3 text-sm font-semibold text-[#1d3124]"
            >
              {t.health.backToShop}
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">{t.health.step1}</p>
            <p className="mt-3 font-bold">{t.health.step1Title}</p>
            <p className="mt-2 text-sm text-[#5d6a61]">{t.health.step1Description}</p>
          </div>
          <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">{t.health.step2}</p>
            <p className="mt-3 font-bold">{t.health.step2Title}</p>
            <p className="mt-2 text-sm text-[#5d6a61]">{t.health.step2Description}</p>
          </div>
          <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">{t.health.step3}</p>
            <p className="mt-3 font-bold">{t.health.step3Title}</p>
            <p className="mt-2 text-sm text-[#5d6a61]">{t.health.step3Description}</p>
          </div>
        </section>

        {result && (
          <section
            className={`mt-8 rounded-[28px] p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)] ${
              result.ok ? 'bg-white' : 'border border-[#e1c9c9] bg-[#fff1f1]'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#68806f]">{t.health.result}</p>
                <h2 className="mt-2 text-2xl font-black">{result.message}</h2>
              </div>
              <span
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] ${
                  result.ok ? 'bg-[#e8f5ea] text-[#1e6b3a]' : 'bg-[#fde8e8] text-[#9a2f2f]'
                }`}
              >
                {result.ok ? t.health.healthy : t.health.needsAttention}
              </span>
            </div>

            {result.ok && hasDiagnosticDetails ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[20px] bg-[#faf7f1] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                    {t.health.database}
                  </p>
                  <p className="mt-3 font-bold">{result.database}</p>
                </div>
                <div className="rounded-[20px] bg-[#faf7f1] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">{t.health.host}</p>
                  <p className="mt-3 break-all font-bold">{result.host}</p>
                </div>
                <div className="rounded-[20px] bg-[#faf7f1] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                    {t.health.readyState}
                  </p>
                  <p className="mt-3 font-bold">{result.readyState}</p>
                </div>
                <div className="rounded-[20px] bg-[#faf7f1] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                    {t.health.usersCount}
                  </p>
                  <p className="mt-3 font-bold">{result.collections?.users ?? 0}</p>
                </div>
              </div>
            ) : !result.ok && (result.error || result.hint) ? (
              <div className="mt-6 space-y-3 text-sm text-[#7a3d3d]">
                <p>
                  {t.health.errorLabel}: {result.error ?? 'Unknown error'}
                </p>
                {result.hint && (
                  <p>
                    {t.health.hintLabel}: {result.hint}
                  </p>
                )}
              </div>
            ) : null}
          </section>
        )}
      </main>
    </div>
  )
}
