"use client"

import { useState, useEffect, useCallback } from "react"
import { Trophy, ExternalLink } from "lucide-react"
import { trackOptions, timeRangeOptions } from "./track-options"
// Add the import for getCurrentWeekDates
import { calculateRewards, calculateWeeklyRewards, type PlayerTrackResult } from "./player-dashboard"

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

// Get mode label from value
const getModeLabel = (value: string): string => {
    switch (value) {
        case "EMatchMode::TimeTrials":
            return "Time Trials"
        case "EMatchMode::Matchmaking_Unranked":
            return "Quickplay"
        default:
            return "Time Trials"
    }
}

// Updated to use Sunday 12AM UTC as the weekly reset time
const getCurrentWeekDates = () => {
    // Get current date in UTC
    const now = new Date()

    // Find the most recent Sunday at 12AM UTC
    const startOfWeek = new Date(now)
    const dayOfWeek = startOfWeek.getUTCDay() // 0 = Sunday, 1 = Monday, etc.

    // Calculate days to subtract to get to the previous Sunday
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - dayOfWeek)

    // Set time to 00:00:00 UTC (12AM)
    startOfWeek.setUTCHours(0, 0, 0, 0)

    // If current time is before Sunday 12AM, go back one more week
    if (now < startOfWeek) {
        startOfWeek.setUTCDate(startOfWeek.getUTCDate() - 7)
    }

    return {
        startDate: startOfWeek.toISOString(),
        endDate: now.toISOString(), // Current time as end date
    }
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

    // Get the mode label for the title
    const modeLabel = getModeLabel(mode)

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
            weeklyRank: null, // Add missing weeklyRank field
            weeklyRewards: null,
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

        // Get current week dates for weekly rewards
        const weeklyDateRange = getCurrentWeekDates()

        // Fetch data for each track
        const updatedResults = await Promise.all(
            trackOptions.map(async (track, index) => {
                try {
                    // Fetch top 50 players for this track for the selected time range
                    // Only add serverId parameter if region is not "all"
                    const regionParam = region !== "all" ? `&serverId=${region}` : ""
                    const url = `https://leaderboards.planetatmos.com/api/leaderboard/tracks/${track.value}?page=0&perPage=50&distinctOnUser=true&mode=${mode}${regionParam}&startDate=${startDate}&endDate=${endDate}&track=${track.value}`

                    // Fetch weekly data separately
                    const weeklyUrl = `https://leaderboards.planetatmos.com/api/leaderboard/tracks/${track.value}?page=0&perPage=50&distinctOnUser=true&mode=${mode}${regionParam}&startDate=${weeklyDateRange.startDate}&endDate=${weeklyDateRange.endDate}&track=${track.value}`

                    // Make both requests in parallel
                    const [response, weeklyResponse] = await Promise.all([fetch(url), fetch(weeklyUrl)])

                    const data = await response.json()
                    const weeklyData = await weeklyResponse.json()

                    // Find the player in the results
                    const playerResult = data.items.find(
                        (item: { player: string; time: number }) => item.player.toLowerCase() === playerName.toLowerCase(),
                    )

                    // Find the player in the weekly results
                    const weeklyPlayerResult = weeklyData.items.find(
                        (item: { player: string; time: number }) => item.player.toLowerCase() === playerName.toLowerCase(),
                    )

                    // Get the best player (first in the list)
                    const bestResult = data.items[0]

                    // Calculate player rank and rewards
                    const playerRank = playerResult ? data.items.indexOf(playerResult) + 1 : null
                    const rewards = calculateRewards(playerRank)

                    // Calculate weekly rank and rewards
                    const weeklyRank = weeklyPlayerResult ? weeklyData.items.indexOf(weeklyPlayerResult) + 1 : null
                    const weeklyRewards = calculateWeeklyRewards(weeklyRank)

                    return {
                        trackId: track.value,
                        trackName: track.label,
                        playerRank: playerRank,
                        playerTime: playerResult ? playerResult.time : null,
                        bestPlayer: bestResult ? bestResult.player : null,
                        bestTime: bestResult ? bestResult.time : null,
                        rewards: rewards,
                        weeklyRank: weeklyRank, // Add weeklyRank to the returned object
                        weeklyRewards: weeklyRewards,
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

    // Calculate total seasonal rewards
    const totalSeasonalRewards = results.reduce((sum, result) => {
        return result.rewards ? sum + result.rewards : sum
    }, 0)

    // Calculate total weekly rewards
    const totalWeeklyRewards = results.reduce((sum, result) => {
        return result.weeklyRewards ? sum + result.weeklyRewards : sum
    }, 0)

    // Calculate combined total rewards
    const totalRewards = totalSeasonalRewards + totalWeeklyRewards

    // Futuristic Horizontal Layout
    if (theme === "futuristic" && layout === "horizontal") {
        return (
            <div className="futuristic-stats-overlay">
                <div className="bg-black text-white p-2" style={{ backgroundColor: "#000000" }}>
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between gap-2">
                            {showTitle && (
                                <div className="flex flex-col mr-3">
                                    <div className="flex items-center text-xs font-bold text-primary whitespace-nowrap">
                                        <div className="w-1 h-4 bg-primary mr-1.5 animate-pulse"></div>
                                        ExoGP {timeRangeLabel} <span className="ml-1 text-white/80">LEADERBOARD</span>
                                    </div>
                                    <div className="text-[10px] text-white/60 mt-0.5 ml-2.5">{modeLabel}</div>
                                </div>
                            )}

                            <div className="flex items-center justify-center gap-4 text-xs">
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
                                    <div className="stat-label text-[10px] text-primary/80 uppercase tracking-wider mb-0.5">
                                        Seasonal FLEX
                                    </div>
                                    <div className="stat-value font-mono font-bold text-yellow-500">
                                        {totalSeasonalRewards > 0 ? totalSeasonalRewards.toLocaleString() : "-"}
                                    </div>
                                </div>

                                <div className="stat-item">
                                    <div className="stat-label text-[10px] text-primary/80 uppercase tracking-wider mb-0.5">
                                        Weekly FLEX
                                    </div>
                                    <div className="stat-value font-mono font-bold text-green-500">
                                        {totalWeeklyRewards > 0 ? totalWeeklyRewards.toLocaleString() : "-"}
                                    </div>
                                </div>

                                <div className="stat-item">
                                    <div className="stat-label text-[10px] text-primary/80 uppercase tracking-wider mb-0.5">
                                        Total FLEX
                                    </div>
                                    <div className="stat-value font-mono font-bold text-primary">
                                        {totalRewards > 0 ? totalRewards.toLocaleString() : "-"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Referral URL */}
                        <div className="flex items-center justify-center mt-1 text-[10px]">
                            <div className="flex items-center bg-black px-4 py-0.5 relative" style={{ backgroundColor: "#000000" }}>
                                <div className="w-1 h-4 bg-red-500 animate-pulse absolute left-0"></div>
                                <div className="w-1 h-4 bg-red-500 animate-pulse absolute right-0"></div>
                                <span className="text-red-500 font-semibold mr-1">JOIN US:</span>
                                <span className="font-mono">{referralUrl}</span>
                                <ExternalLink className="ml-1 h-2.5 w-2.5 text-red-500/70" />
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
                <div className="bg-black text-white p-3" style={{ backgroundColor: "#000000" }}>
                    {showTitle && (
                        <div className="flex flex-col items-center justify-center mb-3">
                            <div className="flex items-center text-xs font-bold text-primary whitespace-nowrap">
                                <div className="w-1 h-4 bg-primary mr-1.5 animate-pulse"></div>
                                ExoGP {timeRangeLabel} <span className="ml-1 text-white/80">LEADERBOARD</span>
                            </div>
                            <div className="text-[10px] text-white/60 mt-0.5">{modeLabel}</div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-2 text-xs">
                        <div className="stat-item">
                            <div className="stat-label text-[10px] text-primary/80 uppercase tracking-wider mb-0.5">Ranked</div>
                            <div className="stat-value font-mono font-bold">
                                {rankedTracks}/{results.length}
                            </div>
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-red-500/20 to-transparent mt-1"></div>
                        </div>

                        <div className="stat-item">
                            <div className="stat-label text-[10px] text-primary/80 uppercase tracking-wider mb-0.5">Avg</div>
                            <div className="stat-value font-mono font-bold">{averageRank}</div>
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-red-500/20 to-transparent mt-1"></div>
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
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-red-500/20 to-transparent mt-1"></div>
                        </div>

                        <div className="stat-item">
                            <div className="stat-label text-[10px] text-primary/80 uppercase tracking-wider mb-0.5">
                                Seasonal FLEX
                            </div>
                            <div className="stat-value font-mono font-bold text-yellow-500">
                                {totalSeasonalRewards > 0 ? totalSeasonalRewards.toLocaleString() : "-"}
                            </div>
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-red-500/20 to-transparent mt-1"></div>
                        </div>

                        <div className="stat-item">
                            <div className="stat-label text-[10px] text-primary/80 uppercase tracking-wider mb-0.5">Weekly FLEX</div>
                            <div className="stat-value font-mono font-bold text-green-500">
                                {totalWeeklyRewards > 0 ? totalWeeklyRewards.toLocaleString() : "-"}
                            </div>
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-red-500/20 to-transparent mt-1"></div>
                        </div>

                        <div className="stat-item">
                            <div className="stat-label text-[10px] text-primary/80 uppercase tracking-wider mb-0.5">Total FLEX</div>
                            <div className="stat-value font-mono font-bold text-primary">
                                {totalRewards > 0 ? totalRewards.toLocaleString() : "-"}
                            </div>
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-red-500/20 to-transparent mt-1"></div>
                        </div>

                        {/* Referral URL */}
                        <div className="mt-2 pt-2 border-t border-red-500/20 relative px-4">
                            <div className="w-1 h-4 bg-red-500 animate-pulse absolute left-0 top-2"></div>
                            <div className="w-1 h-4 bg-red-500 animate-pulse absolute right-0 top-2"></div>
                            <div className="stat-label text-[10px] text-red-500 uppercase tracking-wider mb-0.5">Join Us</div>
                            <div className="stat-value font-mono text-[9px] flex items-center">
                                {referralUrl}
                                <ExternalLink className="ml-1 h-2.5 w-2.5 text-red-500/70" />
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
            <div className="stats-overlay bg-black text-white p-2" style={{ backgroundColor: "#000000" }}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    {showTitle && (
                        <div className="flex flex-col">
                            <div className="flex items-center text-xs font-semibold text-primary whitespace-nowrap">
                                ExoGP {timeRangeLabel} Leaderboard
                            </div>
                            <div className="text-[10px] text-white/60 mt-0.5">{modeLabel}</div>
                        </div>
                    )}

                    <div className="flex items-center justify-center gap-3 text-xs">
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
                            <span className="text-muted-foreground mr-1">Seasonal FLEX:</span>
                            <span className="font-medium text-yellow-500">
                                {totalSeasonalRewards > 0 ? totalSeasonalRewards.toLocaleString() : "-"}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground mr-1">Weekly FLEX:</span>
                            <span className="font-medium text-green-500">
                                {totalWeeklyRewards > 0 ? totalWeeklyRewards.toLocaleString() : "-"}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground mr-1">Total FLEX:</span>
                            <span className="font-medium text-primary">{totalRewards > 0 ? totalRewards.toLocaleString() : "-"}</span>
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
        <div className="stats-overlay bg-black text-white p-2" style={{ backgroundColor: "#000000", width: "fit-content" }}>
            {showTitle && (
                <div className="flex flex-col mb-2">
                    <div className="text-xs font-semibold text-primary text-center">ExoGP {timeRangeLabel} Leaderboard</div>
                    <div className="text-[10px] text-white/60 mt-0.5 text-center">{modeLabel}</div>
                </div>
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
                    <span className="text-muted-foreground">Seasonal FLEX:</span>
                    <span className="font-medium text-yellow-500">
                        {totalSeasonalRewards > 0 ? totalSeasonalRewards.toLocaleString() : "-"}
                    </span>
                </div>
                <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Weekly FLEX:</span>
                    <span className="font-medium text-green-500">
                        {totalWeeklyRewards > 0 ? totalWeeklyRewards.toLocaleString() : "-"}
                    </span>
                </div>
                <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Total FLEX:</span>
                    <span className="font-medium text-primary">{totalRewards > 0 ? totalRewards.toLocaleString() : "-"}</span>
                </div>

                {/* Referral URL */}
                <div className="mt-1 pt-1 border-t border-red-500/20">
                    <span className="text-muted-foreground text-[9px]">Join us: {referralUrl}</span>
                </div>
            </div>
        </div>
    )
}
