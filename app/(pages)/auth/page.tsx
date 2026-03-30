'use client'

import type { FormEvent } from 'react'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useLanguage } from '@/components/LanguageProvider'
import AuthShell from '@/components/AuthShell'
import ForgetPassword from './ForgetPass'
import SignUp from './Signup'

function AuthContent() {
  const { messages: t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams.get('type')
  const isAdminLogin = type === 'admin-login'

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
        loginMode: isAdminLogin ? 'admin' : 'customer',
        redirect: false,
      })

      if (!result?.ok) {
        setIsError(true)
        setMessage(isAdminLogin ? t.auth.adminLoginFailed : t.auth.loginFailed)
        return
      }

      setMessage(isAdminLogin ? t.auth.adminLoginSuccess : t.auth.loginSuccess)
      setEmail('')
      setPassword('')

      window.setTimeout(() => {
        router.push(isAdminLogin ? '/admin/products' : '/')
        router.refresh()
      }, 400)
    } catch {
      setIsError(true)
      setMessage(t.auth.unableToReachServer)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await handleLogin()
  }

  if (type === 'sign-up') {
    return <SignUp />
  }

  if (type === 'forgetpass') {
    return <ForgetPassword />
  }

  return (
    <AuthShell
      title={isAdminLogin ? t.auth.adminLoginTitle : t.auth.loginTitle}
      subtitle={isAdminLogin ? t.auth.adminLoginSubtitle : t.auth.loginSubtitle}
      footer={
        <>
          <Link href="/auth?type=forgetpass" className="font-semibold text-[#1d3124] underline underline-offset-4">
            {t.auth.forgotPassword}
          </Link>
          {isAdminLogin ? (
            <p className="mt-3">
              {t.auth.needCustomerAccess}{' '}
              <Link href="/auth?type=login" className="font-semibold text-[#1d3124] underline underline-offset-4">
                {t.auth.customerLogin}
              </Link>
            </p>
          ) : (
            <>
              <p className="mt-3">
                {t.auth.needAccount}{' '}
                <Link href="/auth?type=sign-up" className="font-semibold text-[#1d3124] underline underline-offset-4">
                  {t.auth.signUp}
                </Link>
              </p>
              <p className="mt-3">
                {t.auth.needAdminAccess}{' '}
                <Link
                  href="/auth?type=admin-login"
                  className="font-semibold text-[#1d3124] underline underline-offset-4"
                >
                  {t.header.adminLogin}
                </Link>
              </p>
            </>
          )}
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder={t.auth.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border border-black/10 bg-[#f9f7f2] px-4 py-3 outline-none transition focus:border-[#68806f]"
        />
        <input
          type="password"
          placeholder={t.auth.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-2xl border border-black/10 bg-[#f9f7f2] px-4 py-3 outline-none transition focus:border-[#68806f]"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full bg-[#1d3124] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#294532] disabled:cursor-wait disabled:opacity-60"
        >
          {isLoading ? t.auth.signingIn : t.auth.login}
        </button>

        {message && <p className={`text-center text-sm ${isError ? 'text-[#b23a3a]' : 'text-[#2f6d43]'}`}>{message}</p>}
      </form>
    </AuthShell>
  )
}

export default function AuthPage() {
  const { messages: t } = useLanguage()

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[#5d6a61]">{t.auth.loading}</div>}>
      <AuthContent />
    </Suspense>
  )
}
