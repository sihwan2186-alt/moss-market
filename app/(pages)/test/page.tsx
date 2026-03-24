'use client'

import Link from 'next/link'
import { useState } from 'react'
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
  const [result, setResult] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(false)

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
        message: 'Request failed before the API could respond.',
        error: 'Check whether the development server is running.',
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
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#577363]">System check</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">MongoDB connection health</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#49584c]">
            Use this page before deployment to confirm the app can reach MongoDB and read the users collection.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={checkDatabase}
              disabled={loading}
              className="rounded-full bg-[#1d3124] px-6 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? 'Checking...' : 'Run health check'}
            </button>
            <Link
              href="/"
              className="rounded-full border border-[#1d3124] px-6 py-3 text-sm font-semibold text-[#1d3124]"
            >
              Back to shop
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">Step 1</p>
            <p className="mt-3 font-bold">Check `.env.local`</p>
            <p className="mt-2 text-sm text-[#5d6a61]">Confirm `MONGODB_URI` and `JWT_SECRET` are present.</p>
          </div>
          <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">Step 2</p>
            <p className="mt-3 font-bold">Atlas network access</p>
            <p className="mt-2 text-sm text-[#5d6a61]">
              Allow your current IP or deployment environment in MongoDB Atlas.
            </p>
          </div>
          <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">Step 3</p>
            <p className="mt-3 font-bold">Run the API test</p>
            <p className="mt-2 text-sm text-[#5d6a61]">A successful response means the server reached MongoDB.</p>
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
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#68806f]">Result</p>
                <h2 className="mt-2 text-2xl font-black">{result.message}</h2>
              </div>
              <span
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] ${
                  result.ok ? 'bg-[#e8f5ea] text-[#1e6b3a]' : 'bg-[#fde8e8] text-[#9a2f2f]'
                }`}
              >
                {result.ok ? 'Healthy' : 'Needs attention'}
              </span>
            </div>

            {result.ok ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[20px] bg-[#faf7f1] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">Database</p>
                  <p className="mt-3 font-bold">{result.database}</p>
                </div>
                <div className="rounded-[20px] bg-[#faf7f1] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">Host</p>
                  <p className="mt-3 break-all font-bold">{result.host}</p>
                </div>
                <div className="rounded-[20px] bg-[#faf7f1] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">Ready state</p>
                  <p className="mt-3 font-bold">{result.readyState}</p>
                </div>
                <div className="rounded-[20px] bg-[#faf7f1] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">Users count</p>
                  <p className="mt-3 font-bold">{result.collections?.users ?? 0}</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-3 text-sm text-[#7a3d3d]">
                <p>Error: {result.error ?? 'Unknown error'}</p>
                {result.hint && <p>Hint: {result.hint}</p>}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
