'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import AuthShell from '@/components/AuthShell'

export default function ForgetPassword() {
  const { messages: t } = useLanguage()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [resetUrl, setResetUrl] = useState('')
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSendCode = async () => {
    try {
      setIsLoading(true)
      setMessage('')
      setResetUrl('')
      setIsError(false)

      if (!email.trim()) {
        setIsError(true)
        setMessage(t.forgotPassword.enterEmail)
        return
      }

      const response = await fetch('/api/password-reset/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setIsError(true)
        setMessage(data.message ?? t.forgotPassword.requestFailed)
        return
      }

      setMessage(data.message ?? t.forgotPassword.demoNotice)
      setResetUrl(data.resetUrl ?? '')
    } catch {
      setIsError(true)
      setMessage(t.forgotPassword.requestFailed)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title={t.forgotPassword.title}
      subtitle={t.forgotPassword.subtitle}
      footer={
        <Link href="/auth?type=login" className="font-semibold text-[#1d3124] underline underline-offset-4">
          {t.forgotPassword.backToLogin}
        </Link>
      }
    >
      <input
        type="email"
        placeholder={t.forgotPassword.emailPlaceholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-2xl border border-black/10 bg-[#f9f7f2] px-4 py-3 outline-none transition focus:border-[#68806f]"
      />

      <button
        onClick={handleSendCode}
        disabled={isLoading}
        className="w-full rounded-full bg-[#1d3124] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#294532] disabled:cursor-wait disabled:opacity-60"
      >
        {isLoading ? t.forgotPassword.sending : t.forgotPassword.sendResetLink}
      </button>

      {message && <p className={`text-center text-sm ${isError ? 'text-[#b23a3a]' : 'text-[#2f6d43]'}`}>{message}</p>}
      {resetUrl && (
        <Link
          href={resetUrl}
          className="block text-center text-sm font-semibold text-[#1d3124] underline underline-offset-4"
        >
          Open reset link
        </Link>
      )}
    </AuthShell>
  )
}
