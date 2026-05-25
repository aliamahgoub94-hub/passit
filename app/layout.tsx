import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Passit — Your AI Study Coach for NCEA',
  description: 'Track your credits, nail your deadlines, and get an AI coach that knows every NCEA standard. Built for NZ students.',
  openGraph: {
    title: 'Passit — Your AI Study Coach for NCEA',
    description: 'Stop guessing. Start passing NCEA.',
    url: 'https://passit.co.nz',
    siteName: 'Passit',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
