'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import AuthShell from '@/components/AuthShell'
import ForgetPassword from './ForgetPass'
import SignUp from './Signup'

function AuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams.get('type')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    try {
      setIsLoading(true)
      setMessage('')
      setIsError(false)

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (!result?.ok) {
        setIsError(true)
        setMessage('Login failed. Please check your email and password.')
        return
      }

      setMessage('Login successful.')
      setEmail('')
      setPassword('')

      window.setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 400)
    } catch {
      setIsError(true)
      setMessage('Unable to reach the server.')
    } finally {
      setIsLoading(false)
    }
  }

  if (type === 'sign-up') {
    return <SignUp />
  }

  if (type === 'forgetpass') {
    return <ForgetPassword />
  }

  return (
    <AuthShell
      title="Login"
      subtitle="Sign in to your customer account."
      footer={
        <>
          <Link href="/auth?type=forgetpass" className="font-semibold text-[#1d3124] underline underline-offset-4">
            Forgot password?
          </Link>
          <p className="mt-3">
            Need an account?{' '}
            <Link href="/auth?type=sign-up" className="font-semibold text-[#1d3124] underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </>
      }
    >
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-2xl border border-black/10 bg-[#f9f7f2] px-4 py-3 outline-none transition focus:border-[#68806f]"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-2xl border border-black/10 bg-[#f9f7f2] px-4 py-3 outline-none transition focus:border-[#68806f]"
      />

      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="w-full rounded-full bg-[#1d3124] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#294532] disabled:cursor-wait disabled:opacity-60"
      >
        {isLoading ? 'Signing in...' : 'Login'}
      </button>

      {message && <p className={`text-center text-sm ${isError ? 'text-[#b23a3a]' : 'text-[#2f6d43]'}`}>{message}</p>}
    </AuthShell>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[#5d6a61]">Loading...</div>}>
      <AuthContent />
    </Suspense>
  )
}
