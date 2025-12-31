"use client"

import { useState } from "react"
import { Users, Play, Bot } from "lucide-react"
import { WorldcoinLogo } from "@/components/worldcoin-logo"

interface GameLobbyProps {
  userInfo: any
  onStartGame: (gameMode: "bot" | "multiplayer", difficulty?: "easy" | "medium" | "hard") => void
}

export function GameLobby({ userInfo, onStartGame }: GameLobbyProps) {
  const [selectedMode, setSelectedMode] = useState<"bot" | "multiplayer" | null>(null)
  const [botDifficulty, setBotDifficulty] = useState<"easy" | "medium" | "hard">("medium")

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header with Logo */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <WorldcoinLogo className="w-16 h-16" />
          <div>
            <h1 className="text-2xl font-black text-primary">DURAK</h1>
            <p className="text-muted-foreground text-sm mt-1">Worldcoin Card Game</p>
          </div>
        </div>
      </div>

      {/* Player Profile */}
      <div className="mb-8 bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-4">
          {userInfo?.profilePictureUrl && (
            <img
              src={userInfo.profilePictureUrl || "/placeholder.svg"}
              alt={userInfo.username}
              className="w-16 h-16 rounded-full border-2 border-primary"
            />
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{userInfo?.username || "Player"}</h2>
            <p className="text-muted-foreground text-sm">
              {userInfo?.walletAddress?.slice(0, 6)}...
              {userInfo?.walletAddress?.slice(-4)}
            </p>
          </div>
        </div>
      </div>

      {/* Game Mode Selection */}
      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-bold text-foreground">Select Game Mode</h3>

        {/* vs Bot */}
        <div
          onClick={() => setSelectedMode("bot")}
          className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
            selectedMode === "bot" ? "bg-primary/10 border-primary" : "bg-card border-border hover:border-primary"
          }`}
        >
          <div className="flex items-start gap-4">
            <Bot size={24} className="text-primary mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-foreground text-lg mb-2">Play vs Bot</h3>
              <p className="text-muted-foreground text-sm mb-4">Practice your skills against AI opponents</p>

              {selectedMode === "bot" && (
                <div className="space-y-3 mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">Select difficulty:</p>
                  <div className="flex gap-2">
                    {(["easy", "medium", "hard"] as const).map((diff) => (
                      <button
                        key={diff}
                        onClick={(e) => {
                          e.stopPropagation()
                          setBotDifficulty(diff)
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          botDifficulty === diff
                            ? "bg-primary text-primary-foreground"
                            : "bg-background border border-border text-foreground hover:border-primary"
                        }`}
                      >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onStartGame("bot", botDifficulty)
                    }}
                    className="w-full mt-4 px-6 py-3 bg-primary hover:bg-accent text-primary-foreground font-bold rounded-lg transition-all"
                  >
                    Start Game
                  </button>
                </div>
              )}
            </div>
            <Play size={20} className={selectedMode === "bot" ? "text-primary" : "text-muted-foreground"} />
          </div>
        </div>

        {/* Coming Soon: Multiplayer */}
        <div className="p-6 rounded-xl border-2 border-border bg-card opacity-50">
          <div className="flex items-start gap-4">
            <Users size={24} className="text-muted-foreground mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-foreground text-lg">Multiplayer</h3>
              <p className="text-muted-foreground text-sm">Play with other verified users (Coming Soon)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-muted-foreground text-sm">Total Games</p>
          <p className="text-2xl font-bold text-primary mt-1">0</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-muted-foreground text-sm">Win Rate</p>
          <p className="text-2xl font-bold text-accent mt-1">-</p>
        </div>
      </div>
    </div>
  )
}
