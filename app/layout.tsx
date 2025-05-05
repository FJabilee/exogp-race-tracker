import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { PostHogProvider } from "@/components/PostHogProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ExoGP Leaderboards | Track Race Performance",
  description: "Track your race times across all tracks and compare with the best players in ExoGP",
  icons: {
    icon: "/atmos.svg",
    shortcut: "/atmos.svg",
    apple: "/atmos.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} pt-6`}>
        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            forcedTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}