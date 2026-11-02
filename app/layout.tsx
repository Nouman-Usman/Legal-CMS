import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono, Noto_Nastaliq_Urdu } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/contexts/auth-context'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const urdu = Noto_Nastaliq_Urdu({ subsets: ["arabic"], weight: "700", variable: "--font-noto-nastaliq" });

export const metadata: Metadata = {
  title: 'Apna Waqeel',
  description: 'Professional legal case management platform',
  generator: 'v0.app',
  icons: {
    icon: { url: '/icon.svg', type: 'image/svg+xml' },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={urdu.variable} suppressHydrationWarning>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
