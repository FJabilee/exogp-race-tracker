import { PlayerDashboard } from "@/components/player-dashboard"
import Image from "next/image"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3">
          <Image src="/exogp.svg" alt="ExoGP Logo" width={198} height={42} priority />
        </div>
        <h1 className="text-2xl font-medium mb-2">Leaderboards</h1>
        <p className="text-muted-foreground">
          Track your race times across all tracks and compare with the best players in the game
        </p>
        <p className="text-muted-foreground">
          Insert your Epic Games Username below
        </p>
      </div>
      <PlayerDashboard />
    </main>
  )
}

