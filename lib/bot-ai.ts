import type { Card } from "@/components/card-game"

export function generateBotMove(
  hand: Card[],
  tableCards: Array<{ attack: Card; defend?: Card }>,
  difficulty: "easy" | "medium" | "hard",
): Card | null {
  if (hand.length === 0) return null

  // Easy: Random card
  if (difficulty === "easy") {
    return hand[Math.floor(Math.random() * hand.length)]
  }

  // Medium: Smart random (prefer cards matching table ranks)
  if (difficulty === "medium") {
    const matchingCards = hand.filter((card) =>
      tableCards.some((pair) => pair.attack.rank === card.rank || pair.defend?.rank === card.rank),
    )
    if (matchingCards.length > 0) {
      return matchingCards[Math.floor(Math.random() * matchingCards.length)]
    }
    return hand[Math.floor(Math.random() * hand.length)]
  }

  // Hard: Strategic play (prefer high cards for table dominance)
  const rankValue: Record<string, number> = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
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

  const matchingCards = hand.filter((card) =>
    tableCards.some((pair) => pair.attack.rank === card.rank || pair.defend?.rank === card.rank),
  )

  if (matchingCards.length > 0) {
    return matchingCards.reduce((best, current) => (rankValue[current.rank] > rankValue[best.rank] ? current : best))
  }

  return hand.reduce((best, current) => (rankValue[current.rank] > rankValue[best.rank] ? current : best))
}

const rankValue: Record<string, number> = {
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

export function getBotDefenseMove(
  hand: Card[],
  attackCard: Card,
  difficulty: "easy" | "medium" | "hard",
  trumpCard: Card,
): Card | null {
  // Find cards that can beat the attack card
  const validDefenses = hand.filter((card) => {
    // Trump beats any non-trump
    if (card.suit === trumpCard.suit && attackCard.suit !== trumpCard.suit) return true
    // Same suit with higher rank
    if (card.suit === attackCard.suit && rankValue[card.rank] > rankValue[attackCard.rank]) return true
    return false
  })

  if (validDefenses.length === 0) return null

  if (difficulty === "easy") {
    // Random valid card
    return validDefenses[Math.floor(Math.random() * validDefenses.length)]
  }

  if (difficulty === "medium") {
    // Middle difficulty - prefer lower cards to conserve high cards
    return validDefenses[Math.floor(validDefenses.length / 2)]
  }

  // Hard: Use lowest possible trump or lowest same suit
  const trumpDefenses = validDefenses.filter((c) => c.suit === trumpCard.suit)
  if (trumpDefenses.length > 0) {
    return trumpDefenses.reduce((lowest, current) =>
      rankValue[current.rank] < rankValue[lowest.rank] ? current : lowest,
    )
  }

  return validDefenses.reduce((lowest, current) =>
    rankValue[current.rank] < rankValue[lowest.rank] ? current : lowest,
  )
}
