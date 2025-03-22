"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    // Use this approach to prevent hydration mismatch
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    // During SSR and initial client render, render without theme classes
    // This prevents the hydration mismatch
    if (!mounted) {
        return (
            <div style={{ visibility: "hidden" }}>
                {children}
            </div>
        )
    }

    return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
