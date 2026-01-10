import type { Card } from "@/components/card-game"
import { rankValue } from "@/components/card-game"

export function generateBotMove(
  hand: Card[],
  tableCards: Array<{ attack: Card; defend?: Card }>,
  difficulty: "easy" | "medium" | "hard",
): Card | null {
  if (hand.length === 0) return null

  // First attack - any card is valid
  if (tableCards.length === 0) {
    if (difficulty === "easy") {
      return hand[Math.floor(Math.random() * hand.length)]
    }
    // Medium/Hard: Use lowest card to start
    return hand.reduce((lowest, current) => (rankValue[current.rank] < rankValue[lowest.rank] ? current : lowest))
  }

  // Throw-in phase - must match rank on table
  const validRanks = new Set<string>()
  tableCards.forEach((pair) => {
    validRanks.add(pair.attack.rank)
    if (pair.defend) validRanks.add(pair.defend.rank)
  })

  const matchingCards = hand.filter((card) => validRanks.has(card.rank))

  if (matchingCards.length === 0) return null

  if (difficulty === "easy") {
    return matchingCards[Math.floor(Math.random() * matchingCards.length)]
  }

  if (difficulty === "medium") {
    // Prefer lower matching cards
    return matchingCards.reduce((lowest, current) =>
      rankValue[current.rank] < rankValue[lowest.rank] ? current : lowest,
    )
  }

  // Hard: Strategic - throw in high cards to pressure defender
  return matchingCards.reduce((highest, current) =>
    rankValue[current.rank] > rankValue[highest.rank] ? current : highest,
  )
}

export function getBotDefenseMove(
  hand: Card[],
  attackCard: Card,
  difficulty: "easy" | "medium" | "hard",
  trumpCard: Card,
): Card | null {
  const validDefenses = hand.filter((card) => {
    const isAttackTrump = attackCard.suit === trumpCard.suit
    const isDefenseTrump = card.suit === trumpCard.suit

    // Trump card defending against trump: must be higher rank
    if (isAttackTrump && isDefenseTrump) {
      return rankValue[card.rank] > rankValue[attackCard.rank]
    }

    // Trump defending against non-trump: always valid
    if (isDefenseTrump && !isAttackTrump) {
      return true
    }

    // Non-trump defending against trump: never valid
    if (!isDefenseTrump && isAttackTrump) {
      return false
    }

    // Same suit with higher rank
    if (card.suit === attackCard.suit && rankValue[card.rank] > rankValue[attackCard.rank]) {
      return true
    }

    return false
  })

  if (validDefenses.length === 0) return null

  if (difficulty === "easy") {
    return validDefenses[Math.floor(Math.random() * validDefenses.length)]
  }

  const trumpDefenses = validDefenses.filter((c) => c.suit === trumpCard.suit && attackCard.suit !== trumpCard.suit)
  const suitDefenses = validDefenses.filter((c) => c.suit === attackCard.suit)

  // Prefer same suit over trump to conserve trump cards
  if (suitDefenses.length > 0) {
    return suitDefenses.reduce((lowest, current) =>
      rankValue[current.rank] < rankValue[lowest.rank] ? current : lowest,
    )
  }

  // Use lowest trump if necessary
  if (trumpDefenses.length > 0) {
    return trumpDefenses.reduce((lowest, current) =>
      rankValue[current.rank] < rankValue[lowest.rank] ? current : lowest,
    )
  }

  return validDefenses[0]
}
