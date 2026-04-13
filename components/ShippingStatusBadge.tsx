'use client'

import { useLanguage } from '@/components/LanguageProvider'
import { getNormalizedShippingStatus } from '@/lib/order-utils'

type ShippingStatusBadgeProps = {
  status?: string
}

const shippingStatusStyles: Record<string, string> = {
  preparing: 'bg-[#eef6ee] text-[#29553a]',
  shipped: 'bg-[#e8f1fb] text-[#22507a]',
}

const shippingStatusLabels = {
  en: {
    preparing: 'Preparing shipment',
    shipped: 'Shipped',
  },
  ko: {
    preparing: '배송 준비',
    shipped: '배송 완료',
  },
} as const

export default function ShippingStatusBadge({ status }: ShippingStatusBadgeProps) {
  const { locale } = useLanguage()
  const normalizedStatus = getNormalizedShippingStatus(status)
  const labels = locale === 'ko' ? shippingStatusLabels.ko : shippingStatusLabels.en

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${
        shippingStatusStyles[normalizedStatus]
      }`}
    >
      {labels[normalizedStatus]}
    </span>
  )
}
