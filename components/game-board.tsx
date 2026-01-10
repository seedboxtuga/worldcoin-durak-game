"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft } from "lucide-react"
import { type Card, Suit, VALID_RANKS, rankValue } from "@/components/card-game"
import { PlayerHand } from "@/components/player-hand"
import { getBotDefenseMove, generateBotMove } from "@/lib/bot-ai"

interface GameBoardProps {
  userInfo: any
  gameMode: "bot" | "multiplayer"
  botDifficulty?: "easy" | "medium" | "hard"
  onExitGame: () => void
}

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
  const [botThinking, setBotThinking] = useState(false)
  const [playerSafe, setPlayerSafe] = useState(false)
  const [botSafe, setBotSafe] = useState(false)

  const handRef = useRef<Card[]>([])
  const botHandRef = useRef<Card[]>([])
  const deckRef = useRef<Card[]>([])

  useEffect(() => {
    handRef.current = hand
  }, [hand])

  useEffect(() => {
    botHandRef.current = botHand
  }, [botHand])

  useEffect(() => {
    deckRef.current = deck
  }, [deck])

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

  const canBeat = (attackCard: Card, defendCard: Card): boolean => {
    if (defendCard.suit === trumpCard?.suit && attackCard.suit !== trumpCard.suit) return true
    if (defendCard.suit !== attackCard.suit) return false
    return rankValue[defendCard.rank] > rankValue[attackCard.rank]
  }

  const handlePlayCard = (cardIndex: number) => {
    console.log("[v0] handlePlayCard called", { cardIndex, gameActive, playerRole, handLength: hand.length })

    if (!gameActive) {
      console.log("[v0] Game not active, blocking play")
      setGameMessage("Wait for the round to start!")
      return
    }

    const card = hand[cardIndex]
    const newTableCards = [...tableCards]

    if (playerRole === "defender") {
      console.log("[v0] Player is defender, attempting to defend")
      const undefendedPair = newTableCards.find((pair) => !pair.defend)

      console.log("[v0] Undefended pair:", undefendedPair)

      if (!undefendedPair) {
        setGameMessage("All attacks are defended!")
        return
      }

      const canDefend = canBeat(undefendedPair.attack, card)
      console.log("[v0] Can defend?", {
        attack: undefendedPair.attack,
        defend: card,
        canDefend,
        trumpCard,
      })

      if (!canDefend) {
        setGameMessage("This card cannot beat the attack!")
        return
      }

      undefendedPair.defend = card
      setTableCards([...newTableCards])
      setHand(hand.filter((_, idx) => idx !== cardIndex))
      setSelectedCardIndex(null)

      const allDefended = newTableCards.every((pair) => pair.defend)
      if (allDefended) {
        setGameMessage("All defended! Bot can throw in more or pass.")
        setBotThinking(true)
        setTimeout(() => {
          setBotThinking(false)
          botThrowInOrPass(newTableCards)
        }, 1500)
      } else {
        setGameMessage("Defend remaining attacks!")
      }
      return
    }

    if (playerRole !== "attacker") {
      console.log("[v0] Player is not attacker, blocking play")
      setGameMessage("You must defend, not attack!")
      return
    }

    console.log("[v0] Player is attacker, attempting to attack")

    const undefendedCards = newTableCards.filter((pair) => !pair.defend).length
    if (undefendedCards >= botHand.length) {
      setGameMessage(`Maximum attacks reached (defender has ${botHand.length} cards)`)
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

    setGameMessage("Bot is defending...")
    setBotThinking(true)

    setTimeout(() => {
      setBotThinking(false)
      simulateBotDefense(newTableCards)
    }, 1000)
  }

  const botThrowInOrPass = (currentTable: Array<{ attack: Card; defend?: Card }>) => {
    const undefendedCards = currentTable.filter((pair) => !pair.defend).length
    if (undefendedCards >= handRef.current.length) {
      setGameMessage("Round complete! You defended successfully.")
      setGameActive(false)
      setTimeout(() => endRound("defender-wins", handRef.current, botHandRef.current, deckRef.current), 1500)
      return
    }

    const validRanks = new Set<string>()
    currentTable.forEach((pair) => {
      validRanks.add(pair.attack.rank)
      if (pair.defend) validRanks.add(pair.defend.rank)
    })

    const matchingCards = botHandRef.current.filter((c) => validRanks.has(c.rank))

    if (matchingCards.length === 0 || Math.random() > 0.7) {
      setGameMessage("Bot passes. Round complete!")
      setGameActive(false)
      setTimeout(() => endRound("defender-wins", handRef.current, botHandRef.current, deckRef.current), 1500)
      return
    }

    const throwInCard = matchingCards[Math.floor(Math.random() * matchingCards.length)]
    const newTable = [...currentTable, { attack: throwInCard }]
    const newBotHand = botHandRef.current.filter((c) => c !== throwInCard)

    setTableCards(newTable)
    setBotHand(newBotHand)
    setGameMessage("Bot threw in another card! Defend it.")
  }

  const simulateBotDefense = (currentTable: Array<{ attack: Card; defend?: Card }>) => {
    const undefendedCards = currentTable.filter((pair) => !pair.defend)

    if (undefendedCards.length === 0) {
      setGameMessage("All defended! Throw in more or pass.")
      return
    }

    const botDefenseCard = getBotDefenseMove(botHand, undefendedCards[0].attack, botDifficulty, trumpCard!)

    if (!botDefenseCard) {
      setGameMessage("Bot can't defend! Taking all cards.")
      handleBotFailedDefense(currentTable)
      return
    }

    const undefendedIdx = undefendedCards[0]
    const tableIdx = currentTable.findIndex((pair) => pair === undefendedIdx)
    currentTable[tableIdx].defend = botDefenseCard

    const newBotHand = botHand.filter((c) => c !== botDefenseCard)
    setBotHand(newBotHand)
    setTableCards([...currentTable])

    const allDefended = currentTable.every((pair) => pair.defend)
    if (allDefended) {
      setGameMessage("Bot defended all! Throw in more or pass.")
    } else {
      setBotThinking(true)
      setTimeout(() => {
        setBotThinking(false)
        simulateBotDefense([...currentTable])
      }, 1000)
    }
  }

  const handleBotFailedDefense = (currentTable: Array<{ attack: Card; defend?: Card }>) => {
    const allCards = currentTable.flatMap((pair) => [pair.attack, ...(pair.defend ? [pair.defend] : [])])
    const newBotHand = [...botHand, ...allCards]

    setBotHand(newBotHand)
    setTableCards([])
    setGameActive(false)

    setTimeout(() => endRound("defender-loses", hand, newBotHand, deck), 1500)
  }

  const handlePassAttack = () => {
    if (playerRole === "attacker" && tableCards.length > 0) {
      setGameMessage("You passed. Defender wins round!")
      setGameActive(false)
      setTimeout(() => endRound("defender-wins", hand, botHand, deck), 1500)
    }
  }

  const handleTakeCards = () => {
    const allCards = tableCards.flatMap((pair) => [pair.attack, ...(pair.defend ? [pair.defend] : [])])
    const newHand = [...hand, ...allCards]
    setHand(newHand)
    setGameMessage("You took cards.")
    setGameActive(false)
    setTableCards([])

    setTimeout(() => endRound("defender-loses", newHand, botHand, deck), 1500)
  }

  const endRound = (
    result: "defender-wins" | "defender-loses",
    currentPlayerHand: Card[],
    currentBotHand: Card[],
    currentDeck: Card[],
  ) => {
    console.log("[v0] endRound called", {
      result,
      playerHandSize: currentPlayerHand.length,
      botHandSize: currentBotHand.length,
    })

    setRoundCount(roundCount + 1)
    setTableCards([])
    setSelectedCardIndex(null)

    const newDeck = [...currentDeck]
    let playerHand = [...currentPlayerHand]
    let botHandCards = [...currentBotHand]

    if (result === "defender-wins") {
      if (playerRole === "attacker" && playerHand.length < 6) {
        const drawCount = Math.min(6 - playerHand.length, newDeck.length)
        const newCards = newDeck.splice(0, drawCount)
        playerHand = [...playerHand, ...newCards]
      } else if (botRole === "attacker" && botHandCards.length < 6) {
        const drawCount = Math.min(6 - botHandCards.length, newDeck.length)
        const newCards = newDeck.splice(0, drawCount)
        botHandCards = [...botHandCards, ...newCards]
      }

      if (playerRole === "defender" && playerHand.length < 6) {
        const drawCount = Math.min(6 - playerHand.length, newDeck.length)
        const newCards = newDeck.splice(0, drawCount)
        playerHand = [...playerHand, ...newCards]
      } else if (botRole === "defender" && botHandCards.length < 6) {
        const drawCount = Math.min(6 - botHandCards.length, newDeck.length)
        const newCards = newDeck.splice(0, drawCount)
        botHandCards = [...botHandCards, ...newCards]
      }

      const newPlayerRole = playerRole === "defender" ? "attacker" : "defender"
      const newBotRole = botRole === "defender" ? "attacker" : "defender"
      setPlayerRole(newPlayerRole)
      setBotRole(newBotRole)
      setIsPlayerAttacking(newPlayerRole === "attacker")
    } else {
      if (playerRole === "attacker" && playerHand.length < 6) {
        const drawCount = Math.min(6 - playerHand.length, newDeck.length)
        const newCards = newDeck.splice(0, drawCount)
        playerHand = [...playerHand, ...newCards]
      } else if (botRole === "attacker" && botHandCards.length < 6) {
        const drawCount = Math.min(6 - botHandCards.length, newDeck.length)
        const newCards = newDeck.splice(0, drawCount)
        botHandCards = [...botHandCards, ...newCards]
      }

      if (playerRole === "defender" && playerHand.length < 6) {
        const drawCount = Math.min(6 - playerHand.length, newDeck.length)
        const newCards = newDeck.splice(0, drawCount)
        playerHand = [...playerHand, ...newCards]
      } else if (botRole === "defender" && botHandCards.length < 6) {
        const drawCount = Math.min(6 - botHandCards.length, newDeck.length)
        const newCards = newDeck.splice(0, drawCount)
        botHandCards = [...botHandCards, ...newCards]
      }
    }

    setGameActive(true)
    console.log("[v0] Game set to active")

    if (newDeck.length === 0) {
      if (playerHand.length === 0 && !playerSafe) {
        setPlayerSafe(true)

        if (botHandCards.length > 0) {
          setGameMessage("You escaped! Bot continues playing...")
        } else {
          setGameMessage("Draw! Both players escaped!")
          setGameOver(true)
          setGameActive(false)
          return
        }
      }
      if (botHandCards.length === 0 && !botSafe) {
        setBotSafe(true)

        if (playerHand.length > 0) {
          setGameMessage("Bot escaped! You are the Durak!")
          setGameOver(true)
          setDurak("player")
          setGameActive(false)
          return
        } else {
          setGameMessage("Draw! Both players escaped!")
          setGameOver(true)
          setGameActive(false)
          return
        }
      }

      if (playerSafe && playerHand.length === 0 && botHandCards.length > 0) {
        setGameMessage("Bot is the Durak!")
        setGameOver(true)
        setDurak("bot")
        setGameActive(false)
        return
      }
      if (botSafe && botHandCards.length === 0 && playerHand.length > 0) {
        setGameMessage("You are the Durak!")
        setGameOver(true)
        setDurak("player")
        setGameActive(false)
        return
      }
    }

    if (playerRole === "attacker" && result === "defender-wins") {
      setGameMessage("You defended! Now you attack.")
    } else if (botRole === "attacker" && result === "defender-wins") {
      setGameMessage("Bot defended! Now bot attacks.")
      setTimeout(() => startBotAttack(botHandCards), 1500)
    } else if (playerRole === "defender" && result === "defender-loses") {
      setGameMessage("Bot attacks again!")
      setTimeout(() => startBotAttack(botHandCards), 1500)
    } else if (botRole === "defender" && result === "defender-loses") {
      setGameMessage("You attack again!")
    } else {
      if (playerRole === "attacker") {
        setGameMessage("You attack!")
      } else {
        setGameMessage("Bot attacks!")
        setTimeout(() => startBotAttack(botHandCards), 1500)
      }
    }
  }

  const startBotAttack = (botCards: Card[]) => {
    setBotThinking(true)
    setTimeout(() => {
      setBotThinking(false)
      const botCard = generateBotMove(botCards, [], botDifficulty)
      if (botCard) {
        const newTable = [{ attack: botCard }]
        const newBotCards = botCards.filter((c) => c !== botCard)
        setTableCards(newTable)
        setBotHand(newBotCards)
        setGameMessage("Bot attacked! Defend or take cards.")
      }
    }, 1000)
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
        {botThinking && (
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        )}
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
                <div className="w-20 h-28 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                  <div className="flex flex-col items-center">
                    <span className="text-xl">{pair.attack.rank}</span>
                    <span className="text-2xl mt-1">
                      {pair.attack.suit === "hearts"
                        ? "♥"
                        : pair.attack.suit === "diamonds"
                          ? "♦"
                          : pair.attack.suit === "clubs"
                            ? "♣"
                            : "♠"}
                    </span>
                  </div>
                </div>
                {pair.defend && (
                  <div className="w-20 h-28 bg-gradient-to-br from-secondary to-card rounded-lg flex items-center justify-center text-foreground font-bold shadow-lg border-2 border-primary transform -translate-x-2 translate-y-2">
                    <div className="flex flex-col items-center">
                      <span className="text-xl">{pair.defend.rank}</span>
                      <span className="text-2xl mt-1">
                        {pair.defend.suit === "hearts"
                          ? "♥"
                          : pair.defend.suit === "diamonds"
                            ? "♦"
                            : pair.defend.suit === "clubs"
                              ? "♣"
                              : "♠"}
                      </span>
                    </div>
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
          {playerRole === "attacker" ? (
            <button
              onClick={handlePassAttack}
              className="px-6 py-3 bg-card hover:bg-secondary border border-border text-foreground font-bold rounded-lg transition-all"
            >
              Pass Attack
            </button>
          ) : (
            <button
              onClick={handleTakeCards}
              className="px-6 py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-lg transition-all"
            >
              Take Cards
            </button>
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
