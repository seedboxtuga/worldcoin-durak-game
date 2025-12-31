"use client"

import { useState } from "react"
import { AuthFlow } from "@/components/auth-flow"
import { GameLobby } from "@/components/game-lobby"
import { GameBoard } from "@/components/game-board"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [gameState, setGameState] = useState<"lobby" | "playing">("lobby")
  const [userInfo, setUserInfo] = useState<{
    username?: string
    walletAddress?: string
    profilePictureUrl?: string
  } | null>(null)
  const [gameMode, setGameMode] = useState<"bot" | "multiplayer">("bot")
  const [botDifficulty, setBotDifficulty] = useState<"easy" | "medium" | "hard">("medium")

  const handleAuthSuccess = (userData: any) => {
    setUserInfo(userData)
    setIsAuthenticated(true)
    setGameState("lobby")
  }

  const handleStartGame = (mode: "bot" | "multiplayer", difficulty?: "easy" | "medium" | "hard") => {
    setGameMode(mode)
    if (difficulty) setBotDifficulty(difficulty)
    setGameState("playing")
  }

  if (!isAuthenticated) {
    return <AuthFlow onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {gameState === "lobby" ? (
        <GameLobby userInfo={userInfo} onStartGame={handleStartGame} />
      ) : (
        <GameBoard
          userInfo={userInfo}
          gameMode={gameMode}
          botDifficulty={botDifficulty}
          onExitGame={() => setGameState("lobby")}
        />
      )}
    </main>
  )
}
