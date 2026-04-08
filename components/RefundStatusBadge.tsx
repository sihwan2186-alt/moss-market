'use client'

import { useLanguage } from '@/components/LanguageProvider'
import { type RefundStatus } from '@/lib/order-utils'

type RefundStatusBadgeProps = {
  status: RefundStatus
}

const refundStatusStyles: Record<Exclude<RefundStatus, 'none'>, string> = {
  partial: 'bg-[#fff3dd] text-[#8a5a14]',
  full: 'bg-[#fde8e8] text-[#8e2f2f]',
}

const refundStatusLabels = {
  en: {
    partial: 'Partial refund',
    full: 'Fully refunded',
  },
  ko: {
    partial: '부분 환불',
    full: '전액 환불',
  },
} as const

export default function RefundStatusBadge({ status }: RefundStatusBadgeProps) {
  const { locale } = useLanguage()

  if (status === 'none') {
    return null
  }

  const labels = locale === 'ko' ? refundStatusLabels.ko : refundStatusLabels.en

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${
        refundStatusStyles[status]
      }`}
    >
      {labels[status]}
    </span>
  )
}
