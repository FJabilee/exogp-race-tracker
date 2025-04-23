"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { StreamOverlay } from "@/components/stream-overlay"

// Component that uses search params
function StreamContent() {
    const searchParams = useSearchParams()
    const playerName = searchParams.get("player") || ""
    const refreshInterval = Number.parseInt(searchParams.get("refresh") || "300") // 5 minutes default
    const rotationInterval = Number.parseInt(searchParams.get("rotate") || "30") // 30 seconds default
    const tracksPerPage = Number.parseInt(searchParams.get("tracksPerPage") || "10") // 10 tracks per page default
    const showOnlyRanked = searchParams.get("ranked") !== "false"
    const timeRange = searchParams.get("timeRange") || "stage3"
    const region = searchParams.get("region") || "all"
    const mode = searchParams.get("mode") || "EMatchMode::TimeTrials"
    const theme = (searchParams.get("theme") || "default") as "default" | "futuristic"
    const referralCode = searchParams.get("referral") || "za9gX8PY" // Default referral code

    return (
        <div className="stream-embed">
            {playerName ? (
                <div style={{ backgroundColor: "#000000" }}>
                    <StreamOverlay
                        playerName={playerName}
                        refreshInterval={refreshInterval}
                        rotationInterval={rotationInterval}
                        tracksPerPage={tracksPerPage}
                        showOnlyRanked={showOnlyRanked}
                        timeRange={timeRange}
                        region={region}
                        mode={mode}
                        theme={theme}
                        referralCode={referralCode}
                    />
                </div>
            ) : (
                <div className="p-4 text-center text-white bg-black rounded-lg" style={{ backgroundColor: "#000000" }}>
                    <p>Please provide a player name using the ?player= query parameter</p>
                </div>
            )}
        </div>
    )
}

// Main page component with suspense boundary
export default function EmbedPage() {
    // This ensures the component is only rendered on the client
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <Suspense fallback={<div className="p-4 text-center text-white bg-black">Loading...</div>}>
            <StreamContent />
        </Suspense>
    )
}