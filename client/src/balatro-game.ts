interface PlayingCard {
  id: string
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'
  rank: string
  value: number
  chipValue: number
  multiplier: number
  selected: boolean
  played: boolean
  enhancement?: 'foil' | 'holographic' | 'polychrome' | 'steel' | 'glass'
  seal?: 'red' | 'blue' | 'gold' | 'purple'
  edition?: 'negative' | 'polychrome'
}

interface PokerHand {
  name: string
  chipValue: number
  multiplier: number
  level: number
}

interface Joker {
  id: string
  name: string
  description: string
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
  chipBonus: number
  multBonus: number
  condition: string
  cost: number
}

interface Blind {
  name: string
  description: string
  chipReward: number
  targetScore: number
  effect?: string
}

interface BalatroState {
  deck: PlayingCard[]
  hand: PlayingCard[]
  selectedCards: PlayingCard[]
  jokers: Joker[]
  currentRound: number
  handsLeft: number
  discardsLeft: number
  score: number
  targetScore: number
  spades: number
  money: number
  currentBlind: Blind
  pokerHands: Map<string, PokerHand>
  animations: Array<{id: string, type: string, x: number, y: number, life: number}>
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
      jokers: [],
      currentRound: 1,
      handsLeft: 4,
      discardsLeft: 3,
      score: 0,
      targetScore: 300,
      spades: 0,
      money: 4,
      currentBlind: {
        name: 'Small Blind',
        description: 'A basic challenge to get you started',
        chipReward: 30,
        targetScore: 300
      },
      pokerHands: new Map(Object.entries(this.POKER_HANDS).map(([name, hand]) => [name, { name, ...hand }])),
      animations: []
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
          chipValue: this.getBaseChipValue(rank),
          multiplier: 1,
          selected: false,
          played: false,
          enhancement: Math.random() < 0.1 ? this.getRandomEnhancement() : undefined,
          seal: Math.random() < 0.05 ? this.getRandomSeal() : undefined
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

  private getBaseChipValue(rank: string): number {
    if (rank === 'A') return 11
    if (['J', 'Q', 'K'].includes(rank)) return 10
    return parseInt(rank) || 10
  }

  private getRandomEnhancement(): PlayingCard['enhancement'] {
    const enhancements: PlayingCard['enhancement'][] = ['foil', 'holographic', 'polychrome', 'steel', 'glass']
    return enhancements[Math.floor(Math.random() * enhancements.length)]
  }

  private getRandomSeal(): PlayingCard['seal'] {
    const seals: PlayingCard['seal'][] = ['red', 'blue', 'gold', 'purple']
    return seals[Math.floor(Math.random() * seals.length)]
  }

  private createRandomJoker(): Joker {
    const jokers = [
      {
        name: 'Joker',
        description: '+4 Mult',
        rarity: 'common' as const,
        chipBonus: 0,
        multBonus: 4,
        condition: 'always',
        cost: 5
      },
      {
        name: 'Greedy Joker',
        description: '+3 Mult per $4 you have',
        rarity: 'common' as const,
        chipBonus: 0,
        multBonus: 0,
        condition: 'money',
        cost: 6
      },
      {
        name: 'Lusty Joker',
        description: '+3 Mult per Heart in hand',
        rarity: 'uncommon' as const,
        chipBonus: 0,
        multBonus: 0,
        condition: 'hearts',
        cost: 7
      },
      {
        name: 'Wrathful Joker',
        description: '+3 Mult per Spade in hand',
        rarity: 'uncommon' as const,
        chipBonus: 0,
        multBonus: 0,
        condition: 'spades',
        cost: 7
      },
      {
        name: 'Banner',
        description: '+30 Chips per discard remaining',
        rarity: 'common' as const,
        chipBonus: 0,
        multBonus: 0,
        condition: 'discards',
        cost: 5
      }
    ]
    
    const selectedJoker = jokers[Math.floor(Math.random() * jokers.length)]
    return {
      id: `joker-${Date.now()}-${Math.random()}`,
      ...selectedJoker
    }
  }

