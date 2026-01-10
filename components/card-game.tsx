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

export const VALID_RANKS = ["6", "7", "8", "9", "10", "J", "Q", "K", "A"]

export const rankValue: Record<string, number> = {
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
}
