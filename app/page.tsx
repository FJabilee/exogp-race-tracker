import { PlayerDashboard } from "@/components/player-dashboard"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-medium mb-2">ExoGP Leaderboards</h1>
        <p className="text-muted-foreground">
          Track your race times across all tracks and compare with the best players in the game
        </p>
      </div>
      <PlayerDashboard />
    </main>
  )
}

