import Link from 'next/link'
import { Activity } from 'lucide-react'

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { href: '/features', label: 'Features' },
      { href: '/diagnose', label: 'New assessment' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/research', label: 'Research' },
    ],
  },
  {
    title: 'Trust',
    links: [
      { href: '/compliance', label: 'Compliance' },
      { href: '/security', label: 'Security' },
      { href: '/hipaa', label: 'HIPAA' },
      { href: '/privacy', label: 'Privacy' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
      { href: '/docs', label: 'Docs' },
      { href: '/terms', label: 'Terms' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 text-white">
                <Activity className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span className="text-[15px] font-bold tracking-tight text-slate-900">AI Medical Diagnosis</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              Citation-grounded clinical decision support. Not a diagnosis and not a substitute for a qualified clinician.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-slate-600 transition-colors hover:text-slate-900">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} AI Medical Diagnosis. Decision support — pre-certification; not a certified medical device.</p>
          <p>Built on Vercel + Amazon DynamoDB · NVIDIA NIM</p>
        </div>
      </div>
    </footer>
  )
}
