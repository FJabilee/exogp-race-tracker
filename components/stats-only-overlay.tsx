"use client"

import { useState, useEffect, useCallback } from "react"
import { Trophy, Zap, ExternalLink } from "lucide-react"
import { trackOptions, timeRangeOptions } from "./track-options"
import { calculateRewards, type PlayerTrackResult } from "./player-dashboard"

interface StatsOnlyOverlayProps {
    playerName: string
    refreshInterval?: number
    timeRange?: string
    region?: string
    mode?: string
    layout?: "horizontal" | "vertical"
    showTitle?: boolean
    theme?: "default" | "futuristic"
    referralCode?: string
}

// Get time range label from value
const getTimeRangeLabel = (value: string): string => {
    const timeRange = timeRangeOptions.find((option) => option.value === value)
    return timeRange ? timeRange.label : "Leaderboard"
}

export function StatsOnlyOverlay({
    playerName,
    refreshInterval = 300, // Default 5 minutes
    timeRange = "stage3",
    region = "all",
    mode = "EMatchMode::TimeTrials",
    layout = "horizontal",
    showTitle = true,
    theme = "futuristic",
    referralCode = "za9gX8PY", // Default referral code
}: StatsOnlyOverlayProps) {
    const [results, setResults] = useState<PlayerTrackResult[]>([])

    // Get the time range label for the title
    const timeRangeLabel = getTimeRangeLabel(timeRange)

    // Construct the full referral URL
    const referralUrl = `https://planetatmos.helika.io/${referralCode}`

    // Function to fetch player data
    const fetchPlayerData = useCallback(async () => {
        if (!playerName) return

        // Start fetching data

        // Initialize results with loading state for all tracks
        const initialResults = trackOptions.map((track) => ({
            trackId: track.value,
            trackName: track.label,
            playerRank: null,
            playerTime: null,
            bestPlayer: null,
            bestTime: null,
            rewards: null,
            loading: true,
        }))

        // Get date range based on selected time range
        const selectedTimeRange = timeRangeOptions.find((t) => t.value === timeRange)
        let startDate, endDate

        if (selectedTimeRange) {
            if (typeof selectedTimeRange.startDate === "string") {
                startDate = selectedTimeRange.startDate
            } else if (typeof selectedTimeRange.startDate === "function") {
                startDate = selectedTimeRange.startDate
            } else {
                startDate = timeRangeOptions[0].startDate
            }

            if (typeof selectedTimeRange.endDate === "string") {
                endDate = selectedTimeRange.endDate
            } else if (typeof selectedTimeRange.endDate === "function") {
                endDate = selectedTimeRange.endDate
            } else {
                endDate = timeRangeOptions[0].endDate
            }
        } else {
            startDate = timeRangeOptions[0].startDate
            endDate = timeRangeOptions[0].endDate
        }

        // Fetch data for each track
        const updatedResults = await Promise.all(
            trackOptions.map(async (track, index) => {
                try {
                    // Fetch top 50 players for this track
                    // Only add serverId parameter if region is not "all"
                    const regionParam = region !== "all" ? `&serverId=${region}` : ""
                    const url = `https://leaderboards.planetatmos.com/api/leaderboard/tracks/${track.value}?page=0&perPage=50&distinctOnUser=true&mode=${mode}${regionParam}&startDate=${startDate}&endDate=${endDate}&track=${track.value}`

                    const response = await fetch(url)
                    const data = await response.json()

                    // Find the player in the results
                    const playerResult = data.items.find(
                        (item: { player: string; time: number }) => item.player.toLowerCase() === playerName.toLowerCase(),
                    )

                    // Get the best player (first in the list)
                    const bestResult = data.items[0]

                    // Calculate player rank and rewards
                    const playerRank = playerResult ? data.items.indexOf(playerResult) + 1 : null
                    const rewards = calculateRewards(playerRank)

                    return {
                        trackId: track.value,
                        trackName: track.label,
                        playerRank: playerRank,
                        playerTime: playerResult ? playerResult.time : null,
                        bestPlayer: bestResult ? bestResult.player : null,
                        bestTime: bestResult ? bestResult.time : null,
                        rewards: rewards,
                        loading: false,
                    }
                } catch (error) {
                    console.error(`Error fetching data for track ${track.label}:`, error)
                    return {
                        ...initialResults[index],
                        loading: false,
                    }
                }
            }),
        )

        setResults(updatedResults)
    }, [playerName, timeRange, region, mode])

    // Initial fetch and setup refresh interval
    useEffect(() => {
        fetchPlayerData()

        // Set up refresh interval
        const refreshIntervalId = setInterval(() => {
            fetchPlayerData()
        }, refreshInterval * 1000)

        // Clean up interval on unmount
        return () => clearInterval(refreshIntervalId)
    }, [fetchPlayerData, refreshInterval])

    // Count tracks where player is ranked
    const rankedTracks = results.filter((result) => result.playerRank !== null).length

    // Calculate average rank
    const totalRanks = results.reduce((sum, result) => {
        return result.playerRank ? sum + result.playerRank : sum
    }, 0)
    const averageRank = rankedTracks > 0 ? (totalRanks / rankedTracks).toFixed(1) : "-"

    // Find best rank
    const bestRank = results.reduce(
        (best, result) => {
            if (result.playerRank === null) return best
            return best === null || result.playerRank < best ? result.playerRank : best
        },
        null as number | null,
    )

    // Calculate total rewards
    const totalRewards = results.reduce((sum, result) => {
        return result.rewards ? sum + result.rewards : sum
    }, 0)

    // Futuristic Horizontal Layout
    if (theme === "futuristic" && layout === "horizontal") {
        return (
            <div className="futuristic-stats-overlay">
                <div className="bg-gradient-to-r from-black/90 via-black/80 to-black/90 backdrop-blur-sm text-white p-2">
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between gap-2">
                            {showTitle && (
                                <div className="flex items-center text-xs font-bold text-primary whitespace-nowrap mr-3">
                                    <div className="w-1 h-4 bg-primary mr-1.5 animate-pulse"></div>
                                    ExoGP {timeRangeLabel} <span className="ml-1 text-white/80">LEADERBOARD</span>
                                </div>
                            )}

                            <div className="flex items-center justify-center gap-5 text-xs">
                                <div className="stat-item">
                                    <div className="stat-label text-[10px] text-primary/80 uppercase tracking-wider mb-0.5">Ranked</div>
                                    <div className="stat-value font-mono font-bold">
                                        {rankedTracks}/{results.length}
                                    </div>
                                </div>

                                <div className="stat-item">
                                    <div className="stat-label text-[10px] text-primary/80 uppercase tracking-wider mb-0.5">Avg</div>
                                    <div className="stat-value font-mono font-bold">{averageRank}</div>
                                </div>

                                <div className="stat-item">
                                    <div className="stat-label text-[10px] text-primary/80 uppercase tracking-wider mb-0.5">Best</div>
                                    <div className="stat-value font-mono font-bold">
                                        {bestRank !== null ? (
                                            bestRank === 1 ? (
                                                <span className="flex items-center">
                                                    1<Trophy className="ml-0.5 h-3 w-3 text-yellow-500" />
                                                </span>
                                            ) : (
                                                bestRank
                                            )
                                        ) : (
                                            "-"
                                        )}
                                    </div>
                                </div>

                                <div className="stat-item">
                                    <div className="stat-label text-[10px] text-primary/80 uppercase tracking-wider mb-0.5">Rewards</div>
                                    <div className="stat-value font-mono font-bold flex items-center">
                                        {totalRewards > 0 ? (
                                            <>
                                                {totalRewards.toLocaleString()}
                                                <Zap className="ml-0.5 h-3 w-3 text-yellow-500" />
                                            </>
                                        ) : (
                                            "-"
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Referral URL */}
                        <div className="flex items-center justify-center mt-1 text-[10px]">
                            <div className="flex items-center bg-black/40 px-2 py-0.5 border-l border-r border-primary/30">
                                <span className="text-primary/90 font-semibold mr-1">JOIN US:</span>
                                <span className="font-mono">{referralUrl}</span>
                                <ExternalLink className="ml-1 h-2.5 w-2.5 text-primary/70" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Futuristic Vertical Layout
    if (theme === "futuristic" && layout === "vertical") {
        return (
            <div className="futuristic-stats-overlay" style={{ width: "fit-content" }}>
                <div className="bg-gradient-to-b from-black/90 via-black/80 to-black/90 backdrop-blur-sm text-white p-3">
                    {showTitle && (
                        <div className="flex items-center justify-center text-xs font-bold text-primary whitespace-nowrap mb-3">
                            <div className="w-4 h-1 bg-primary mr-1.5 animate-pulse"></div>
                            ExoGP {timeRangeLabel} <span className="ml-1 text-white/80">LEADERBOARD</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-2 text-xs">
                        <div className="stat-item">
                            <div className="stat-label text-[10px] text-primary/80 uppercase tracking-wider mb-0.5">Ranked</div>
                            <div className="stat-value font-mono font-bold">
                                {rankedTracks}/{results.length}
                            </div>
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent mt-1"></div>
                        </div>

                        <div className="stat-item">
                            <div className="stat-label text-[10px] text-primary/80 uppercase tracking-wider mb-0.5">Avg</div>
                            <div className="stat-value font-mono font-bold">{averageRank}</div>
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent mt-1"></div>
                        </div>

                        <div className="stat-item">
                            <div className="stat-label text-[10px] text-primary/80 uppercase tracking-wider mb-0.5">Best</div>
                            <div className="stat-value font-mono font-bold">
                                {bestRank !== null ? (
                                    bestRank === 1 ? (
                                        <span className="flex items-center">
                                            1<Trophy className="ml-0.5 h-3 w-3 text-yellow-500" />
                                        </span>
                                    ) : (
                                        bestRank
                                    )
                                ) : (
                                    "-"
                                )}
                            </div>
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent mt-1"></div>
                        </div>

                        <div className="stat-item">
                            <div className="stat-label text-[10px] text-primary/80 uppercase tracking-wider mb-0.5">Rewards</div>
                            <div className="stat-value font-mono font-bold flex items-center">
                                {totalRewards > 0 ? (
                                    <>
                                        {totalRewards.toLocaleString()}
                                        <Zap className="ml-0.5 h-3 w-3 text-yellow-500" />
                                    </>
                                ) : (
                                    "-"
                                )}
                            </div>
                        </div>

                        {/* Referral URL */}
                        <div className="mt-2 pt-2 border-t border-primary/30">
                            <div className="stat-label text-[10px] text-primary/80 uppercase tracking-wider mb-0.5">Join Us</div>
                            <div className="stat-value font-mono text-[9px] flex items-center">
                                {referralUrl}
                                <ExternalLink className="ml-1 h-2.5 w-2.5 text-primary/70" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Default Horizontal layout (fallback)
    if (layout === "horizontal") {
        return (
            <div className="stats-overlay bg-black/80 text-white p-2">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    {showTitle && (
                        <div className="text-xs font-semibold text-primary whitespace-nowrap">
                            ExoGP {timeRangeLabel} Leaderboard
                        </div>
                    )}

                    <div className="flex items-center justify-center gap-4 text-xs">
                        <div>
                            <span className="text-muted-foreground mr-1">Ranked:</span>
                            <span className="font-medium">
                                {rankedTracks}/{results.length}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground mr-1">Avg:</span>
                            <span className="font-medium">{averageRank}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground mr-1">Best:</span>
                            <span className="font-medium">
                                {bestRank !== null ? (
                                    bestRank === 1 ? (
                                        <span className="flex items-center">
                                            1<Trophy className="ml-0.5 h-3 w-3 text-yellow-500" />
                                        </span>
                                    ) : (
                                        bestRank
                                    )
                                ) : (
                                    "-"
                                )}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground mr-1">Rewards:</span>
                            <span className="font-medium">{totalRewards > 0 ? totalRewards.toLocaleString() : "-"}</span>
                        </div>
                    </div>
                </div>

                {/* Referral URL */}
                <div className="text-center mt-1 text-[10px]">
                    <span className="text-muted-foreground mr-1">Join us:</span>
                    <span>{referralUrl}</span>
                </div>
            </div>
        )
    }

    // Default Vertical layout (fallback)
    return (
        <div className="stats-overlay bg-black/80 text-white p-2" style={{ width: "fit-content" }}>
            {showTitle && (
                <div className="text-xs font-semibold text-primary text-center mb-2">ExoGP {timeRangeLabel} Leaderboard</div>
            )}

            <div className="grid grid-cols-1 gap-1 text-xs">
                <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Ranked:</span>
                    <span className="font-medium">
                        {rankedTracks}/{results.length}
                    </span>
                </div>
                <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Avg:</span>
                    <span className="font-medium">{averageRank}</span>
                </div>
                <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Best:</span>
                    <span className="font-medium">
                        {bestRank !== null ? (
                            bestRank === 1 ? (
                                <span className="flex items-center">
                                    1<Trophy className="ml-0.5 h-3 w-3 text-yellow-500" />
                                </span>
                            ) : (
                                bestRank
                            )
                        ) : (
                            "-"
                        )}
                    </span>
                </div>
                <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Rewards:</span>
                    <span className="font-medium">{totalRewards > 0 ? totalRewards.toLocaleString() : "-"}</span>
                </div>

                {/* Referral URL */}
                <div className="mt-1 pt-1 border-t border-muted/20">
                    <span className="text-muted-foreground text-[9px]">Join us: {referralUrl}</span>
                </div>
            </div>
        </div>
    )
}

