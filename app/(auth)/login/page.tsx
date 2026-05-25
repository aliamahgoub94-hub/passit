'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)
    if (authError) {
      setError(authError.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-passit-off flex flex-col items-center justify-center px-4">
      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-passit-border shadow-brand-md p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/"><Logo /></Link>
        </div>

        {sent ? (
          /* Success state */
          <div className="text-center">
            <div className="text-4xl mb-4">📬</div>
            <h1 className="font-display text-2xl font-bold text-navy mb-2">Check your email</h1>
            <p className="text-passit-muted text-sm leading-relaxed mb-6">
              We sent a magic link to <strong className="text-navy">{email}</strong>.
              Click the link to sign in — no password needed.
            </p>
            <p className="text-xs text-passit-light">
              Didn&apos;t get it? Check your spam, or{' '}
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="text-brand-blue underline cursor-pointer"
              >
                try again
              </button>
            </p>
          </div>
        ) : (
          /* Form state */
          <>
            <h1 className="font-display text-2xl font-bold text-navy mb-1 text-center">Sign in to Passit</h1>
            <p className="text-passit-muted text-sm text-center mb-8">
              New here? Signing in creates your account automatically.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-600 text-navy mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="you@school.ac.nz"
                  className="w-full px-4 py-3 rounded-xl border border-passit-border text-sm text-passit-text placeholder:text-passit-light focus:outline-none focus:border-brand-blue transition-colors"
                  autoFocus
                  autoComplete="email"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-orange text-white py-3 rounded-xl text-sm font-700 shadow-orange-sm hover:bg-brand-orange-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send magic link →'}
              </button>
            </form>

            <p className="text-xs text-passit-light text-center mt-6">
              By signing in you agree to our{' '}
              <a href="/terms" className="underline">Terms</a> and{' '}
              <a href="/privacy" className="underline">Privacy Policy</a>
            </p>
          </>
        )}
      </div>

      <Link href="/" className="mt-6 text-xs text-passit-light hover:text-passit-muted transition-colors">
        ← Back to Passit
      </Link>
    </div>
  )
}
