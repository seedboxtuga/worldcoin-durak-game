"use client"

import type React from "react"
import { WorldcoinLogo } from "@/components/worldcoin-logo"
import { useState } from "react"

interface AuthFlowProps {
  onAuthSuccess: (userData: any) => void
}

export function AuthFlow({ onAuthSuccess }: AuthFlowProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      setError("Please enter a username")
      return
    }

    setIsLoading(true)
    setError(null)

    setTimeout(() => {
      onAuthSuccess({
        username: username,
        walletAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
        profilePictureUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      })
      setIsLoading(false)
    }, 1000)
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-6">
            <WorldcoinLogo className="w-24 h-24" />
          </div>
          <div className="text-4xl font-black text-primary">DURAK</div>
          <p className="text-card-foreground text-lg">Card Game for Verified Users</p>
          <p className="text-muted-foreground text-xs">(Preview Mode)</p>
        </div>

        {/* Auth Card */}
        <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-muted-foreground text-sm mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold py-4 rounded-xl transition-all duration-200 text-lg"
            >
              {isLoading ? "Logging in..." : "Enter Game"}
            </button>
          </form>

          {/* Info */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-start gap-3">
              <div className="text-primary text-xl mt-1">✓</div>
              <p className="text-sm text-muted-foreground">Fast-paced card game</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-primary text-xl mt-1">✓</div>
              <p className="text-sm text-muted-foreground">Authentic Durak rules</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-primary text-xl mt-1">✓</div>
              <p className="text-sm text-muted-foreground">Challenge the AI</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