  private calculateJokerBonuses(): { chips: number, mult: number } {
    let totalChips = 0
    let totalMult = 0

    this.gameState.jokers.forEach(joker => {
      totalChips += joker.chipBonus
      totalMult += joker.multBonus

      // Apply conditional bonuses
      switch (joker.condition) {
        case 'money':
          if (joker.name === 'Greedy Joker') {
            totalMult += Math.floor(this.gameState.money / 4) * 3
          }
          break
        case 'hearts':
          if (joker.name === 'Lusty Joker') {
            const hearts = this.gameState.hand.filter(card => card.suit === 'hearts').length
            totalMult += hearts * 3
          }
          break
        case 'spades':
          if (joker.name === 'Wrathful Joker') {
            const spades = this.gameState.hand.filter(card => card.suit === 'spades').length
            totalMult += spades * 3
          }
          break
        case 'discards':
          if (joker.name === 'Banner') {
            totalChips += this.gameState.discardsLeft * 30
          }
          break
      }
    })

    return { chips: totalChips, mult: totalMult }
  }

  private addAnimation(type: string, x: number, y: number, text: string, life: number): void {
    this.gameState.animations.push({
      id: `anim-${Date.now()}-${Math.random()}`,
      type,
      x,
      y,
      life
    })
  }

  private updateAnimations(): void {
    this.gameState.animations = this.gameState.animations.filter(anim => {
      anim.life--
      return anim.life > 0
    })
  }

