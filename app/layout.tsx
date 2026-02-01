import React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/components/providers/QueryProvider"

export const metadata: Metadata = {
  title: "Get2B",
  description: "Международные оплаты Китайским поставщикам с Get2B",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
