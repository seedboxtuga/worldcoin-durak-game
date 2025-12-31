export enum Suit {
  Hearts = "hearts",
  Diamonds = "diamonds",
  Clubs = "clubs",
  Spades = "spades",
}

export interface Card {
  suit: Suit
  rank: string
}

export function getCardEmoji(suit: Suit): string {
  const suits: Record<Suit, string> = {
    [Suit.Hearts]: "♥",
    [Suit.Diamonds]: "♦",
    [Suit.Clubs]: "♣",
    [Suit.Spades]: "♠",
  }
  return suits[suit]
}
