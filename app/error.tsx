'use client'

import Link from 'next/link'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="bg-[#f7f1e8] text-[#18261d]">
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-12">
          <div className="w-full rounded-[36px] bg-white p-10 text-center shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#68806f]">Unexpected error</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight">Something went wrong</h1>
            <p className="mt-5 text-base leading-7 text-[#5d6a61]">
              The page hit an unexpected problem. You can retry the action or return to the storefront.
            </p>
            <p className="mt-4 text-sm text-[#7a3d3d]">{error.message}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={reset} className="rounded-full bg-[#1d3124] px-6 py-3 text-sm font-semibold text-white">
                Try again
              </button>
              <Link
                href="/"
                className="rounded-full border border-[#1d3124] px-6 py-3 text-sm font-semibold text-[#1d3124]"
              >
                Go to shop
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
