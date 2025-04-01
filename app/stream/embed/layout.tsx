import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
    title: "ExoGP Stream Overlay",
    description: "Stream overlay for ExoGP race performance",
}

export default function EmbedLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return children
}

