'use client'

import Link from 'next/link'
import { useState } from 'react'
import AuthShell from '@/components/AuthShell'

export default function ForgetPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSendCode = async () => {
    try {
      setIsLoading(true)
      setMessage('')
      setIsError(false)

      if (!email.trim()) {
        setIsError(true)
        setMessage('Please enter your email address first.')
        return
      }

      setMessage('Demo mode: password reset email sending is not connected yet.')
    } catch {
      setIsError(true)
      setMessage('Could not process the request.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we will simulate the reset flow for now."
      footer={
        <Link href="/auth?type=login" className="font-semibold text-[#1d3124] underline underline-offset-4">
          Back to login
        </Link>
      }
    >
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-2xl border border-black/10 bg-[#f9f7f2] px-4 py-3 outline-none transition focus:border-[#68806f]"
      />

      <button
        onClick={handleSendCode}
        disabled={isLoading}
        className="w-full rounded-full bg-[#1d3124] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#294532] disabled:cursor-wait disabled:opacity-60"
      >
        {isLoading ? 'Sending...' : 'Send reset link'}
      </button>

      {message && <p className={`text-center text-sm ${isError ? 'text-[#b23a3a]' : 'text-[#2f6d43]'}`}>{message}</p>}
    </AuthShell>
  )
}
