import { ShieldCheck } from 'lucide-react'

const colorMap: Record<string, string> = {
  gold: '#FFD700',
  blue: '#1DA1F2',
  red: '#FF3B30',
  green: '#34C759',
  purple: '#AF52DE',
}

const tooltipMap: Record<string, string> = {
  gold: 'شخصية مشهورة',
  blue: 'حساب موثق',
  red: 'جهة رسمية',
  green: 'شريك ITOP',
  purple: 'منشئ محتوى',
}

export default function VerificationBadge({ color, size = 14 }: { color: string | null; size?: number }) {
  if (!color) return null
  return (
    <span title={tooltipMap[color] || 'موثق'}>
      <ShieldCheck size={size} color={colorMap[color] || '#FFD700'} fill={colorMap[color] || '#FFD700'} strokeWidth={1.5} />
    </span>
  )
}
