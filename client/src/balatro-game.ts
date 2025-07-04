interface PlayingCard {
  id: string
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'
  rank: string
  value: number
  chipValue: number
  multiplier: number
  selected: boolean
  enhanced?: boolean
}

interface PokerHand {
  name: string
  chipValue: number
  multiplier: number
  level: number
}

interface BalatroState {
  deck: PlayingCard[]
  hand: PlayingCard[]
  selectedCards: PlayingCard[]
  currentRound: number
  handsLeft: number
  discardsLeft: number
  score: number
  targetScore: number
  spades: number
  pokerHands: Map<string, PokerHand>
}

export class BalatroGame {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private scoreDisplay: HTMLElement
  private rewardDisplay: HTMLElement
  private startButton: HTMLElement
  private restartButton: HTMLElement
  private gameInstance: any
  private gameOverPopup: HTMLElement | null = null
  private pendingReward: number = 0
  
  private gameState: BalatroState
  private isGameRunning: boolean = false
  
  private readonly CARD_WIDTH = 60
  private readonly CARD_HEIGHT = 84
  private readonly CANVAS_WIDTH = 800
  private readonly CANVAS_HEIGHT = 600

  // Poker hand rankings
  private readonly POKER_HANDS = {
    'High Card': { chipValue: 5, multiplier: 1, level: 1 },
    'Pair': { chipValue: 10, multiplier: 2, level: 1 },
    'Two Pair': { chipValue: 20, multiplier: 2, level: 1 },
    'Three of a Kind': { chipValue: 30, multiplier: 3, level: 1 },
    'Straight': { chipValue: 30, multiplier: 4, level: 1 },
    'Flush': { chipValue: 35, multiplier: 4, level: 1 },
    'Full House': { chipValue: 40, multiplier: 4, level: 1 },
    'Four of a Kind': { chipValue: 60, multiplier: 7, level: 1 },
    'Straight Flush': { chipValue: 100, multiplier: 8, level: 1 },
    'Royal Flush': { chipValue: 100, multiplier: 8, level: 1 }
  }

  constructor(canvas: HTMLCanvasElement, scoreDisplay: HTMLElement, rewardDisplay: HTMLElement, startButton: HTMLElement, restartButton: HTMLElement, gameInstance: any) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.scoreDisplay = scoreDisplay
    this.rewardDisplay = rewardDisplay
    this.startButton = startButton
    this.restartButton = restartButton
    this.gameInstance = gameInstance
    
    this.canvas.width = this.CANVAS_WIDTH
    this.canvas.height = this.CANVAS_HEIGHT
    
