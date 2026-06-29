import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface InfoPageProps {
  title: string
  description: string
  children: React.ReactNode
}

export default function InfoPage({ title, description, children }: InfoPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
          <h1 className="mb-4 text-4xl font-bold text-slate-900">{title}</h1>
          <p className="mb-8 text-xl text-slate-600">{description}</p>
          <div className="prose prose-blue max-w-none">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
