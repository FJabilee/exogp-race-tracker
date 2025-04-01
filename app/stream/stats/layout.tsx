import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
    title: "ExoGP Stats Overlay",
    description: "Minimalist stats overlay for ExoGP race performance",
}

export default function StatsLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return children
}

