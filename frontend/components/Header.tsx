import Link from 'next/link'
import { Activity } from 'lucide-react'

const NAV = [
  { href: '/lookup', label: 'Encyclopedia' },
  { href: '/features', label: 'Features' },
  { href: '/research', label: 'Research' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/compliance', label: 'Compliance' },
  { href: '/docs', label: 'Docs' },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 text-white shadow-sm">
            <Activity className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-tight text-slate-900">AI Medical Diagnosis</span>
            <span className="text-[11px] font-medium text-slate-500">Clinical Decision Support</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:block">
            Dashboard
          </Link>
          <Link
            href="/diagnose"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
          >
            New assessment
          </Link>
        </div>
      </div>
    </header>
  )
}
