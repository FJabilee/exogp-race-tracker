"use client"

import type React from "react"

import { useState } from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlayerResults } from "./player-results"
import { trackOptions } from "./track-options"

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
    loading: boolean
}

export function PlayerDashboard() {
    const [playerName, setPlayerName] = useState("")
    const [mode, setMode] = useState("EMatchMode::TimeTrials")
    const [isSearching, setIsSearching] = useState(false)
    const [results, setResults] = useState<PlayerTrackResult[]>([])
    const [hasSearched, setHasSearched] = useState(false)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()

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
            loading: true,
        }))

        setResults(initialResults)

        // Get current date for stage3 date range
        const startDate = new Date("2025-03-13T17:00:00.000Z").toISOString()
        const endDate = new Date("2025-04-28T06:59:59.999Z").toISOString()

        // Fetch data for each track
        const updatedResults = await Promise.all(
            trackOptions.map(async (track, index) => {
                try {
                    // Fetch top 20 players for this track
                    const url = `https://leaderboards.planetatmos.com/api/leaderboard/tracks/${track.value}?page=0&perPage=20&distinctOnUser=true&mode=${mode}&startDate=${startDate}&endDate=${endDate}&track=${track.value}`

                    const response = await fetch(url)
                    const data = await response.json()

                    // Find the player in the results
                    const playerResult = data.items.find(
                        (item: LeaderboardItem) => item.player.toLowerCase() === playerName.toLowerCase(),
                    )

                    // Get the best player (first in the list)
                    const bestResult = data.items[0]

                    return {
                        trackId: track.value,
                        trackName: track.label,
                        playerRank: playerResult ? data.items.indexOf(playerResult) + 1 : null,
                        playerTime: playerResult ? playerResult.time : null,
                        bestPlayer: bestResult ? bestResult.player : null,
                        bestTime: bestResult ? bestResult.time : null,
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

    return (
        <div className="space-y-8">
            <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSearch} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-3">
                            <Input
                                placeholder="Player name"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                required
                                className="h-10 w-full"
                            />
                        </div>

                        <div>
                            <Select value={mode} onValueChange={setMode}>
                                <SelectTrigger className="h-10 w-full">
                                    <SelectValue placeholder="Select mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EMatchMode::TimeTrials">Time Trials</SelectItem>
                                    <SelectItem value="EMatchMode::InvalidRaceMode">Quickplay</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
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

