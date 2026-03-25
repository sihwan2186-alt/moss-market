'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import AuthShell from '@/components/AuthShell'

export default function SignUp() {
  const { messages: t } = useLanguage()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [hint, setHint] = useState('')
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignUp = async () => {
    try {
      setIsLoading(true)
      setMessage('')
      setHint('')
      setIsError(false)

      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setIsError(true)
        setMessage(data.message ?? t.signup.signUpFailed)
        setHint(data.hint ?? '')
        return
      }

      setMessage(data.message ?? t.signup.accountCreated)
      setHint(data.mode === 'local-fallback' ? t.signup.fallbackHint : '')
      setName('')
      setEmail('')
      setPassword('')

      window.setTimeout(() => {
        router.push('/auth?type=login')
        router.refresh()
      }, 700)
    } catch {
      setIsError(true)
      setMessage(t.signup.unableToReachServer)
      setHint('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title={t.signup.title}
      subtitle={t.signup.subtitle}
      footer={
        <Link href="/auth?type=login" className="font-semibold text-[#1d3124] underline underline-offset-4">
          {t.signup.alreadyHaveAccount}
        </Link>
      }
    >
      <input
        type="text"
        placeholder={t.signup.namePlaceholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-2xl border border-black/10 bg-[#f9f7f2] px-4 py-3 outline-none transition focus:border-[#68806f]"
      />
      <input
        type="email"
        placeholder={t.signup.emailPlaceholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-2xl border border-black/10 bg-[#f9f7f2] px-4 py-3 outline-none transition focus:border-[#68806f]"
      />
      <input
        type="password"
        placeholder={t.signup.passwordPlaceholder}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-2xl border border-black/10 bg-[#f9f7f2] px-4 py-3 outline-none transition focus:border-[#68806f]"
      />

      <button
        onClick={handleSignUp}
        disabled={isLoading}
        className="w-full rounded-full bg-[#1d3124] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#294532] disabled:cursor-wait disabled:opacity-60"
      >
        {isLoading ? t.signup.creatingAccount : t.signup.signUp}
      </button>

      {message && <p className={`text-center text-sm ${isError ? 'text-[#b23a3a]' : 'text-[#2f6d43]'}`}>{message}</p>}
      {hint && <p className="text-center text-sm text-[#5d6a61]">{hint}</p>}
    </AuthShell>
  )
}
