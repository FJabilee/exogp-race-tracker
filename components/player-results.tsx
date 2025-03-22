import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy, Loader2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { PlayerTrackResult } from "./player-dashboard"

interface PlayerResultsProps {
    playerName: string
    results: PlayerTrackResult[]
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

export function PlayerResults({ playerName, results }: PlayerResultsProps) {
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

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto text-center">
                <div>
                    <div className="text-sm text-muted-foreground mb-1">Tracks Ranked</div>
                    <div className="text-2xl">
                        {rankedTracks} / {results.length}
                    </div>
                </div>

                <div>
                    <div className="text-sm text-muted-foreground mb-1">Average Rank</div>
                    <div className="text-2xl">{averageRank}</div>
                </div>

                <div>
                    <div className="text-sm text-muted-foreground mb-1">Best Rank</div>
                    <div className="text-2xl">
                        {bestRank !== null ? (
                            <>
                                {bestRank === 1 ? (
                                    <span className="flex items-center justify-center">
                                        1 <Trophy className="ml-1 h-5 w-5 text-yellow-500" />
                                    </span>
                                ) : (
                                    bestRank
                                )}
                            </>
                        ) : (
                            "-"
                        )}
                    </div>
                </div>
            </div>

            <div>
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-muted/20">
                            <TableHead className="font-medium">Track</TableHead>
                            <TableHead className="w-16 text-center font-medium">Rank</TableHead>
                            <TableHead className="font-medium">Your Time</TableHead>
                            <TableHead className="font-medium">Time to Beat</TableHead>
                            <TableHead className="font-medium">Gap</TableHead>
                            <TableHead className="hidden md:table-cell font-medium">Best Player</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {results.map((result) => (
                            <TableRow key={result.trackId} className="border-b border-muted/10">
                                <TableCell className="font-medium">{result.trackName}</TableCell>
                                <TableCell className="text-center">
                                    {result.loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                    ) : result.playerRank ? (
                                        <span className={result.playerRank === 1 ? "text-yellow-500 font-semibold" : ""}>
                                            {result.playerRank}
                                        </span>
                                    ) : (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <span className="text-muted-foreground text-sm">DNR</span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Did not race or not in top 20</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {result.loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <span className="font-mono text-sm">{formatTime(result.playerTime)}</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {result.loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <span className="font-mono text-sm">{formatTime(result.bestTime)}</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {result.loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : result.playerTime && result.bestTime ? (
                                        <span className={`font-mono text-sm ${result.playerTime > result.bestTime ? "text-red-500" : ""}`}>
                                            {formatTimeDiff(result.playerTime, result.bestTime)}
                                        </span>
                                    ) : (
                                        "-"
                                    )}
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {result.loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : result.bestPlayer ? (
                                        <span className="flex items-center text-sm">
                                            {result.bestPlayer}
                                            {result.bestPlayer.toLowerCase() === playerName.toLowerCase() && (
                                                <Trophy className="ml-1 h-4 w-4 text-yellow-500" />
                                            )}
                                        </span>
                                    ) : (
                                        "-"
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

