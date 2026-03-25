'use client'

import { useLanguage } from '@/components/LanguageProvider'

type OrderStatusBadgeProps = {
  status: string
}

const statusStyles: Record<string, string> = {
  paid: 'bg-[#e8f5ea] text-[#1e6b3a]',
  pending: 'bg-[#fff2dd] text-[#915d13]',
  cancelled: 'bg-[#fde8e8] text-[#9a2f2f]',
}

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const { messages: t } = useLanguage()
  const normalizedStatus = status.toLowerCase()
  const label = t.common.orderStatuses[normalizedStatus as keyof typeof t.common.orderStatuses] ?? status
  const style = statusStyles[normalizedStatus] ?? 'bg-[#edf1ec] text-[#425247]'

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${style}`}>
      {label}
    </span>
  )
}
