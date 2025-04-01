"use client"

import { useState } from "react"
import { StatsOnlyOverlay } from "@/components/stats-only-overlay"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { timeRangeOptions, regionOptions } from "@/components/track-options"

export default function StreamPage() {
    const [playerName, setPlayerName] = useState("")
    const [configuredPlayer, setConfiguredPlayer] = useState("")
    const [refreshInterval, setRefreshInterval] = useState(300) // 5 minutes default
    const [rotationInterval, setRotationInterval] = useState(30) // 30 seconds default
    const [tracksPerPage, setTracksPerPage] = useState(10) // 10 tracks per page default
    const [showOnlyRanked, setShowOnlyRanked] = useState(true)
    const [timeRange, setTimeRange] = useState("stage3")
    const [region, setRegion] = useState("all")
    const [mode, setMode] = useState("EMatchMode::TimeTrials")
    const [showConfig, setShowConfig] = useState(true)
    const [statsLayout, setStatsLayout] = useState<"horizontal" | "vertical">("horizontal")
    const [showTitle, setShowTitle] = useState(true)
    const [theme, setTheme] = useState<"default" | "futuristic">("futuristic")
    const [referralCode, setReferralCode] = useState("za9gX8PY") // Default referral code
    const [activeTab, setActiveTab] = useState("full")

    const handleApply = () => {
        setConfiguredPlayer(playerName)
    }

    const toggleConfig = () => {
        setShowConfig(!showConfig)
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">ExoGP Stream Overlay</h1>
                <Button onClick={toggleConfig} variant="outline">
                    {showConfig ? "Hide Config" : "Show Config"}
                </Button>
            </div>

            {showConfig && (
                <div className="bg-card p-6 rounded-lg shadow-lg mb-8 border border-border">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="full">Full Leaderboard</TabsTrigger>
                            <TabsTrigger value="stats">Stats Only</TabsTrigger>
                        </TabsList>

                        <div className="mb-6">
                            <h2 className="text-xl font-semibold mb-4">Configuration</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="playerName">Player Name</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="playerName"
                                                placeholder="Epic Games username"
                                                value={playerName}
                                                onChange={(e) => setPlayerName(e.target.value)}
                                            />
                                            <Button onClick={handleApply}>Apply</Button>
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="mode">Game Mode</Label>
                                        <Select value={mode} onValueChange={setMode}>
                                            <SelectTrigger id="mode">
                                                <SelectValue placeholder="Select mode" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="EMatchMode::TimeTrials">Time Trials</SelectItem>
                                                <SelectItem value="EMatchMode::Matchmaking_Unranked">Quickplay</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="timeRange">Time Range</Label>
                                        <Select value={timeRange} onValueChange={setTimeRange}>
                                            <SelectTrigger id="timeRange">
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
                                        <Label htmlFor="region">Region</Label>
                                        <Select value={region} onValueChange={setRegion}>
                                            <SelectTrigger id="region">
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

                                    <div>
                                        <Label htmlFor="referralCode">Referral Code</Label>
                                        <Input
                                            id="referralCode"
                                            placeholder="Referral code for join URL"
                                            value={referralCode}
                                            onChange={(e) => setReferralCode(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Will be displayed as: https://planetatmos.helika.io/{referralCode}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="refreshInterval">Data Refresh Interval: {refreshInterval} seconds</Label>
                                        <Slider
                                            id="refreshInterval"
                                            min={60}
                                            max={1800}
                                            step={60}
                                            value={[refreshInterval]}
                                            onValueChange={(value) => setRefreshInterval(value[0])}
                                            className="mt-2"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">How often to fetch new data from the API</p>
                                    </div>

                                    <TabsContent value="full" className="mt-0 space-y-4">
                                        <div>
                                            <Label htmlFor="rotationInterval">Track Rotation Interval: {rotationInterval} seconds</Label>
                                            <Slider
                                                id="rotationInterval"
                                                min={10}
                                                max={120}
                                                step={5}
                                                value={[rotationInterval]}
                                                onValueChange={(value) => setRotationInterval(value[0])}
                                                className="mt-2"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">How often to rotate between pages of tracks</p>
                                        </div>

                                        <div>
                                            <Label htmlFor="tracksPerPage">Tracks Per Page: {tracksPerPage}</Label>
                                            <Slider
                                                id="tracksPerPage"
                                                min={5}
                                                max={20}
                                                step={1}
                                                value={[tracksPerPage]}
                                                onValueChange={(value) => setTracksPerPage(value[0])}
                                                className="mt-2"
                                            />
                                        </div>

                                        <div className="flex items-center space-x-2 pt-4">
                                            <Switch id="showOnlyRanked" checked={showOnlyRanked} onCheckedChange={setShowOnlyRanked} />
                                            <Label htmlFor="showOnlyRanked">Show only ranked tracks</Label>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="stats" className="mt-0 space-y-4">
                                        <div>
                                            <Label htmlFor="theme">Theme</Label>
                                            <Select value={theme} onValueChange={(value: "default" | "futuristic") => setTheme(value)}>
                                                <SelectTrigger id="theme">
                                                    <SelectValue placeholder="Select theme" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="default">Default</SelectItem>
                                                    <SelectItem value="futuristic">Futuristic</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="statsLayout">Layout</Label>
                                            <Select
                                                value={statsLayout}
                                                onValueChange={(value: "horizontal" | "vertical") => setStatsLayout(value)}
                                            >
                                                <SelectTrigger id="statsLayout">
                                                    <SelectValue placeholder="Select layout" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="horizontal">Horizontal</SelectItem>
                                                    <SelectItem value="vertical">Vertical</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center space-x-2 pt-4">
                                            <Switch id="showTitle" checked={showTitle} onCheckedChange={setShowTitle} />
                                            <Label htmlFor="showTitle">Show title</Label>
                                        </div>
                                    </TabsContent>
                                </div>
                            </div>
                        </div>

                        <TabsContent value="full">
                            <div className="pt-4">
                                <p className="text-sm text-muted-foreground mb-2">Stream URL (OBS Browser Source):</p>
                                <div className="bg-muted p-2 rounded text-xs break-all">
                                    {typeof window !== "undefined"
                                        ? `${window.location.origin}/stream/embed?player=${encodeURIComponent(playerName)}&refresh=${refreshInterval}&rotate=${rotationInterval}&tracksPerPage=${tracksPerPage}&ranked=${showOnlyRanked}&timeRange=${timeRange}&region=${region}&mode=${encodeURIComponent(mode)}`
                                        : ""}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">Recommended size: 600px width, 400px height</p>
                            </div>
                        </TabsContent>

                        <TabsContent value="stats">
                            <div className="pt-4">
                                <p className="text-sm text-muted-foreground mb-2">Stream URL (OBS Browser Source):</p>
                                <div className="bg-muted p-2 rounded text-xs break-all">
                                    {typeof window !== "undefined"
                                        ? `${window.location.origin}/stream/stats?player=${encodeURIComponent(playerName)}&refresh=${refreshInterval}&timeRange=${timeRange}&region=${region}&mode=${encodeURIComponent(mode)}&layout=${statsLayout}&title=${showTitle}&theme=${theme}&referral=${referralCode}`
                                        : ""}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Recommended size:{" "}
                                    {statsLayout === "horizontal" ? "400px width, 60px height" : "150px width, 150px height"}
                                </p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}

            <div className={`${configuredPlayer ? "" : "opacity-50"}`}>
                {configuredPlayer ? (
                    <StatsOnlyOverlay
                        playerName={configuredPlayer}
                        refreshInterval={refreshInterval}
                        timeRange={timeRange}
                        region={region}
                        mode={mode}
                        layout={statsLayout}
                        showTitle={showTitle}
                        theme={theme}
                        referralCode={referralCode}
                    />
                ) : (
                    <div className="bg-card p-8 rounded-lg text-center">
                        <p>Enter a player name and click Apply to see the stream overlay</p>
                    </div>
                )}
            </div>
        </div>
    )
}

