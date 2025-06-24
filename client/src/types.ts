export interface GameState {
  money: number
  diamonds: number
  emeralds: number
  tiles: number
  health: number
  maxHealth: number
  isOnCooldown: boolean
  cooldownTimer: number
  hasReachedZeroHealth: boolean
  gameStarted: boolean
  clickValue: number
  isInShop: boolean
  isInDegenDiamonds: boolean
  isInDiamondShop: boolean
  isInSnakeShop: boolean
  isInTileShop: boolean
  isInLetterGameLaunch: boolean
  isInLetterGame: boolean
  bombSliderUnlocked: boolean
  bombCount: number
  isInSnakeGame: boolean
  borderPortalsUnlocked: boolean
  discardZoneUnlocked: boolean
  letterGameUnlocked: boolean
}

export interface UpgradeDefinition {
  id: string
  name: string
  description: string
  baseCost: number
  maxPurchases: number
  priceMultiplier?: number
  unlockRequirement?: string
  icon: string
  effect: (game: any, purchaseCount: number) => void
}

export interface UIElements {
  moneyCounter: HTMLElement
  diamondsCounter: HTMLElement
  emeraldsCounter: HTMLElement
  tilesCounter: HTMLElement
  healthBarContainer: HTMLElement
  healthBarFill: HTMLElement
  timerElement: HTMLElement
  shopButton: HTMLElement
  gameView: HTMLElement
}

export interface UpgradeState {
  purchased: boolean
  purchaseCount: number
  maxed: boolean
}

export interface LetterTile {
  letter: string
  chipValue: number  // Blue number in bottom right (Scrabble letter value)
  multiplier: number // Red number in bottom left  
  id: string
}

export interface LetterGameState {
  currentHand: LetterTile[]
  deck: LetterTile[]
  tilesEarned: number // New currency
  gamesPlayed: number
} 