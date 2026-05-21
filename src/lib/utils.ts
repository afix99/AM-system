import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function getAchievementColor(percentage: number): string {
  if (percentage >= 100) return 'text-green-600'
  if (percentage >= 80) return 'text-yellow-600'
  return 'text-red-600'
}

export function getAchievementBg(percentage: number): string {
  if (percentage >= 100) return 'bg-green-100 text-green-800'
  if (percentage >= 80) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

export function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 1: return 'Urgent'
    case 2: return 'High'
    case 3: return 'Medium'
    case 4: return 'Low'
    default: return 'Medium'
  }
}

export function getPriorityColor(priority: number): string {
  switch (priority) {
    case 1: return 'bg-red-100 text-red-800 border-red-200'
    case 2: return 'bg-orange-100 text-orange-800 border-orange-200'
    case 3: return 'bg-blue-100 text-blue-800 border-blue-200'
    case 4: return 'bg-gray-100 text-gray-800 border-gray-200'
    default: return 'bg-blue-100 text-blue-800 border-blue-200'
  }
}

export function getShiftColor(shift: string): string {
  switch (shift) {
    case 'M':  return 'bg-sky-100 text-sky-800'
    case 'N':  return 'bg-indigo-100 text-indigo-800'
    case 'H':  return 'bg-amber-100 text-amber-800'
    case 'HM': return 'bg-cyan-100 text-cyan-800'
    case 'HN': return 'bg-violet-100 text-violet-800'
    case 'Off': return 'bg-slate-100 text-slate-400'
    default:   return 'bg-slate-100 text-slate-400'
  }
}

export function getShiftLabel(shift: string): string {
  switch (shift) {
    case 'M':  return 'M  9:30AM–6:30PM'
    case 'N':  return 'N  1PM–10PM'
    case 'H':  return 'H  5PM–10PM'
    case 'HM': return 'HM 9:30AM–2:30PM'
    case 'HN': return 'HN 5PM–10PM'
    case 'Off': return 'Off'
    default:   return shift || '—'
  }
}

export function getWeekDates(date: Date): Date[] {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(date)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export function getWeekLabel(weekDates: Date[]): string {
  const start = weekDates[0]
  const end = weekDates[6]
  const startStr = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const endStr = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${startStr} – ${endStr}`
}