  private resetGame(): void {
    this.gameState.deck = this.createDeck()
    this.gameState.hand = []
    this.gameState.selectedCards = []
    this.gameState.jokers = []
    this.gameState.currentRound = 1
    this.gameState.handsLeft = 4
    this.gameState.discardsLeft = 3
    this.gameState.score = 0
    this.gameState.targetScore = 300
    this.gameState.spades = 0
    this.gameState.money = 4
    this.gameState.animations = []
    this.gameState.currentBlind = {
      name: 'Small Blind',
      description: 'A basic challenge to get you started',
      chipReward: 30,
      targetScore: 300
    }
    
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
    const scoreResult = this.calculateScore(handResult, this.gameState.selectedCards)
    
    this.gameState.score += scoreResult.score
    this.gameState.handsLeft--
    
    // Add visual feedback
    this.addAnimation('score', 400, 300, scoreResult.breakdown, 120)
    
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

  private calculateScore(handResult: { name: string, chips: number, multiplier: number }, cards: PlayingCard[]): { score: number, breakdown: string } {
    let cardChips = cards.reduce((sum, card) => {
      let chips = card.chipValue
      
      // Apply enhancements
      if (card.enhancement === 'steel') chips *= 1.5
      if (card.enhancement === 'glass') chips *= 2
      
      return sum + Math.floor(chips)
    }, 0)
    
    let cardMultiplier = cards.reduce((sum, card) => {
      let mult = card.multiplier
      
      // Apply enhancements
      if (card.enhancement === 'foil') mult += 2
      if (card.enhancement === 'holographic') mult += 10
      if (card.enhancement === 'polychrome') mult *= 1.5
      
      return sum + mult
    }, 0)
    
    // Get joker bonuses
    const jokerBonuses = this.calculateJokerBonuses()
    
    const totalChips = handResult.chips + cardChips + jokerBonuses.chips
    const totalMultiplier = handResult.multiplier + cardMultiplier + jokerBonuses.mult
    
    const score = totalChips * Math.max(1, totalMultiplier)
    
    const breakdown = `${totalChips} chips × ${totalMultiplier} mult = ${score}`
    
    return { score, breakdown }
  }

  private completeRound(): void {
    this.gameState.spades += 10 // Award 10 spades per completed round
    this.gameState.money += 4 // Award money for shop
    this.gameState.currentRound++
    this.gameState.handsLeft = 4
    this.gameState.discardsLeft = 3
    this.gameState.score = 0
    this.gameState.targetScore = Math.floor(this.gameState.targetScore * 1.5) // Increase difficulty
    
    // Level up a random poker hand
    const handNames = Array.from(this.gameState.pokerHands.keys())
    const randomHand = handNames[Math.floor(Math.random() * handNames.length)]
    const hand = this.gameState.pokerHands.get(randomHand)!
    hand.level++
    hand.chipValue = Math.floor(hand.chipValue * 1.2)
    hand.multiplier++
    
    // Update blind
    this.updateBlind()
    
    console.log(`Round ${this.gameState.currentRound - 1} completed! Earned 10 spades and $4. ${randomHand} leveled up!`)
    
    // Show shop for 3 seconds, then continue
    this.showRoundCompleteMessage()
  }

  private updateBlind(): void {
    const blinds = [
      {
        name: 'Small Blind',
        description: 'A basic challenge to get you started',
        chipReward: 30,
        targetScore: 300
      },
      {
        name: 'Big Blind',
        description: 'Step it up a notch',
        chipReward: 50,
        targetScore: this.gameState.targetScore
      },
      {
        name: 'Boss Blind',
        description: 'The ultimate test of skill',
        chipReward: 100,
        targetScore: this.gameState.targetScore
      }
    ]
    
    const blindIndex = Math.min(this.gameState.currentRound - 1, blinds.length - 1)
    this.gameState.currentBlind = blinds[blindIndex]
    this.gameState.targetScore = this.gameState.currentBlind.targetScore
  }

  private showRoundCompleteMessage(): void {
    // Create temporary overlay
    const overlay = document.createElement('div')
    overlay.style.position = 'fixed'
    overlay.style.top = '50%'
    overlay.style.left = '50%'
    overlay.style.transform = 'translate(-50%, -50%)'
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'
    overlay.style.padding = '30px'
    overlay.style.borderRadius = '15px'
    overlay.style.border = '3px solid #4a90e2'
    overlay.style.color = '#ffffff'
    overlay.style.textAlign = 'center'
    overlay.style.zIndex = '10000'
    overlay.style.minWidth = '400px'

    const title = document.createElement('h2')
    title.textContent = `Round ${this.gameState.currentRound - 1} Complete!`
    title.style.color = '#4a90e2'
    title.style.marginBottom = '20px'

    const rewards = document.createElement('p')
    rewards.innerHTML = `Earned: ♠️ 10 spades, $4<br>Next: ${this.gameState.currentBlind.name}`
    rewards.style.fontSize = '16px'
    rewards.style.marginBottom = '20px'

    const shopButton = document.createElement('button')
    shopButton.textContent = 'Buy Joker ($5-$7)'
    shopButton.style.backgroundColor = '#4a90e2'
    shopButton.style.color = 'white'
    shopButton.style.border = 'none'
    shopButton.style.padding = '12px 24px'
    shopButton.style.borderRadius = '8px'
    shopButton.style.fontSize = '14px'
    shopButton.style.cursor = 'pointer'
    shopButton.style.marginRight = '10px'

    const continueButton = document.createElement('button')
    continueButton.textContent = 'Continue'
    continueButton.style.backgroundColor = '#28a745'
    continueButton.style.color = 'white'
    continueButton.style.border = 'none'
    continueButton.style.padding = '12px 24px'
    continueButton.style.borderRadius = '8px'
    continueButton.style.fontSize = '14px'
    continueButton.style.cursor = 'pointer'

    shopButton.addEventListener('click', () => {
      this.buyRandomJoker()
      overlay.remove()
      this.drawHand()
      this.updateDisplay()
      this.draw()
    })

    continueButton.addEventListener('click', () => {
      overlay.remove()
      this.drawHand()
      this.updateDisplay()
      this.draw()
    })

    overlay.appendChild(title)
    overlay.appendChild(rewards)
    overlay.appendChild(shopButton)
    overlay.appendChild(continueButton)
    document.body.appendChild(overlay)

    // Auto-continue after 10 seconds
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.remove()
        this.drawHand()
        this.updateDisplay()
        this.draw()
      }
    }, 10000)
  }

  private buyRandomJoker(): void {
    const joker = this.createRandomJoker()
    
    if (this.gameState.money >= joker.cost) {
      this.gameState.money -= joker.cost
      this.gameState.jokers.push(joker)
      console.log(`Bought ${joker.name} for $${joker.cost}!`)
    } else {
      console.log('Not enough money for joker!')
    }
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
    this.scoreDisplay.textContent = `Score: ${this.gameState.score}/${this.gameState.targetScore} | Round: ${this.gameState.currentRound} | Hands: ${this.gameState.handsLeft} | Discards: ${this.gameState.discardsLeft} | Money: $${this.gameState.money}`
    
    const rewardCount = this.rewardDisplay.querySelector('span:last-child')
    if (rewardCount) {
      rewardCount.textContent = this.gameState.spades.toString()
    }
  }

  private draw(): void {
    // Clear canvas with animated gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(0.5, '#16213e')
    gradient.addColorStop(1, '#0f3460')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)
    
    // Draw subtle background pattern
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.02)'
    for (let i = 0; i < this.CANVAS_WIDTH; i += 60) {
      for (let j = 0; j < this.CANVAS_HEIGHT; j += 60) {
        if ((i + j) % 120 === 0) {
          this.ctx.fillRect(i, j, 30, 30)
        }
      }
    }
    
    // Draw UI elements
    this.drawBlindInfo()
    this.drawJokers()
    this.drawPokerHandsLegend()
    
    // Draw hand
    this.drawHandCards()
    
    // Draw selected cards info
    if (this.gameState.selectedCards.length > 0) {
      this.drawHandInfo()
    }
    
    // Update and draw animations
    this.updateAnimations()
    this.drawAnimations()
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
    // Enhancement effects
    if (card.enhancement === 'foil') {
      this.ctx.fillStyle = 'linear-gradient(45deg, #silver, #lightgray)'
      this.ctx.fillRect(x - 2, y - 2, this.CARD_WIDTH + 4, this.CARD_HEIGHT + 4)
    } else if (card.enhancement === 'holographic') {
      this.ctx.fillStyle = '#ff00ff'
      this.ctx.fillRect(x - 1, y - 1, this.CARD_WIDTH + 2, this.CARD_HEIGHT + 2)
    } else if (card.enhancement === 'polychrome') {
      // Rainbow effect simulation
      const gradient = this.ctx.createLinearGradient(x, y, x + this.CARD_WIDTH, y + this.CARD_HEIGHT)
      gradient.addColorStop(0, '#ff0000')
      gradient.addColorStop(0.5, '#00ff00')
      gradient.addColorStop(1, '#0000ff')
      this.ctx.fillStyle = gradient
      this.ctx.fillRect(x - 1, y - 1, this.CARD_WIDTH + 2, this.CARD_HEIGHT + 2)
    }
    
    // Card background
    let cardBg = '#ffffff'
    if (card.enhancement === 'steel') cardBg = '#e6e6e6'
    if (card.enhancement === 'glass') cardBg = '#f0f8ff'
    if (card.selected) cardBg = '#ffff88'
    
    this.ctx.fillStyle = cardBg
    this.ctx.fillRect(x, y, this.CARD_WIDTH, this.CARD_HEIGHT)
    
    // Card border with enhancement colors
    let borderColor = '#000000'
    let borderWidth = 1
    
    if (card.selected) {
      borderColor = '#ff8800'
      borderWidth = 3
    } else if (card.enhancement) {
      borderColor = '#4a90e2'
      borderWidth = 2
    }
    
    this.ctx.strokeStyle = borderColor
    this.ctx.lineWidth = borderWidth
    this.ctx.strokeRect(x, y, this.CARD_WIDTH, this.CARD_HEIGHT)
    
    // Seal indicator (top-right corner)
    if (card.seal) {
      const sealColors = {
        red: '#ff4444',
        blue: '#4444ff',
        gold: '#ffaa00',
        purple: '#aa44ff'
      }
      this.ctx.fillStyle = sealColors[card.seal]
      this.ctx.fillRect(x + this.CARD_WIDTH - 8, y + 2, 6, 6)
    }
    
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
    this.ctx.font = '18px Arial'
    this.ctx.fillText(suitSymbol, x + 5, y + 35)
    
    // Draw chip value with enhancement indicators
    this.ctx.fillStyle = '#0066cc'
    this.ctx.font = 'bold 10px Arial'
    let chipText = `${card.chipValue}`
    if (card.enhancement === 'steel') chipText += ' (Steel)'
    if (card.enhancement === 'glass') chipText += ' (Glass)'
    this.ctx.fillText(chipText, x + 5, y + this.CARD_HEIGHT - 15)
    
    // Draw multiplier if > 1
    if (card.multiplier > 1) {
      this.ctx.fillStyle = '#cc6600'
      this.ctx.font = 'bold 9px Arial'
      this.ctx.fillText(`x${card.multiplier}`, x + 5, y + this.CARD_HEIGHT - 5)
    }
    
    // Enhancement text overlay
    if (card.enhancement) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      this.ctx.font = '8px Arial'
      const enhancementText = card.enhancement.toUpperCase()
      this.ctx.fillText(enhancementText, x + 2, y + this.CARD_HEIGHT - 25)
    }
  }

  private drawHandInfo(): void {
    const handResult = this.evaluateHand(this.gameState.selectedCards)
    const scoreResult = this.calculateScore(handResult, this.gameState.selectedCards)
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    this.ctx.fillRect(250, 350, 350, 100)
    
    // Add border and glow effect
    this.ctx.strokeStyle = '#4a90e2'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(250, 350, 350, 100)
    
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 18px Arial'
    this.ctx.fillText(`Hand: ${handResult.name}`, 260, 375)
    
    this.ctx.font = '14px Arial'
    this.ctx.fillText(`${scoreResult.breakdown}`, 260, 395)
    
    this.ctx.font = 'bold 16px Arial'
    this.ctx.fillStyle = '#4a90e2'
    this.ctx.fillText(`Total Score: ${scoreResult.score}`, 260, 420)
    
    // Draw joker bonuses if any
    if (this.gameState.jokers.length > 0) {
      const jokerBonuses = this.calculateJokerBonuses()
      this.ctx.font = '12px Arial'
      this.ctx.fillStyle = '#ffaa00'
      this.ctx.fillText(`Joker Bonus: +${jokerBonuses.chips} chips, +${jokerBonuses.mult} mult`, 260, 440)
    }
  }

  private drawPokerHandsLegend(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    this.ctx.fillRect(10, 10, 220, 320)
    
    // Border
    this.ctx.strokeStyle = '#4a90e2'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(10, 10, 220, 320)
    
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 16px Arial'
    this.ctx.fillText('Poker Hands:', 20, 35)
    
    let y = 55
    this.ctx.font = '11px Arial'
    Array.from(this.gameState.pokerHands.entries()).forEach(([name, hand]) => {
      // Hand name with level indicator
      this.ctx.fillStyle = hand.level > 1 ? '#ffaa00' : '#ffffff'
      this.ctx.fillText(`${name} (Lv.${hand.level})`, 20, y)
      
      // Stats
      this.ctx.fillStyle = '#aaaaaa'
      this.ctx.font = '10px Arial'
      this.ctx.fillText(`${hand.chipValue} chips × ${hand.multiplier} mult`, 25, y + 12)
      
      this.ctx.font = '11px Arial'
      y += 28
    })
  }

  private drawJokers(): void {
    if (this.gameState.jokers.length === 0) return
    
    const jokerY = 50
    const jokerSpacing = 120
    
    this.gameState.jokers.forEach((joker, index) => {
      const x = 50 + index * jokerSpacing
      this.drawJoker(joker, x, jokerY)
    })
  }

  private drawJoker(joker: Joker, x: number, y: number): void {
    const width = 100
    const height = 60
    
    // Rarity colors
    const rarityColors = {
      common: '#888888',
      uncommon: '#4a90e2',
      rare: '#9b59b6',
      legendary: '#f39c12'
    }
    
    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(x, y, width, height)
    
    // Border with rarity color
    this.ctx.strokeStyle = rarityColors[joker.rarity]
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(x, y, width, height)
    
    // Joker name
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 10px Arial'
    this.ctx.fillText(joker.name, x + 5, y + 15)
    
    // Description
    this.ctx.font = '8px Arial'
    this.ctx.fillStyle = '#cccccc'
    const words = joker.description.split(' ')
    let line = ''
    let lineY = y + 28
    
    words.forEach(word => {
      const testLine = line + word + ' '
      const metrics = this.ctx.measureText(testLine)
      if (metrics.width > width - 10) {
        this.ctx.fillText(line, x + 5, lineY)
        line = word + ' '
        lineY += 10
      } else {
        line = testLine
      }
    })
    this.ctx.fillText(line, x + 5, lineY)
  }

  private drawBlindInfo(): void {
    const blind = this.gameState.currentBlind
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    this.ctx.fillRect(250, 10, 300, 80)
    
    this.ctx.strokeStyle = '#ff4444'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(250, 10, 300, 80)
    
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 16px Arial'
    this.ctx.fillText(blind.name, 260, 30)
    
    this.ctx.font = '12px Arial'
    this.ctx.fillText(blind.description, 260, 50)
    
    this.ctx.font = 'bold 14px Arial'
    this.ctx.fillStyle = '#4a90e2'
    this.ctx.fillText(`Target: ${this.gameState.targetScore}`, 260, 70)
    
    // Progress bar
    const progress = Math.min(this.gameState.score / this.gameState.targetScore, 1)
    this.ctx.fillStyle = '#333333'
    this.ctx.fillRect(400, 60, 140, 8)
    this.ctx.fillStyle = '#4a90e2'
    this.ctx.fillRect(400, 60, 140 * progress, 8)
  }

  private drawAnimations(): void {
    this.gameState.animations.forEach(anim => {
      this.ctx.save()
      this.ctx.globalAlpha = anim.life / 120
      
      if (anim.type === 'score') {
        this.ctx.fillStyle = '#ffaa00'
        this.ctx.font = 'bold 16px Arial'
        this.ctx.fillText('💰', anim.x, anim.y - (120 - anim.life))
      }
      
      this.ctx.restore()
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