'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import AuthShell from '@/components/AuthShell'
import { useLanguage } from '@/components/LanguageProvider'

export default function ResetPasswordPage() {
  const { locale } = useLanguage()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  const copy = useMemo(
    () =>
      locale === 'ko'
        ? {
            title: '새 비밀번호 설정',
            subtitle: '새 비밀번호를 입력하고 계정에 다시 로그인하세요.',
            password: '새 비밀번호',
            confirm: '비밀번호 확인',
            submit: '비밀번호 변경',
            submitting: '변경 중...',
            invalid: '이 재설정 링크는 유효하지 않거나 만료되었습니다.',
            mismatch: '비밀번호가 서로 일치하지 않습니다.',
            validating: '링크 확인 중...',
            backToLogin: '로그인으로 돌아가기',
          }
        : {
            title: 'Set a new password',
            subtitle: 'Choose a new password for your account, then sign in again.',
            password: 'New password',
            confirm: 'Confirm password',
            submit: 'Change password',
            submitting: 'Updating...',
            invalid: 'This reset link is invalid or has expired.',
            mismatch: 'The passwords do not match.',
            validating: 'Checking reset link...',
            backToLogin: 'Back to login',
          },
    [locale]
  )

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false)
        setValidating(false)
        setMessage(copy.invalid)
        setIsError(true)
        return
      }

      try {
        const response = await fetch(`/api/password-reset/confirm?token=${encodeURIComponent(token)}`, {
          cache: 'no-store',
        })

        if (!response.ok) {
          const data = await response.json()
          setTokenValid(false)
          setMessage(data.message ?? copy.invalid)
          setIsError(true)
          return
        }

        setTokenValid(true)
        setMessage('')
        setIsError(false)
      } catch {
        setTokenValid(false)
        setMessage(copy.invalid)
        setIsError(true)
      } finally {
        setValidating(false)
      }
    }

    void validateToken()
  }, [copy.invalid, token])

  const handleSubmit = async () => {
    if (!tokenValid || !token) {
      setIsError(true)
      setMessage(copy.invalid)
      return
    }

    if (password !== confirmPassword) {
      setIsError(true)
      setMessage(copy.mismatch)
      return
    }

    try {
      setIsLoading(true)
      setIsError(false)
      setMessage('')

      const response = await fetch('/api/password-reset/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setIsError(true)
        setMessage(data.message ?? copy.invalid)
        return
      }

      setPassword('')
      setConfirmPassword('')
      setMessage(data.message ?? '')
    } catch {
      setIsError(true)
      setMessage(copy.invalid)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        <Link href="/auth?type=login" className="font-semibold text-[#1d3124] underline underline-offset-4">
          {copy.backToLogin}
        </Link>
      }
    >
      {validating ? (
        <p className="text-center text-sm text-[#5d6a61]">{copy.validating}</p>
      ) : tokenValid ? (
        <>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={copy.password}
            className="w-full rounded-2xl border border-black/10 bg-[#f9f7f2] px-4 py-3 outline-none transition focus:border-[#68806f]"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder={copy.confirm}
            className="w-full rounded-2xl border border-black/10 bg-[#f9f7f2] px-4 py-3 outline-none transition focus:border-[#68806f]"
          />
          <button
            onClick={() => void handleSubmit()}
            disabled={isLoading}
            className="w-full rounded-full bg-[#1d3124] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#294532] disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading ? copy.submitting : copy.submit}
          </button>
        </>
      ) : (
        <p className="text-center text-sm text-[#b23a3a]">{copy.invalid}</p>
      )}

      {message && !validating && (
        <p className={`text-center text-sm ${isError ? 'text-[#b23a3a]' : 'text-[#2f6d43]'}`}>{message}</p>
      )}
    </AuthShell>
  )
}
