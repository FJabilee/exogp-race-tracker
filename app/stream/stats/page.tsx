"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { StatsOnlyOverlay } from "@/components/stats-only-overlay"

export default function StatsPage() {
    const searchParams = useSearchParams()
    const playerName = searchParams.get("player") || ""
    const refreshInterval = Number.parseInt(searchParams.get("refresh") || "300") // 5 minutes default
    const timeRange = searchParams.get("timeRange") || "stage3"
    const region = searchParams.get("region") || "all"
    const mode = searchParams.get("mode") || "EMatchMode::TimeTrials"
    const layout = (searchParams.get("layout") || "horizontal") as "horizontal" | "vertical"
    const showTitle = searchParams.get("title") !== "false"
    const theme = (searchParams.get("theme") || "futuristic") as "default" | "futuristic"
    const referralCode = searchParams.get("referral") || "za9gX8PY" // Default referral code

    // This ensures the component is only rendered on the client
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className="stream-embed">
            {playerName ? (
                <StatsOnlyOverlay
                    playerName={playerName}
                    refreshInterval={refreshInterval}
                    timeRange={timeRange}
                    region={region}
                    mode={mode}
                    layout={layout}
                    showTitle={showTitle}
                    theme={theme}
                    referralCode={referralCode}
                />
            ) : (
                <div className="p-4 text-center text-white bg-black rounded-lg">
                    <p>Please provide a player name using the ?player= query parameter</p>
                </div>
            )}
        </div>
    )
}

