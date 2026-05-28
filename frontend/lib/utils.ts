import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatConfidence(score: number): string {
  return `${(score * 100).toFixed(1)}%`
}

export function getUrgencyColor(urgency: string): string {
  switch (urgency) {
    case 'emergency':
      return 'text-red-600 bg-red-50'
    case 'urgent':
      return 'text-orange-600 bg-orange-50'
    case 'routine':
      return 'text-green-600 bg-green-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

// Made with Bob
