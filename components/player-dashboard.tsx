"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { PlayerResults } from "./player-results"
import { trackOptions, timeRangeOptions, regionOptions } from "./track-options"

// Define a type for the leaderboard item
interface LeaderboardItem {
    player: string
    time: number
}

export type PlayerTrackResult = {
    trackId: string
    trackName: string
    playerRank: number | null
    playerTime: number | null
    bestPlayer: string | null
    bestTime: number | null
    rewards: number | null
    loading: boolean
}

// Function to calculate rewards based on rank
export function calculateRewards(rank: number | null): number | null {
    if (rank === null) return null

    if (rank === 1) return 10000
    if (rank === 2) return 8000
    if (rank === 3) return 6000
    if (rank >= 4 && rank <= 10) return 4000
    if (rank >= 11 && rank <= 50) return 2000

    return 0 // No rewards for ranks beyond 50th
}

export function PlayerDashboard() {
    const [playerName, setPlayerName] = useState("")
    const [mode, setMode] = useState("EMatchMode::TimeTrials")
    const [timeRange, setTimeRange] = useState("stage3")
    const [region, setRegion] = useState("all")
    const [isSearching, setIsSearching] = useState(false)
    const [results, setResults] = useState<PlayerTrackResult[]>([])
    const [hasSearched, setHasSearched] = useState(false)

    // Custom date range states
    const [customStartDate, setCustomStartDate] = useState("")
    const [customEndDate, setCustomEndDate] = useState("")
    const [appliedCustomRange, setAppliedCustomRange] = useState({
        startDate: "",
        endDate: "",
    })

    // Initialize custom date range with default values when "Custom Range" is selected
    useEffect(() => {
        if (timeRange === "custom" && customStartDate === "" && customEndDate === "") {
            // Set default values for custom range (e.g., last 7 days)
            const end = new Date()
            const start = new Date()
            start.setDate(start.getDate() - 7)

            // Format dates for datetime-local input (YYYY-MM-DDThh:mm)
            setCustomStartDate(formatDateForInput(start))
            setCustomEndDate(formatDateForInput(end))
        }
    }, [timeRange, customStartDate, customEndDate])

    // Helper function to format date for datetime-local input
    const formatDateForInput = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        const hours = String(date.getHours()).padStart(2, "0")
        const minutes = String(date.getMinutes()).padStart(2, "0")

        return `${year}-${month}-${day}T${hours}:${minutes}`
    }

    // Apply custom date range and trigger search immediately
    const applyCustomRange = () => {
        if (customStartDate && customEndDate) {
            const newCustomRange = {
                startDate: new Date(customStartDate).toISOString(),
                endDate: new Date(customEndDate).toISOString(),
            }

            setAppliedCustomRange(newCustomRange)

            // Trigger search immediately if player name is provided
            if (playerName.trim()) {
                performSearch(newCustomRange.startDate, newCustomRange.endDate)
            }
        }
    }

    // Shared search logic used by both the Apply button and Search button
    const performSearch = async (startDateOverride?: string, endDateOverride?: string) => {
        if (!playerName.trim()) return

        setIsSearching(true)
        setHasSearched(true)

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

        setResults(initialResults)

        // Get date range based on selected time range
        let startDate, endDate

        if (timeRange === "custom") {
            if (startDateOverride && endDateOverride) {
                // Use the overrides provided (from Apply button)
                startDate = startDateOverride
                endDate = endDateOverride
            } else if (appliedCustomRange.startDate && appliedCustomRange.endDate) {
                // Use the previously applied custom date range
                startDate = appliedCustomRange.startDate
                endDate = appliedCustomRange.endDate
            } else {
                // Fallback to default range
                startDate = timeRangeOptions[0].startDate
                endDate = timeRangeOptions[0].endDate
            }
        } else {
            const selectedTimeRange = timeRangeOptions.find((t) => t.value === timeRange)

            // For dynamic date ranges (today, week, month), we need to get the current values
            if (selectedTimeRange) {
                if (typeof selectedTimeRange.startDate === "string") {
                    startDate = selectedTimeRange.startDate
                } else if (typeof selectedTimeRange.startDate === "function") {
                    // This handles the getter functions for dynamic dates
                    startDate = selectedTimeRange.startDate
                } else {
                    startDate = timeRangeOptions[0].startDate
                }

                if (typeof selectedTimeRange.endDate === "string") {
                    endDate = selectedTimeRange.endDate
                } else if (typeof selectedTimeRange.endDate === "function") {
                    // This handles the getter functions for dynamic dates
                    endDate = selectedTimeRange.endDate
                } else {
                    endDate = timeRangeOptions[0].endDate
                }
            } else {
                startDate = timeRangeOptions[0].startDate
                endDate = timeRangeOptions[0].endDate
            }
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
                        (item: LeaderboardItem) => item.player.toLowerCase() === playerName.toLowerCase(),
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
        setIsSearching(false)
    }

    // Handle form submission (Search button)
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        performSearch()
    }

    return (
        <div className="space-y-8">
            <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSearch} className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        <Input
                            placeholder="Epic Games username"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            required
                            className="h-10 w-full"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Select value={mode} onValueChange={setMode}>
                                    <SelectTrigger className="h-10 w-full">
                                        <SelectValue placeholder="Select mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EMatchMode::TimeTrials">Time Trials</SelectItem>
                                        <SelectItem value="EMatchMode::Matchmaking_Unranked">Quickplay</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Select value={timeRange} onValueChange={setTimeRange}>
                                    <SelectTrigger className="h-10 w-full">
                                        <SelectValue placeholder="Time Range" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {timeRangeOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Select value={region} onValueChange={setRegion}>
                                    <SelectTrigger className="h-10 w-full">
                                        <SelectValue placeholder="Region" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {regionOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Custom Date Range Picker - Only shown when "Custom Range" is selected */}
                        {timeRange === "custom" && (
                            <div className="border border-border rounded-md p-4 mt-2">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-5">
                                        <Label htmlFor="start-date" className="mb-2 block">
                                            Start Date (UTC)
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="start-date"
                                                type="datetime-local"
                                                value={customStartDate}
                                                onChange={(e) => setCustomStartDate(e.target.value)}
                                                className="h-10 w-full"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-5">
                                        <Label htmlFor="end-date" className="mb-2 block">
                                            End Date (UTC)
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="end-date"
                                                type="datetime-local"
                                                value={customEndDate}
                                                onChange={(e) => setCustomEndDate(e.target.value)}
                                                className="h-10 w-full"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 flex items-end">
                                        <Button
                                            type="button"
                                            onClick={applyCustomRange}
                                            className="h-10 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                                            disabled={isSearching || !playerName.trim()}
                                        >
                                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90"
                        disabled={isSearching}
                    >
                        {isSearching ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Searching...
                            </>
                        ) : (
                            <>
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </>
                        )}
                    </Button>
                </form>
            </div>

            {hasSearched && <PlayerResults playerName={playerName} results={results} />}
        </div>
    )
}

