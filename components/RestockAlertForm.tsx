'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@/components/LanguageProvider'

type RestockAlertFormProps = {
  productId: string
}

export default function RestockAlertForm({ productId }: RestockAlertFormProps) {
  const { locale } = useLanguage()
  const [email, setEmail] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  const copy = useMemo(
    () =>
      locale === 'ko'
        ? {
            title: '재입고 알림',
            placeholder: '알림을 받을 이메일',
            hint: '이 상품이 다시 입고되면 알림을 보낼 수 있도록 등록합니다.',
            activeEmail: '현재 로그인한 계정 이메일로 알림을 받습니다.',
            submit: '재입고 알림 신청',
            submitting: '신청 중...',
            failed: '재입고 알림을 신청하지 못했습니다.',
          }
        : {
            title: 'Restock alert',
            placeholder: 'Email for notifications',
            hint: 'We will keep a restock alert ready for this product.',
            activeEmail: 'We will use the email from your current account.',
            submit: 'Notify me when restocked',
            submitting: 'Saving...',
            failed: 'Could not create a restock alert.',
          },
    [locale]
  )

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch('/api/session', { cache: 'no-store' })
        const data = await response.json()

        if (data.user?.email) {
          setEmail(data.user.email)
          setIsLoggedIn(true)
        }
      } catch {
        setIsLoggedIn(false)
      }
    }

    void loadSession()
  }, [])

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setMessage('')
      setIsError(false)

      const response = await fetch(`/api/products/${productId}/restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setIsError(true)
        setMessage(data.message ?? copy.failed)
        return
      }

      setMessage(data.message ?? '')
    } catch {
      setIsError(true)
      setMessage(copy.failed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-[24px] border border-black/5 bg-[#faf7f1] p-4">
      <p className="text-sm font-semibold text-[#18261d]">{copy.title}</p>
      <p className="mt-2 text-sm leading-6 text-[#5d6a61]">{copy.hint}</p>

      <div className="mt-4 flex flex-col gap-3">
        {isLoggedIn ? (
          <p className="rounded-2xl bg-white px-4 py-3 text-sm text-[#425247]">{copy.activeEmail}</p>
        ) : (
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={copy.placeholder}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-[#68806f]"
          />
        )}
        <button
          onClick={() => void handleSubmit()}
          disabled={loading}
          className="rounded-full bg-[#1d3124] px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? copy.submitting : copy.submit}
        </button>
      </div>

      {message && <p className={`mt-3 text-sm ${isError ? 'text-[#b23a3a]' : 'text-[#2f6d43]'}`}>{message}</p>}
    </div>
  )
}
