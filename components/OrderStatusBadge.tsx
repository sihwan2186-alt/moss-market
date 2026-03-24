type OrderStatusBadgeProps = {
  status: string
}

const statusStyles: Record<string, string> = {
  paid: 'bg-[#e8f5ea] text-[#1e6b3a]',
  pending: 'bg-[#fff2dd] text-[#915d13]',
  cancelled: 'bg-[#fde8e8] text-[#9a2f2f]',
}

const statusLabels: Record<string, string> = {
  paid: 'Paid',
  pending: 'Pending',
  cancelled: 'Cancelled',
}

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const normalizedStatus = status.toLowerCase()
  const label = statusLabels[normalizedStatus] ?? status
  const style = statusStyles[normalizedStatus] ?? 'bg-[#edf1ec] text-[#425247]'

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${style}`}>
      {label}
    </span>
  )
}
