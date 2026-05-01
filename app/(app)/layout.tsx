import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Logo } from '@/components/ui/Logo'

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/subjects', label: 'Subjects', comingSoon: true },
  { href: '/coach', label: 'AI Coach', comingSoon: true },
] as const

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()

  if (!data.user) redirect('/auth/login')

  return (
    <div className="min-h-screen bg-passit-off">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="bg-white border border-passit-border rounded-2xl shadow-brand-sm p-4 lg:sticky lg:top-6 h-fit">
            <div className="flex items-center justify-between gap-3">
              <Logo href="/dashboard" size="sm" />
              <span className="text-[10px] font-extrabold uppercase tracking-[.14em] text-brand-orange bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full">
                Student
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-1">
              {NAV.map(item => (
                <div key={item.href} className="flex items-center justify-between gap-2">
                  <Link
                    href={item.href}
                    aria-disabled={item.comingSoon ? true : undefined}
                    className={[
                      'flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors no-underline',
                      item.comingSoon
                        ? 'text-passit-light bg-passit-off cursor-not-allowed pointer-events-none'
                        : 'text-navy hover:bg-brand-sky hover:text-brand-blue',
                    ].join(' ')}
                  >
                    {item.label}
                  </Link>
                  {item.comingSoon ? (
                    <span className="text-[10px] font-bold text-passit-muted bg-passit-off border border-passit-border px-2 py-1 rounded-full">
                      Soon
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-[#0f1f47] text-white p-4">
              <div className="text-[11px] font-bold uppercase tracking-[.14em] text-white/70 mb-2">
                Readiness
              </div>
              <div className="text-sm font-semibold leading-snug mb-3">
                Keep your credits and deadlines in one place.
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center w-full bg-brand-orange text-white py-2.5 rounded-xl text-sm font-bold hover:bg-brand-orange-dark transition-colors no-underline"
              >
                Check your readiness →
              </Link>
            </div>
          </aside>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}

