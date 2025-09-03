import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Suspense } from "react"
import "./globals.css"
import ConnectWalletButton from "@/components/ConnectWalletButton"

export const metadata: Metadata = {
  title: "Brizo - Seamless Bitcoin Payments",
  description:
    "Create payment links and accept sBTC donations with ease. The modern Bitcoin payment platform for merchants and creators.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <div className="w-full flex items-center justify-end p-4 gap-2">
              {isDemoMode && (
                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                  Demo Mode (SIP-010)
                </span>
              )}
              <ConnectWalletButton />
            </div>
            {children}
          </ThemeProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
