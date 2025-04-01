"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Loader2, Trophy, ExternalLink } from "lucide-react"
import { trackOptions, timeRangeOptions } from "./track-options"
import { calculateRewards, type PlayerTrackResult } from "./player-dashboard"

interface StreamOverlayProps {
    playerName: string
    refreshInterval?: number // in seconds - how often to fetch new data
    rotationInterval?: number // in seconds - how often to rotate track groups
    tracksPerPage?: number // how many tracks to show per page
    showOnlyRanked?: boolean
    timeRange?: string
    region?: string
    mode?: string
    theme?: "default" | "futuristic"
    referralCode?: string // Added referral code parameter
}

// Format time from seconds to MM:SS.mmm
const formatTime = (timeInSeconds: number | null) => {
    if (timeInSeconds === null) return "-"

    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = Math.floor(timeInSeconds % 60)
    const milliseconds = Math.floor((timeInSeconds % 1) * 1000)

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`
}

// Format time difference
const formatTimeDiff = (playerTime: number | null, bestTime: number | null) => {
    if (playerTime === null || bestTime === null) return "-"
    if (playerTime === bestTime) return "+0.000"

    const diff = playerTime - bestTime
    const seconds = Math.floor(diff)
    const milliseconds = Math.floor((diff % 1) * 1000)

    return `+${seconds}.${milliseconds.toString().padStart(3, "0")}`
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

export function StreamOverlay({
    playerName,
    refreshInterval = 300, // Default 5 minutes
    rotationInterval = 30, // Default 30 seconds
    tracksPerPage = 10, // Default 10 tracks per page
    showOnlyRanked = false,
    timeRange = "stage3",
    region = "all",
    mode = "EMatchMode::TimeTrials",
    theme = "default",
    referralCode = "za9gX8PY", // Default referral code
}: StreamOverlayProps) {
    const [results, setResults] = useState<PlayerTrackResult[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(0)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [displayedResults, setDisplayedResults] = useState<PlayerTrackResult[]>([])

    // Refs to store the filtered and sorted results
    const filteredResultsRef = useRef<PlayerTrackResult[]>([])

    // Get the time range label for the title
    const timeRangeLabel = getTimeRangeLabel(timeRange)

    // Get the mode label for the title
    const modeLabel = getModeLabel(mode)

    // Construct the full referral URL
    const referralUrl = `https://planetatmos.helika.io/${referralCode}`

    // Function to fetch player data
    const fetchPlayerData = useCallback(async () => {
        if (!playerName) return

        setLoading(true)

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
        setLoading(false)

        // Reset to first page when new data is loaded
        setCurrentPage(0)
    }, [playerName, timeRange, region, mode])

    // Function to update displayed results based on current page
    const updateDisplayedResults = useCallback(() => {
        const allFilteredResults = filteredResultsRef.current
        const totalPages = Math.ceil(allFilteredResults.length / tracksPerPage)

        // If we're on a page that no longer exists (e.g., after filtering), reset to page 0
        const validPage = currentPage < totalPages ? currentPage : 0

        const startIndex = validPage * tracksPerPage
        const endIndex = startIndex + tracksPerPage
        const pageResults = allFilteredResults.slice(startIndex, endIndex)

        setDisplayedResults(pageResults)
    }, [currentPage, tracksPerPage])

    // Function to rotate to the next page with animation
    const rotateToNextPage = useCallback(() => {
        const allFilteredResults = filteredResultsRef.current
        const totalPages = Math.ceil(allFilteredResults.length / tracksPerPage)

        if (totalPages <= 1) return // Don't rotate if there's only one page

        setIsTransitioning(true)

        // After a short delay, change the page and remove the transition class
        setTimeout(() => {
            setCurrentPage((prevPage) => (prevPage + 1) % totalPages)

            // Update displayed results for the new page
            setTimeout(() => {
                updateDisplayedResults()
                setIsTransitioning(false)
            }, 50)
        }, 300) // Fade out duration
    }, [tracksPerPage, updateDisplayedResults])

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

    // Filter and sort results whenever the raw results change
    useEffect(() => {
        // Filter and sort all results
        const filtered = [...results]
            .filter((result) => !showOnlyRanked || result.playerRank !== null)
            .sort((a, b) => {
                // Sort by rank (null ranks at the bottom)
                if (a.playerRank === null && b.playerRank !== null) return 1
                if (a.playerRank !== null && b.playerRank === null) return -1
                if (a.playerRank === null && b.playerRank === null) {
                    // If both are null, sort by track name
                    return a.trackName.localeCompare(b.trackName)
                }
                return (a.playerRank || 999) - (b.playerRank || 999)
            })

        // Store the filtered results in the ref
        filteredResultsRef.current = filtered

        // Update the displayed results based on current page
        updateDisplayedResults()
    }, [results, showOnlyRanked, updateDisplayedResults])

    // Set up rotation interval
    useEffect(() => {
        const rotationIntervalId = setInterval(() => {
            rotateToNextPage()
        }, rotationInterval * 1000)

        return () => clearInterval(rotationIntervalId)
    }, [rotationInterval, rotateToNextPage])

    // Update displayed results when current page changes
    useEffect(() => {
        updateDisplayedResults()
    }, [updateDisplayedResults])

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

    return (
        <div
            className={`stream-overlay ${theme === "futuristic" ? "futuristic-stream-overlay" : ""} text-white p-2 rounded-md w-full max-w-xl`}
            style={{
                backgroundColor: "#000000",
                backgroundImage: "none",
                background: "#000000",
                opacity: 1,
            }}
        >
            {/* Dynamic Title based on timeRange and mode - Copied from stats-only-overlay */}
            <div className="text-center mb-2" style={{ backgroundColor: "#000000" }}>
                <div className="flex items-center justify-center text-xs font-bold text-primary whitespace-nowrap">
                    <div className="w-1 h-4 bg-primary mr-1.5 animate-pulse"></div>
                    ExoGP {timeRangeLabel} <span className="ml-1 text-white/80">LEADERBOARD</span>
                </div>
                <div className="text-[10px] text-white/60 mt-0.5">{modeLabel}</div>
            </div>

            {/* Stats Row - Centered */}
            <div
                className="flex justify-center items-center text-xs mb-1 px-1 space-x-6"
                style={{ backgroundColor: "#000000" }}
            >
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

            {/* Referral URL */}
            <div className="flex items-center justify-center mb-2 text-[10px]" style={{ backgroundColor: "#000000" }}>
                <div
                    className={`flex items-center ${theme === "futuristic" ? "relative px-4" : ""}`}
                    style={{ backgroundColor: "#000000", padding: theme === "futuristic" ? "2px 12px" : "2px 8px" }}
                >
                    {theme === "futuristic" && (
                        <>
                            <div className="w-1 h-4 bg-red-500 animate-pulse absolute left-0"></div>
                            <div className="w-1 h-4 bg-red-500 animate-pulse absolute right-0"></div>
                        </>
                    )}
                    <span className="text-red-500 font-semibold mr-1">JOIN US:</span>
                    <span className="font-mono">{referralUrl}</span>
                    <ExternalLink className="ml-1 h-2.5 w-2.5 text-red-500/70" />
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center items-center h-20" style={{ backgroundColor: "#000000" }}>
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
            ) : (
                <div className="overflow-hidden rounded-sm" style={{ backgroundColor: "#000000", background: "#000000" }}>
                    <table
                        className={`w-full border-collapse text-xs transition-opacity duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"}`}
                        style={{ backgroundColor: "#000000" }}
                    >
                        <thead>
                            <tr
                                className={`border-b ${theme === "futuristic" ? "border-red-500/20" : "border-red-500/20"}`}
                                style={{ backgroundColor: "#000000" }}
                            >
                                <th className="text-left py-1 px-2 font-medium">Track</th>
                                <th className="w-10 text-center py-1 px-1 font-medium">#</th>
                                <th className="text-left py-1 px-2 font-medium">Your Time</th>
                                <th className="text-left py-1 px-2 font-medium">Best Time</th>
                                <th className="text-left py-1 px-2 font-medium">Gap</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedResults.map((result) => (
                                <tr
                                    key={result.trackId}
                                    className={`border-b ${theme === "futuristic" ? "border-red-500/10" : "border-red-500/10"}`}
                                    style={{ backgroundColor: "#000000" }}
                                >
                                    <td className="py-1 px-2 font-medium text-[11px]">{result.trackName}</td>
                                    <td className="text-center py-1 px-1">
                                        {result.loading ? (
                                            <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                                        ) : result.playerRank ? (
                                            <span className={result.playerRank === 1 ? "text-yellow-500 font-semibold" : ""}>
                                                {result.playerRank}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </td>
                                    <td className="py-1 px-2">
                                        <span className="font-mono text-[11px]">{formatTime(result.playerTime)}</span>
                                    </td>
                                    <td className="py-1 px-2">
                                        <span className="font-mono text-[11px]">{formatTime(result.bestTime)}</span>
                                    </td>
                                    <td className="py-1 px-2">
                                        {result.playerTime && result.bestTime ? (
                                            <span
                                                className={`font-mono text-[11px] ${result.playerTime > result.bestTime ? "text-red-500" : "text-red-500/80"}`}
                                            >
                                                {formatTimeDiff(result.playerTime, result.bestTime)}
                                            </span>
                                        ) : (
                                            "-"
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

