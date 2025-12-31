"use client"

import { useState, useEffect } from "react"
import { ArrowLeft } from "lucide-react"
import { type Card, Suit } from "@/components/card-game"
import { PlayerHand } from "@/components/player-hand"
import { getBotDefenseMove } from "@/lib/bot-ai"

interface GameBoardProps {
  userInfo: any
  gameMode: "bot" | "multiplayer"
  botDifficulty?: "easy" | "medium" | "hard"
  onExitGame: () => void
}

const VALID_RANKS = ["6", "7", "8", "9", "10", "J", "Q", "K", "A"]

export function GameBoard({ userInfo, gameMode, botDifficulty = "medium", onExitGame }: GameBoardProps) {
  const [gameActive, setGameActive] = useState(true)
  const [deck, setDeck] = useState<Card[]>([])
  const [tableCards, setTableCards] = useState<Array<{ attack: Card; defend?: Card }>>([])
  const [hand, setHand] = useState<Card[]>([])
  const [botHand, setBotHand] = useState<Card[]>([])
  const [trumpCard, setTrumpCard] = useState<Card | null>(null)
  const [isPlayerAttacking, setIsPlayerAttacking] = useState(true)
  const [gameMessage, setGameMessage] = useState("Select a card to attack")
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [durak, setDurak] = useState<string | null>(null)
  const [roundCount, setRoundCount] = useState(0)
  const [playerRole, setPlayerRole] = useState<"attacker" | "defender">("attacker")
  const [botRole, setBotRole] = useState<"attacker" | "defender">("defender")
  const [attackCount, setAttackCount] = useState(0) // Track number of attacks in round
  const [defenderPassed, setDefenderPassed] = useState(false) // Track if bot passed on attacking

  useEffect(() => {
    const suits = [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades]
    const newDeck: Card[] = []

    for (const suit of suits) {
      for (const rank of VALID_RANKS) {
        newDeck.push({ suit, rank })
      }
    }

    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]]
    }

    const trump = newDeck[newDeck.length - 1]
    setTrumpCard(trump)

    const playerCards = newDeck.splice(0, 6)
    const botCards = newDeck.splice(0, 6)

    setHand(playerCards)
    setBotHand(botCards)
    setDeck(newDeck)

    const playerLowestTrump = playerCards
      .filter((c) => c.suit === trump.suit)
      .sort((a, b) => VALID_RANKS.indexOf(a.rank) - VALID_RANKS.indexOf(b.rank))[0]
    const botLowestTrump = botCards
      .filter((c) => c.suit === trump.suit)
      .sort((a, b) => VALID_RANKS.indexOf(a.rank) - VALID_RANKS.indexOf(b.rank))[0]

    const playerAttacksFirst =
      !playerLowestTrump || !botLowestTrump
        ? !botLowestTrump
        : VALID_RANKS.indexOf(playerLowestTrump.rank) <= VALID_RANKS.indexOf(botLowestTrump.rank)

    setPlayerRole(playerAttacksFirst ? "attacker" : "defender")
    setBotRole(playerAttacksFirst ? "defender" : "attacker")
    setIsPlayerAttacking(playerAttacksFirst)
    setGameMessage(playerAttacksFirst ? "You attack first. Play a card." : "Bot attacks. Prepare to defend.")
  }, [])

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

  const canBeat = (attackCard: Card, defendCard: Card): boolean => {
    if (defendCard.suit === trumpCard?.suit && attackCard.suit !== trumpCard.suit) return true
    if (defendCard.suit !== attackCard.suit) return false
    return rankValue[defendCard.rank] > rankValue[attackCard.rank]
  }

  const handlePlayCard = (cardIndex: number) => {
    if (!isPlayerAttacking || !gameActive) {
      setGameMessage("You must defend, not attack")
      return
    }

    const card = hand[cardIndex]
    const newTableCards = [...tableCards]

    const maxAttacks = botHand.length
    if (newTableCards.length >= maxAttacks) {
      setGameMessage(`Maximum attacks reached (${maxAttacks})`)
      return
    }

    if (newTableCards.length > 0) {
      const validRanks = new Set<string>()
      newTableCards.forEach((pair) => {
        validRanks.add(pair.attack.rank)
        if (pair.defend) validRanks.add(pair.defend.rank)
      })

      if (!validRanks.has(card.rank)) {
        setGameMessage("Card must match a rank already on table")
        return
      }
    }

    newTableCards.push({ attack: card })
    setTableCards(newTableCards)
    setHand(hand.filter((_, idx) => idx !== cardIndex))
    setSelectedCardIndex(null)
    setAttackCount(newTableCards.length) // Update attack count

    setIsPlayerAttacking(false)
    setGameMessage("Bot is defending...")

    setTimeout(() => simulateBotDefense(newTableCards), 1000)
  }

  const simulateBotDefense = (currentTable: Array<{ attack: Card; defend?: Card }>) => {
    const undefendedCards = currentTable.filter((pair) => !pair.defend)

    if (undefendedCards.length === 0) {
      setGameMessage("All defended! Play more or pass.")
      setIsPlayerAttacking(true)
      return
    }

    const botDefenseCard = getBotDefenseMove(botHand, undefendedCards[0].attack, botDifficulty, trumpCard!)

    if (!botDefenseCard) {
      setGameMessage("Bot failed to defend!")
      handleBotFailed(currentTable)
      return
    }

    const undefendedIdx = undefendedCards[0]
    const tableIdx = currentTable.findIndex((pair) => pair === undefendedIdx)
    currentTable[tableIdx].defend = botDefenseCard

    const newBotHand = botHand.filter((c) => c !== botDefenseCard)
    setBotHand(newBotHand)
    setTableCards([...currentTable])

    setTimeout(() => simulateBotAttack(currentTable, newBotHand), 1000)
  }

  const simulateBotAttack = (currentTable: Array<{ attack: Card; defend?: Card }>, botCards: Card[]) => {
    const maxAttacks = hand.length
    if (currentTable.length >= maxAttacks) {
      setGameMessage("Maximum attacks reached. Pass or defend.")
      setIsPlayerAttacking(true)
      return
    }

    // Get valid ranks on table
    const validRanks = new Set<string>()
    currentTable.forEach((pair) => {
      validRanks.add(pair.attack.rank)
      if (pair.defend) validRanks.add(pair.defend.rank)
    })

    // Find bot cards matching valid ranks
    const matchingCards = botCards.filter((card) => validRanks.has(card.rank))

    if (matchingCards.length === 0) {
      setGameMessage("Bot passes. Your turn to continue or end.")
      setIsPlayerAttacking(true)
      setDefenderPassed(true)
      return
    }

    // Bot plays a matching card (prefer smart selection by difficulty)
    const botAttackCard = matchingCards[Math.floor(Math.random() * matchingCards.length)]
    const newTable = [...currentTable, { attack: botAttackCard }]
    const newBotHand = botCards.filter((c) => c !== botAttackCard)

    setTableCards(newTable)
    setBotHand(newBotHand)
    setAttackCount(newTable.length) // Update attack count
    setGameMessage("Bot attacked! Defend the new card.")
    setIsPlayerAttacking(true)
  }

  const handleBotFailed = (currentTable: Array<{ attack: Card; defend?: Card }>) => {
    const allCards = currentTable.flatMap((pair) => [pair.attack, ...(pair.defend ? [pair.defend] : [])])
    const newBotHand = [...botHand, ...allCards]

    setBotHand(newBotHand)
    setTableCards([])
    setGameActive(false)
    setAttackCount(0) // Reset attack count
    setDefenderPassed(false)

    if (deck.length === 0 && hand.length > 0) {
      setTimeout(() => {
        setGameOver(true)
        setDurak("player")
      }, 1500)
    } else {
      setTimeout(() => nextRound("player"), 1500)
    }
  }

  const nextRound = (winner: "player" | "bot") => {
    setRoundCount(roundCount + 1)
    setTableCards([])
    setSelectedCardIndex(null)
    setGameActive(true)

    const newDeck = [...deck]

    // Also swap roles: if defender won, they attack next round; if they lost, they sit out
    let newPlayerRole: "attacker" | "defender" = playerRole
    let newBotRole: "attacker" | "defender" = botRole

    // If defender succeeded, they become attacker next round
    if (winner === "player" && playerRole === "defender") {
      newPlayerRole = "attacker"
      newBotRole = "defender"
    } else if (winner === "bot" && botRole === "defender") {
      newBotRole = "attacker"
      newPlayerRole = "defender"
    }

    // Draw order: ATTACKERS FIRST
    if (newPlayerRole === "attacker" && hand.length < 6) {
      const drawCount = Math.min(6 - hand.length, newDeck.length)
      const newCards = newDeck.splice(0, drawCount)
      setHand([...hand, ...newCards])
    } else if (newBotRole === "attacker" && botHand.length < 6) {
      const drawCount = Math.min(6 - botHand.length, newDeck.length)
      const newCards = newDeck.splice(0, drawCount)
      setBotHand([...botHand, ...newCards])
    }

    // Draw order: DEFENDER LAST
    if (newPlayerRole === "defender" && hand.length < 6) {
      const drawCount = Math.min(6 - hand.length, newDeck.length)
      const newCards = newDeck.splice(0, drawCount)
      setHand([...hand, ...newCards])
    } else if (newBotRole === "defender" && botHand.length < 6) {
      const drawCount = Math.min(6 - botHand.length, newDeck.length)
      const newCards = newDeck.splice(0, drawCount)
      setBotHand([...botHand, ...newCards])
    }

    setDeck(newDeck)
    setPlayerRole(newPlayerRole)
    setBotRole(newBotRole)

    // Check win condition - first with 0 cards when deck empty wins
    if (newDeck.length === 0) {
      if (hand.length === 0) {
        setGameOver(true)
        setDurak("bot")
        return
      }
      if (botHand.length === 0) {
        setGameOver(true)
        setDurak("player")
        return
      }
    }

    const playerAttacksNext = newPlayerRole === "attacker"
    setIsPlayerAttacking(playerAttacksNext)
    setGameMessage(playerAttacksNext ? "You attack next. Play a card." : "Bot attacks. Prepare to defend.")
    setAttackCount(0) // Reset attack count for new round
    setDefenderPassed(false)
  }

  const handlePassAttack = () => {
    if (isPlayerAttacking) {
      setGameMessage("You passed. Defender wins!")
      setGameActive(false)
      setTimeout(() => nextRound("bot"), 1500)
    }
  }

  const handleTakeCards = () => {
    const allCards = tableCards.flatMap((pair) => [pair.attack, ...(pair.defend ? [pair.defend] : [])])
    const newHand = [...hand, ...allCards]
    setHand(newHand)
    setGameMessage("You took cards. Next round...")
    setGameActive(false)
    setTableCards([])

    const newDeck = [...deck]

    if (newDeck.length === 0) {
      if (newHand.length === 0) {
        setGameOver(true)
        setDurak("bot")
        return
      }
      if (botHand.length === 0) {
        setGameOver(true)
        setDurak("player")
        return
      }
    }

    setTimeout(() => nextRound("bot"), 1500)
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onExitGame}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Exit</span>
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-black text-primary">DURAK</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {gameMode === "bot" ? `vs Bot (${botDifficulty})` : "Multiplayer"}
          </p>
        </div>
        <div className="w-20"></div>
      </div>

      <div className="mb-6 p-4 bg-card border border-border rounded-lg text-center">
        <p className="text-muted-foreground">{gameMessage}</p>
        {roundCount > 0 && <p className="text-xs text-muted-foreground mt-1">Round {roundCount}</p>}
      </div>

      <div className="mb-8 p-4 rounded-xl border-2 border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-foreground">Bot Opponent</p>
            <p className="text-xs text-muted-foreground mt-1">{botRole === "attacker" ? "Attacking" : "Defending"}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Cards:</p>
            <p className="text-xl font-bold text-primary">{botHand.length}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 flex justify-between items-center">
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-2">Deck</div>
          <div className="w-16 h-24 bg-gradient-to-br from-secondary to-card border-2 border-border rounded-lg flex items-center justify-center">
            <span className="text-foreground font-bold">{deck.length}</span>
          </div>
        </div>

        {trumpCard && (
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">Trump</div>
            <div className="w-16 h-24 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center border-2 border-primary shadow-lg shadow-primary/50 transform rotate-12">
              <div className="flex flex-col items-center text-primary-foreground font-bold">
                <span>{trumpCard.rank}</span>
                <span className="text-lg">
                  {trumpCard.suit === "hearts"
                    ? "♥"
                    : trumpCard.suit === "diamonds"
                      ? "♦"
                      : trumpCard.suit === "clubs"
                        ? "♣"
                        : "♠"}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-2">Your Cards</div>
          <div className="w-16 h-24 bg-gradient-to-br from-secondary to-card border-2 border-border rounded-lg flex items-center justify-center">
            <span className="text-foreground font-bold">{hand.length}</span>
          </div>
        </div>
      </div>

      <div className="bg-card border-2 border-border rounded-2xl p-6 mb-8 min-h-[300px] flex flex-col items-center justify-center">
        {tableCards.length === 0 ? (
          <p className="text-muted-foreground">
            No cards on table. {isPlayerAttacking ? "Play a card to attack." : "Wait for attack..."}
          </p>
        ) : (
          <div className="space-y-4 w-full">
            {tableCards.map((pair, idx) => (
              <div key={idx} className="flex items-center justify-center gap-4">
                <div className="w-16 h-24 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                  {pair.attack.rank}
                </div>
                {pair.defend && (
                  <div className="w-16 h-24 bg-gradient-to-br from-secondary to-card rounded-lg flex items-center justify-center text-foreground font-bold shadow-lg border-2 border-primary transform -translate-x-2 translate-y-2">
                    {pair.defend.rank}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <PlayerHand
        cards={hand}
        selectedCardIndex={selectedCardIndex}
        onSelectCard={(idx) => setSelectedCardIndex(idx)}
        onPlayCard={handlePlayCard}
      />

      {!gameOver && gameActive && (
        <div className="flex gap-3 justify-center mt-6">
          {isPlayerAttacking ? (
            <button
              onClick={handlePassAttack}
              className="px-6 py-3 bg-card hover:bg-secondary border border-border text-foreground font-bold rounded-lg transition-all"
            >
              Pass Attack
            </button>
          ) : (
            <>
              <button
                onClick={handleTakeCards}
                className="px-6 py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-lg transition-all"
              >
                Take Cards
              </button>
              <button
                onClick={handlePassAttack}
                className="px-6 py-3 bg-primary hover:bg-accent text-primary-foreground font-bold rounded-lg transition-all"
              >
                Defend
              </button>
            </>
          )}
        </div>
      )}

      {gameOver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-card border-2 border-primary rounded-2xl p-8 text-center max-w-md">
            <h2 className="text-3xl font-black text-primary mb-4">GAME OVER</h2>
            <p className="text-xl font-bold text-foreground mb-2">
              {durak === "player" ? "You are the DURAK!" : "Bot is the DURAK!"}
            </p>
            <p className="text-sm text-muted-foreground mb-6">The loser holds cards when the deck runs empty.</p>
            <button
              onClick={onExitGame}
              className="w-full px-6 py-3 bg-primary hover:bg-accent text-primary-foreground font-bold rounded-lg transition-all"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
