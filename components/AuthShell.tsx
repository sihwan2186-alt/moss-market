import Link from 'next/link'
import { ReactNode } from 'react'

type AuthShellProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[#f7f1e8] px-4 py-10 text-[#18261d]">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="inline-flex text-sm font-semibold text-[#1d3124] underline underline-offset-4">
          Back to shop
        </Link>
      </div>

      <div className="mx-auto mt-8 w-full max-w-md rounded-[32px] bg-white p-8 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,_#111827_0%,_#334155_100%)] text-2xl font-black text-white">
          Shop
        </div>
        <h1 className="mt-6 text-center text-3xl font-black tracking-tight">{title}</h1>
        <p className="mt-3 text-center text-sm leading-6 text-[#5d6a61]">{subtitle}</p>

        <div className="mt-8 space-y-4">{children}</div>

        {footer && <div className="mt-6 text-center text-sm text-[#5d6a61]">{footer}</div>}
      </div>
    </div>
  )
}
