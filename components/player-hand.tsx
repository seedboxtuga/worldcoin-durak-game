"use client"

import type { Card as CardType } from "@/components/card-game"

interface PlayerHandProps {
  cards: CardType[]
  selectedCardIndex: number | null
  onSelectCard: (index: number) => void
  onPlayCard: (index: number) => void
}

export function PlayerHand({ cards, selectedCardIndex, onSelectCard, onPlayCard }: PlayerHandProps) {
  const cardSuitSymbols: Record<string, string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Your Hand ({cards.length})</p>
      <div className="flex justify-center gap-2 flex-wrap">
        {cards.map((card, idx) => (
          <button
            key={idx}
            onClick={() => onSelectCard(selectedCardIndex === idx ? -1 : idx)}
            className={`relative transition-all duration-200 ${selectedCardIndex === idx ? "transform -translate-y-4" : ""}`}
          >
            <div
              className={`w-16 h-24 rounded-lg font-bold text-lg flex items-center justify-center cursor-pointer transition-all duration-200 border-2 ${
                selectedCardIndex === idx
                  ? "border-primary shadow-lg shadow-primary/50"
                  : "border-border hover:border-primary"
              }`}
              style={{
                background:
                  card.suit === "hearts" || card.suit === "diamonds"
                    ? "linear-gradient(135deg, #cb3231, #a02827)"
                    : "linear-gradient(135deg, #3a3a35, #1a1a17)",
                color: "#f5f5f0",
              }}
            >
              <div className="flex flex-col items-center">
                <span>{card.rank}</span>
                <span className="text-xs mt-1">{cardSuitSymbols[card.suit]}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedCardIndex !== null && (
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => onPlayCard(selectedCardIndex)}
            className="px-6 py-2 bg-primary hover:bg-accent text-primary-foreground font-bold rounded-lg transition-all"
          >
            Play Card
          </button>
          <button
            onClick={() => onSelectCard(-1)}
            className="px-6 py-2 bg-card hover:bg-secondary border border-border text-foreground font-bold rounded-lg transition-all"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