    this.gameState = this.initializeGameState()
    this.setupControls()
    this.resetGame()
  }

  private initializeGameState(): BalatroState {
    return {
      deck: [],
      hand: [],
      selectedCards: [],
      currentRound: 1,
      handsLeft: 4,
      discardsLeft: 3,
      score: 0,
      targetScore: 300,
      spades: 0,
      pokerHands: new Map(Object.entries(this.POKER_HANDS).map(([name, hand]) => [name, { name, ...hand }]))
    }
  }

  private setupControls(): void {
    this.canvas.addEventListener('click', (e) => {
      if (!this.isGameRunning) return
      
      const rect = this.canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      this.handleCardClick(x, y)
    })

    // Add keyboard controls
    document.addEventListener('keydown', (e) => {
      if (!this.isGameRunning) return
      
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'enter':
          this.playHand()
          break
        case 'd':
          this.discardSelected()
          break
        case 'c':
          this.clearSelection()
          break
      }
    })
  }

  private createDeck(): PlayingCard[] {
    const suits: PlayingCard['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades']
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    const deck: PlayingCard[] = []
    
    let cardId = 0
    for (const suit of suits) {
      for (let i = 0; i < ranks.length; i++) {
        const rank = ranks[i]
        const value = rank === 'A' ? 1 : (rank === 'J' || rank === 'Q' || rank === 'K') ? 10 + i - 9 : parseInt(rank) || 10
        
        deck.push({
          id: `card-${cardId++}`,
          suit,
          rank,
          value,
          chipValue: Math.max(1, Math.floor(value / 2)),
          multiplier: 1,
          selected: false,
          enhanced: false
        })
      }
    }
    
    return this.shuffleDeck(deck)
  }

  private shuffleDeck(deck: PlayingCard[]): PlayingCard[] {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  private resetGame(): void {
    this.gameState.deck = this.createDeck()
    this.gameState.hand = []
    this.gameState.selectedCards = []
    this.gameState.currentRound = 1
    this.gameState.handsLeft = 4
    this.gameState.discardsLeft = 3
    this.gameState.score = 0
    this.gameState.targetScore = 300
    this.gameState.spades = 0
    
    this.drawHand()
    this.updateDisplay()
    this.draw()
  }

  private drawHand(): void {
    // Draw 8 cards to hand
    while (this.gameState.hand.length < 8 && this.gameState.deck.length > 0) {
      const card = this.gameState.deck.pop()
      if (card) {
        card.selected = false
        this.gameState.hand.push(card)
      }
    }
  }

  private handleCardClick(x: number, y: number): void {
    const handStartX = 50
    const handY = 500
    const cardSpacing = 90
    
    for (let i = 0; i < this.gameState.hand.length; i++) {
      const cardX = handStartX + i * cardSpacing
      
      if (x >= cardX && x <= cardX + this.CARD_WIDTH && 
          y >= handY && y <= handY + this.CARD_HEIGHT) {
        this.toggleCardSelection(this.gameState.hand[i])
        this.draw()
        break
      }
    }
  }

  private toggleCardSelection(card: PlayingCard): void {
    if (card.selected) {
      card.selected = false
      this.gameState.selectedCards = this.gameState.selectedCards.filter(c => c.id !== card.id)
    } else if (this.gameState.selectedCards.length < 5) {
      card.selected = true
      this.gameState.selectedCards.push(card)
    }
  }

  private clearSelection(): void {
    this.gameState.selectedCards.forEach(card => card.selected = false)
    this.gameState.selectedCards = []
    this.draw()
  }

  private playHand(): void {
    if (this.gameState.selectedCards.length === 0 || this.gameState.handsLeft <= 0) return
    
    const handResult = this.evaluateHand(this.gameState.selectedCards)
    const score = this.calculateScore(handResult, this.gameState.selectedCards)
    
    this.gameState.score += score
    this.gameState.handsLeft--
    
    // Remove played cards from hand
    this.gameState.selectedCards.forEach(selectedCard => {
      this.gameState.hand = this.gameState.hand.filter(card => card.id !== selectedCard.id)
    })
    
    this.gameState.selectedCards = []
    this.drawHand()
    
    // Check if round is complete
    if (this.gameState.score >= this.gameState.targetScore) {
      this.completeRound()
    } else if (this.gameState.handsLeft <= 0) {
      this.gameOver()
    }
    
    this.updateDisplay()
    this.draw()
  }

  private discardSelected(): void {
    if (this.gameState.selectedCards.length === 0 || this.gameState.discardsLeft <= 0) return
    
    // Remove discarded cards from hand
    this.gameState.selectedCards.forEach(selectedCard => {
      this.gameState.hand = this.gameState.hand.filter(card => card.id !== selectedCard.id)
    })
    
    this.gameState.selectedCards = []
    this.gameState.discardsLeft--
    this.drawHand()
    
    this.updateDisplay()
    this.draw()
  }

  private evaluateHand(cards: PlayingCard[]): { name: string, chips: number, multiplier: number } {
    if (cards.length === 0) return { name: 'High Card', chips: 5, multiplier: 1 }
    
    const ranks = cards.map(c => c.rank)
    const suits = cards.map(c => c.suit)
    
    // Count ranks
    const rankCounts = new Map<string, number>()
    ranks.forEach(rank => {
      rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1)
    })
    
    const counts = Array.from(rankCounts.values()).sort((a, b) => b - a)
    const uniqueSuits = new Set(suits)
    
    // Convert ranks to numbers for straight checking
    const numericRanks = ranks.map(rank => {
      if (rank === 'A') return 1
      if (rank === 'J') return 11
      if (rank === 'Q') return 12
      if (rank === 'K') return 13
      return parseInt(rank)
    }).sort((a, b) => a - b)
    
    const isFlush = uniqueSuits.size === 1 && cards.length === 5
    const isStraight = cards.length === 5 && this.checkStraight(numericRanks)
    
    // Determine hand type
    let handName = 'High Card'
    
    if (isStraight && isFlush) {
      handName = numericRanks[0] === 1 && numericRanks[4] === 13 ? 'Royal Flush' : 'Straight Flush'
    } else if (counts[0] === 4) {
      handName = 'Four of a Kind'
    } else if (counts[0] === 3 && counts[1] === 2) {
      handName = 'Full House'
    } else if (isFlush) {
      handName = 'Flush'
    } else if (isStraight) {
      handName = 'Straight'
    } else if (counts[0] === 3) {
      handName = 'Three of a Kind'
    } else if (counts[0] === 2 && counts[1] === 2) {
      handName = 'Two Pair'
    } else if (counts[0] === 2) {
      handName = 'Pair'
    }
    
    const handData = this.gameState.pokerHands.get(handName)!
    return {
      name: handName,
      chips: handData.chipValue,
      multiplier: handData.multiplier
    }
  }

  private checkStraight(ranks: number[]): boolean {
    // Check for regular straight
    for (let i = 1; i < ranks.length; i++) {
      if (ranks[i] !== ranks[i-1] + 1) {
        // Check for A-10-J-Q-K straight
        if (ranks[0] === 1 && ranks[1] === 10 && ranks[2] === 11 && ranks[3] === 12 && ranks[4] === 13) {
          return true
        }
        return false
      }
    }
    return true
  }

  private calculateScore(handResult: { name: string, chips: number, multiplier: number }, cards: PlayingCard[]): number {
    const cardChips = cards.reduce((sum, card) => sum + card.chipValue, 0)
    const cardMultiplier = cards.reduce((sum, card) => sum + card.multiplier, 0)
    
    const totalChips = handResult.chips + cardChips
    const totalMultiplier = handResult.multiplier + cardMultiplier
    
    return totalChips * totalMultiplier
  }

  private completeRound(): void {
    this.gameState.spades += 10 // Award 10 spades per completed round
    this.gameState.currentRound++
    this.gameState.handsLeft = 4
    this.gameState.discardsLeft = 3
    this.gameState.targetScore = Math.floor(this.gameState.targetScore * 1.5) // Increase difficulty
    
    // Level up a random poker hand
    const handNames = Array.from(this.gameState.pokerHands.keys())
    const randomHand = handNames[Math.floor(Math.random() * handNames.length)]
    const hand = this.gameState.pokerHands.get(randomHand)!
    hand.level++
    hand.chipValue = Math.floor(hand.chipValue * 1.2)
    hand.multiplier++
    
    console.log(`Round ${this.gameState.currentRound - 1} completed! Earned 10 spades. ${randomHand} leveled up!`)
  }

  private gameOver(): void {
    this.isGameRunning = false
    const finalSpades = this.gameState.spades
    this.pendingReward = finalSpades

    this.startButton.style.display = 'none'
    this.restartButton.style.display = 'block'

    // Draw game over overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)

    this.createGameOverPopup(this.gameState.currentRound - 1, finalSpades)
  }

  private createGameOverPopup(roundsCompleted: number, totalSpades: number): void {
    if (this.gameOverPopup) {
      this.gameOverPopup.remove()
    }

    this.gameOverPopup = document.createElement('div')
    this.gameOverPopup.className = 'game-over-popup'
    this.gameOverPopup.style.position = 'fixed'
    this.gameOverPopup.style.top = '50%'
    this.gameOverPopup.style.left = '50%'
    this.gameOverPopup.style.transform = 'translate(-50%, -50%)'
    this.gameOverPopup.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'
    this.gameOverPopup.style.padding = '30px'
    this.gameOverPopup.style.borderRadius = '15px'
    this.gameOverPopup.style.border = '2px solid #000000'
    this.gameOverPopup.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.8)'
    this.gameOverPopup.style.zIndex = '10000'
    this.gameOverPopup.style.textAlign = 'center'
    this.gameOverPopup.style.color = '#ffffff'
    this.gameOverPopup.style.minWidth = '300px'

    const gameOverText = document.createElement('h2')
    gameOverText.textContent = 'GAME OVER'
    gameOverText.style.color = '#ff4444'
    gameOverText.style.marginBottom = '20px'
    gameOverText.style.fontSize = '24px'

    const scoreText = document.createElement('p')
    scoreText.textContent = `Rounds Completed: ${roundsCompleted} | Final Score: ${this.gameState.score}`
    scoreText.style.marginBottom = '15px'
    scoreText.style.fontSize = '16px'

    const rewardText = document.createElement('div')
    rewardText.style.display = 'flex'
    rewardText.style.alignItems = 'center'
    rewardText.style.justifyContent = 'center'
    rewardText.style.marginBottom = '25px'
    rewardText.style.fontSize = '18px'

    const rewardLabel = document.createElement('span')
    rewardLabel.textContent = 'Earned: '
    rewardLabel.style.marginRight = '5px'

    const spadesIcon = document.createElement('span')
    spadesIcon.textContent = '♠️'
    spadesIcon.style.marginRight = '5px'

    const rewardAmount = document.createElement('span')
    rewardAmount.textContent = totalSpades.toString()

    rewardText.appendChild(rewardLabel)
    rewardText.appendChild(spadesIcon)
    rewardText.appendChild(rewardAmount)

    const tryAgainButton = document.createElement('button')
    tryAgainButton.textContent = 'TRY AGAIN'
    tryAgainButton.style.backgroundColor = '#4444ff'
    tryAgainButton.style.color = 'white'
    tryAgainButton.style.border = 'none'
    tryAgainButton.style.padding = '12px 24px'
    tryAgainButton.style.borderRadius = '8px'
    tryAgainButton.style.fontSize = '16px'
    tryAgainButton.style.cursor = 'pointer'
    tryAgainButton.style.transition = 'all 0.3s ease'
    tryAgainButton.style.marginTop = '10px'

    tryAgainButton.addEventListener('click', () => {
      if (this.pendingReward > 0) {
        this.gameInstance.addSpades(this.pendingReward)
        this.pendingReward = 0
        
        this.gameInstance.refreshAllCurrencyDisplays()
        this.gameInstance.ensureCurrencyElementsVisible()
      }
      this.gameOverPopup?.remove()
      this.gameOverPopup = null
      this.resetGame()
      
      this.startButton.style.display = 'block'
      this.restartButton.style.display = 'none'
    })

    this.gameOverPopup.appendChild(gameOverText)
    this.gameOverPopup.appendChild(scoreText)
    this.gameOverPopup.appendChild(rewardText)
    this.gameOverPopup.appendChild(tryAgainButton)

    document.body.appendChild(this.gameOverPopup)
  }

  private updateDisplay(): void {
    this.scoreDisplay.textContent = `Score: ${this.gameState.score}/${this.gameState.targetScore} | Round: ${this.gameState.currentRound} | Hands: ${this.gameState.handsLeft} | Discards: ${this.gameState.discardsLeft}`
    
    const rewardCount = this.rewardDisplay.querySelector('span:last-child')
    if (rewardCount) {
      rewardCount.textContent = this.gameState.spades.toString()
    }
  }

  private draw(): void {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e'
    this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)
    
    // Draw background pattern
    this.ctx.fillStyle = '#0f3460'
    for (let i = 0; i < this.CANVAS_WIDTH; i += 40) {
      for (let j = 0; j < this.CANVAS_HEIGHT; j += 40) {
        if ((i + j) % 80 === 0) {
          this.ctx.fillRect(i, j, 20, 20)
        }
      }
    }
    
    // Draw hand
    this.drawHandCards()
    
    // Draw selected cards info
    if (this.gameState.selectedCards.length > 0) {
      this.drawHandInfo()
    }
    
    // Draw poker hands legend
    this.drawPokerHandsLegend()
  }

  private drawHandCards(): void {
    const handStartX = 50
    const handY = 500
    const cardSpacing = 90
    
    this.gameState.hand.forEach((card, index) => {
      const x = handStartX + index * cardSpacing
      const y = card.selected ? handY - 20 : handY
      
      this.drawCard(card, x, y)
    })
  }

  private drawCard(card: PlayingCard, x: number, y: number): void {
    // Card background
    this.ctx.fillStyle = card.selected ? '#ffff88' : '#ffffff'
    this.ctx.fillRect(x, y, this.CARD_WIDTH, this.CARD_HEIGHT)
    
    // Card border
    this.ctx.strokeStyle = card.selected ? '#ff8800' : '#000000'
    this.ctx.lineWidth = card.selected ? 3 : 1
    this.ctx.strokeRect(x, y, this.CARD_WIDTH, this.CARD_HEIGHT)
    
    // Suit color
    const suitColor = (card.suit === 'hearts' || card.suit === 'diamonds') ? '#cc0000' : '#000000'
    
    // Draw rank
    this.ctx.fillStyle = suitColor
    this.ctx.font = 'bold 14px Arial'
    this.ctx.fillText(card.rank, x + 5, y + 15)
    
    // Draw suit symbol
    const suitSymbol = card.suit === 'hearts' ? '♥' : 
                      card.suit === 'diamonds' ? '♦' : 
                      card.suit === 'clubs' ? '♣' : '♠'
    this.ctx.font = '16px Arial'
    this.ctx.fillText(suitSymbol, x + 5, y + 35)
    
    // Draw chip value
    this.ctx.fillStyle = '#0066cc'
    this.ctx.font = '10px Arial'
    this.ctx.fillText(`${card.chipValue}`, x + 5, y + this.CARD_HEIGHT - 5)
  }

  private drawHandInfo(): void {
    const handResult = this.evaluateHand(this.gameState.selectedCards)
    const score = this.calculateScore(handResult, this.gameState.selectedCards)
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(250, 350, 300, 80)
    
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 16px Arial'
    this.ctx.fillText(`Hand: ${handResult.name}`, 260, 370)
    
    this.ctx.font = '14px Arial'
    this.ctx.fillText(`Chips: ${handResult.chips} | Multiplier: ${handResult.multiplier}`, 260, 390)
    this.ctx.fillText(`Score: ${score}`, 260, 410)
  }

  private drawPokerHandsLegend(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(10, 10, 200, 300)
    
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 14px Arial'
    this.ctx.fillText('Poker Hands:', 20, 30)
    
    let y = 50
    this.ctx.font = '10px Arial'
    Array.from(this.gameState.pokerHands.entries()).forEach(([name, hand]) => {
      this.ctx.fillText(`${name}: ${hand.chipValue}x${hand.multiplier} (Lv.${hand.level})`, 20, y)
      y += 15
    })
  }

  public startGame(): void {
    this.isGameRunning = true
    this.resetGame()
    this.draw()
    
    this.startButton.style.display = 'none'
    this.restartButton.style.display = 'none'
  }

  public restartGame(): void {
    this.isGameRunning = true
    this.resetGame()
    this.draw()
    
    this.startButton.style.display = 'none'
    this.restartButton.style.display = 'none'
  }

  public pauseGame(): void {
    this.isGameRunning = false
  }
}