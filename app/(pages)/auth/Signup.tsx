'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import AuthShell from '@/components/AuthShell'

export default function SignUp() {
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
        setMessage(data.message ?? 'Sign up failed.')
        setHint(data.hint ?? '')
        return
      }

      setMessage(data.message ?? 'Account created successfully.')
      setHint(data.mode === 'local-fallback' ? 'Saved in local fallback mode because MongoDB is unavailable.' : '')
      setName('')
      setEmail('')
      setPassword('')

      window.setTimeout(() => {
        router.push('/auth?type=login')
        router.refresh()
      }, 700)
    } catch {
      setIsError(true)
      setMessage('Unable to reach the server.')
      setHint('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Create your customer account to start shopping."
      footer={
        <Link href="/auth?type=login" className="font-semibold text-[#1d3124] underline underline-offset-4">
          Already have an account? Sign in
        </Link>
      }
    >
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-2xl border border-black/10 bg-[#f9f7f2] px-4 py-3 outline-none transition focus:border-[#68806f]"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-2xl border border-black/10 bg-[#f9f7f2] px-4 py-3 outline-none transition focus:border-[#68806f]"
      />
      <input
        type="password"
        placeholder="Password (min 8 chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-2xl border border-black/10 bg-[#f9f7f2] px-4 py-3 outline-none transition focus:border-[#68806f]"
      />

      <button
        onClick={handleSignUp}
        disabled={isLoading}
        className="w-full rounded-full bg-[#1d3124] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#294532] disabled:cursor-wait disabled:opacity-60"
      >
        {isLoading ? 'Creating account...' : 'Sign up'}
      </button>

      {message && <p className={`text-center text-sm ${isError ? 'text-[#b23a3a]' : 'text-[#2f6d43]'}`}>{message}</p>}
      {hint && <p className="text-center text-sm text-[#5d6a61]">{hint}</p>}
    </AuthShell>
  )
}
