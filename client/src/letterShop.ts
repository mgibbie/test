import { UpgradeDefinition, UpgradeState } from './types'
import { UIManager } from './ui'

export class LetterShopManager {
  private letterShopElement!: HTMLElement
  private upgrades: Map<string, UpgradeState> = new Map()
  private upgradeDefinitions: UpgradeDefinition[] = []
  private ui: UIManager
  private gameInstance: any

  constructor(ui: UIManager, gameInstance: any) {
    this.ui = ui
    this.gameInstance = gameInstance
    this.initializeUpgrades()
  }

  private initializeUpgrades(): void {
    this.upgradeDefinitions = [
      {
        id: 'bigger-hand',
        name: 'Bigger Hand',
        description: 'Increases your hand size by 1 tile. Start with 7, can expand to 12!',
        baseCost: 50,
        maxPurchases: 5,
        priceMultiplier: 2.0,
        icon: '🖐️',
        effect: (game: any, purchaseCount: number) => {
          console.log(`Hand size increased! Now ${7 + purchaseCount} tiles`)
        }
      },
      {
        id: 'four-letter-words',
        name: 'Four Letter Words',
        description: 'Unlocks the ability to make 4-letter words! More letters = higher scores.',
        baseCost: 100,
        maxPurchases: 1,
        unlockRequirement: 'bigger-hand',
        icon: '4️⃣',
        effect: (game: any) => {
          console.log('Four letter words unlocked!')
        }
      },
      {
        id: 'five-letter-words',
        name: 'Five Letter Words',
        description: 'Unlocks the ability to make 5-letter words! Even bigger scores await!',
        baseCost: 200,
        maxPurchases: 1,
        unlockRequirement: 'four-letter-words',
        icon: '5️⃣',
        effect: (game: any) => {
          console.log('Five letter words unlocked!')
        }
      },
      {
        id: 'six-letter-words',
        name: 'Six Letter Words',
        description: 'Unlocks the ability to make 6-letter words! Maximum word length achieved!',
        baseCost: 400,
        maxPurchases: 1,
        unlockRequirement: 'five-letter-words',
        icon: '6️⃣',
        effect: (game: any) => {
          console.log('Six letter words unlocked!')
        }
      },
      {
        id: 'letter-boost',
        name: 'Letter Boost',
        description: 'Increases all letter chip values by +1. Stackable up to 5 times!',
        baseCost: 150,
        maxPurchases: 5,
        priceMultiplier: 2.5,
        unlockRequirement: 'bigger-hand',
        icon: '📈',
        effect: (game: any, purchaseCount: number) => {
          console.log(`Letter values boosted! +${purchaseCount} to all letters`)
        }
      },
      {
        id: 'multiplier-madness',
        name: 'Multiplier Madness',
        description: 'Increases all letter multipliers by +0.5. Stackable up to 10 times!',
        baseCost: 100,
        maxPurchases: 10,
        priceMultiplier: 1.8,
        unlockRequirement: 'letter-boost',
        icon: '✖️',
        effect: (game: any, purchaseCount: number) => {
          console.log(`Multipliers boosted! +${purchaseCount * 0.5} to all multipliers`)
        }
      },
      {
        id: 'vowel-power',
        name: 'Vowel Power',
        description: 'Vowels (A,E,I,O,U) get +2 chip value and +1 multiplier. Vowels are powerful!',
        baseCost: 300,
        maxPurchases: 1,
        unlockRequirement: 'letter-boost',
        icon: '🔤',
        effect: (game: any) => {
          console.log('Vowel Power activated! A,E,I,O,U are now much stronger!')
        }
      },
      {
        id: 'consonant-king',
        name: 'Consonant King',
        description: 'High-value consonants (J,Q,X,Z) get +3 chip value and +2 multiplier!',
        baseCost: 500,
        maxPurchases: 1,
        unlockRequirement: 'multiplier-madness',
        icon: '👑',
        effect: (game: any) => {
          console.log('Consonant King activated! J,Q,X,Z are now incredibly powerful!')
        }
      },
      {
        id: 'word-wizard',
        name: 'Word Wizard',
        description: 'Ultimate upgrade: All tiles gain +5 chip value and +3 multiplier!',
        baseCost: 1000,
        maxPurchases: 1,
        unlockRequirement: 'consonant-king',
        icon: '🧙',
        effect: (game: any) => {
          console.log('Word Wizard achieved! You are the master of letters!')
        }
      }
    ]

    // Initialize upgrade states
    this.upgradeDefinitions.forEach(upgrade => {
      this.upgrades.set(upgrade.id, {
        purchased: false,
        purchaseCount: 0,
        maxed: false
      })
    })
  }

  createLetterShop(): HTMLElement {
    const letterShop = document.createElement('div')
    letterShop.className = 'shop-container'
    letterShop.style.display = 'none'
    
    // Shop title
    const title = document.createElement('h2')
    title.className = 'shop-title'
    title.textContent = 'LETTER MASTERY TREE'
    
    // Skill tree container
    const skillTree = document.createElement('div')
    skillTree.className = 'skill-tree'
    
    this.updateSkillTree(skillTree)
    
    // Back button
    const backButton = document.createElement('button')
    backButton.className = 'back-button'
    backButton.textContent = 'BACK'
    
    backButton.addEventListener('click', () => {
      this.closeLetterShop()
    })
    
    letterShop.appendChild(title)
    letterShop.appendChild(skillTree)
    letterShop.appendChild(backButton)
    
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.appendChild(letterShop)
    
    this.letterShopElement = letterShop
    return letterShop
  }

  private updateSkillTree(skillTree: HTMLElement): void {
    skillTree.innerHTML = ''
    
    // Check progression for dynamic tree layout
    const biggerHandPurchased = this.upgrades.get('bigger-hand')?.purchased || false
    const fourLetterPurchased = this.upgrades.get('four-letter-words')?.purchased || false
    const fiveLetterPurchased = this.upgrades.get('five-letter-words')?.purchased || false
    const letterBoostPurchased = this.upgrades.get('letter-boost')?.purchased || false
    const multiplierPurchased = this.upgrades.get('multiplier-madness')?.purchased || false
    const consonantKingPurchased = this.upgrades.get('consonant-king')?.purchased || false
    
    // Tier 4 - Ultimate upgrade
    if (consonantKingPurchased) {
      const tier4Row = document.createElement('div')
      tier4Row.className = 'upgrade-row'
      
      const wordWizardUpgrade = this.upgradeDefinitions.find(u => u.id === 'word-wizard')
      if (wordWizardUpgrade) {
        const upgradeNode = this.createUpgradeNode(wordWizardUpgrade)
        tier4Row.appendChild(upgradeNode)
      }
      
      skillTree.appendChild(tier4Row)
    }
    
    // Tier 3 - Advanced upgrades
    if (letterBoostPurchased) {
      const tier3Row = document.createElement('div')
      tier3Row.className = 'upgrade-row'
      
      const tier3Upgrades = ['vowel-power']
      if (multiplierPurchased) {
        tier3Upgrades.push('consonant-king')
      }
      
      tier3Upgrades.forEach(upgradeId => {
        const upgrade = this.upgradeDefinitions.find(u => u.id === upgradeId)
        if (upgrade) {
          const upgradeNode = this.createUpgradeNode(upgrade)
          tier3Row.appendChild(upgradeNode)
        }
      })
      
      skillTree.appendChild(tier3Row)
    }
    
    // Tier 2 - Word length and power upgrades
    if (biggerHandPurchased) {
      const tier2Row = document.createElement('div')
      tier2Row.className = 'upgrade-row'
      
      const tier2Upgrades = ['four-letter-words', 'letter-boost']
      if (multiplierPurchased || letterBoostPurchased) {
        tier2Upgrades.push('multiplier-madness')
      }
      
      // Add word length progression
      if (fourLetterPurchased) {
        tier2Upgrades.push('five-letter-words')
      }
      if (fiveLetterPurchased) {
        tier2Upgrades.push('six-letter-words')
      }
      
      // Remove duplicates and create nodes
      const uniqueUpgrades = [...new Set(tier2Upgrades)]
      uniqueUpgrades.forEach(upgradeId => {
        const upgrade = this.upgradeDefinitions.find(u => u.id === upgradeId)
        if (upgrade) {
          const upgradeNode = this.createUpgradeNode(upgrade)
          tier2Row.appendChild(upgradeNode)
        }
      })
      
      skillTree.appendChild(tier2Row)
    }
    
    // Tier 1 - Root upgrade (always visible)
    const tier1Row = document.createElement('div')
    tier1Row.className = 'upgrade-row'
    
    const biggerHandUpgrade = this.upgradeDefinitions.find(u => u.id === 'bigger-hand')
    if (biggerHandUpgrade) {
      const upgradeNode = this.createUpgradeNode(biggerHandUpgrade)
      tier1Row.appendChild(upgradeNode)
    }
    
    skillTree.appendChild(tier1Row)
  }

  private createUpgradeNode(upgrade: UpgradeDefinition): HTMLElement {
    const upgradeState = this.upgrades.get(upgrade.id)!
    const upgradeNode = document.createElement('div')
    upgradeNode.className = 'upgrade-node'
    upgradeNode.dataset.upgradeId = upgrade.id
    
    const upgradeIcon = document.createElement('div')
    upgradeIcon.className = 'upgrade-icon'
    upgradeIcon.textContent = upgrade.icon
    
    const upgradePrice = document.createElement('div')
    upgradePrice.className = 'upgrade-price'
    
    // Calculate current price
    const currentPrice = this.getCurrentPrice(upgrade, upgradeState.purchaseCount)
    upgradePrice.textContent = `🟦${currentPrice}`
    
    // Show purchase count if applicable
    if (upgrade.maxPurchases > 1) {
      const purchaseCount = document.createElement('div')
      purchaseCount.className = 'purchase-count'
      purchaseCount.textContent = `${upgradeState.purchaseCount}/${upgrade.maxPurchases}`
      upgradeNode.appendChild(upgradeIcon)
      upgradeNode.appendChild(purchaseCount)
      upgradeNode.appendChild(upgradePrice)
    } else {
      upgradeNode.appendChild(upgradeIcon)
      upgradeNode.appendChild(upgradePrice)
    }
    
    // Apply appropriate styling
    if (upgradeState.maxed) {
      upgradeNode.classList.add('maxed')
      upgradePrice.textContent = 'MAXED'
    } else if (upgradeState.purchased) {
      upgradeNode.classList.add('purchased')
    }
    
    // Add click handler
    upgradeNode.addEventListener('click', () => {
      this.purchaseUpgrade(upgrade.id)
    })
    
    // Add tooltip handlers
    upgradeNode.addEventListener('mouseenter', (e) => {
      this.ui.showTooltip(e, upgrade.name, upgrade.description)
    })
    
    upgradeNode.addEventListener('mouseleave', () => {
      this.ui.hideTooltip()
    })
    
    upgradeNode.addEventListener('mousemove', (e) => {
      this.ui.updateTooltipPosition(e)
    })
    
    return upgradeNode
  }

  purchaseUpgrade(upgradeId: string): boolean {
    const upgrade = this.upgradeDefinitions.find(u => u.id === upgradeId)
    const upgradeState = this.upgrades.get(upgradeId)
    
    if (!upgrade || !upgradeState) return false
    
    // Check if upgrade is unlocked
    if (!this.isUpgradeUnlocked(upgrade)) return false
    
    // Check if already maxed out
    if (upgradeState.purchaseCount >= upgrade.maxPurchases) return false
    
    const currentPrice = this.getCurrentPrice(upgrade, upgradeState.purchaseCount)
    
    if (this.gameInstance.getTiles() >= currentPrice) {
      // Deduct tiles
      this.gameInstance.spendTiles(currentPrice)
      
      // Update state
      upgradeState.purchaseCount++
      upgradeState.purchased = true
      upgradeState.maxed = upgradeState.purchaseCount >= upgrade.maxPurchases
      
      // Apply upgrade effect
      upgrade.effect(this.gameInstance, upgradeState.purchaseCount)
      
      // Check if player has heal-on-purchase and trigger heal for any purchase
      if (this.gameInstance.hasHealOnPurchase()) {
        this.gameInstance.healCubeToFull()
      }
      
      // Update the display
      const skillTree = this.letterShopElement.querySelector('.skill-tree') as HTMLElement
      this.updateSkillTree(skillTree)
      
      console.log(`Purchased letter upgrade: ${upgradeId}`)
      return true
    }
    return false
  }

  openLetterShop(): void {
    if (!this.letterShopElement) {
      this.createLetterShop()
    }
    
    const elements = this.ui.getElements()
    if (elements.gameView) {
      elements.gameView.style.display = 'none'
    }
    
    // Refresh all currency displays to ensure they're visible on this screen
    this.gameInstance.refreshAllCurrencyDisplays()
    
    // Explicitly show and position all currency elements for this screen
    this.ensureCurrencyElementsVisible()
    
    // Hide letter game scene
    const letterGameScene = document.querySelector('.letter-game-container') as HTMLElement
    if (letterGameScene) {
      letterGameScene.style.display = 'none'
    }
    
    this.letterShopElement.style.display = 'block'
    this.gameInstance.setLetterShopState(true)
  }

  closeLetterShop(): void {
    this.letterShopElement.style.display = 'none'
    
    // Return to letter game launch screen
    this.gameInstance.returnToLetterGameLaunch()
    
    this.gameInstance.setLetterShopState(false)
  }

  private ensureCurrencyElementsVisible(): void {
    const elements = this.ui.getElements()
    
    // Money counter - always visible
    if (elements.moneyCounter) {
      elements.moneyCounter.style.display = 'block'
      elements.moneyCounter.style.position = 'absolute'
      elements.moneyCounter.style.top = '20px'
      elements.moneyCounter.style.left = '20px'
      elements.moneyCounter.style.zIndex = '300'
    }
    
    // Diamonds counter - visible if player has diamonds
    if (elements.diamondsCounter && this.gameInstance.getDiamonds() > 0) {
      elements.diamondsCounter.style.display = 'block'
      elements.diamondsCounter.style.position = 'absolute'
      elements.diamondsCounter.style.top = '80px'
      elements.diamondsCounter.style.left = '20px'
      elements.diamondsCounter.style.zIndex = '300'
    }
    
    // Emeralds counter - visible if player has emeralds
    if (elements.emeraldsCounter && this.gameInstance.getEmeralds() > 0) {
      elements.emeraldsCounter.style.display = 'block'
      elements.emeraldsCounter.style.position = 'absolute'
      elements.emeraldsCounter.style.top = '140px'
      elements.emeraldsCounter.style.left = '20px'
      elements.emeraldsCounter.style.zIndex = '300'
    }
    
    // Sapphires counter - visible if player has sapphires
    if (elements.sapphiresCounter && this.gameInstance.getSapphires() > 0) {
      elements.sapphiresCounter.style.display = 'block'
      elements.sapphiresCounter.style.position = 'absolute'
      elements.sapphiresCounter.style.top = '180px'
      elements.sapphiresCounter.style.left = '20px'
      elements.sapphiresCounter.style.zIndex = '300'
    }
    
    // Tiles counter - visible if player has tiles
    if (elements.tilesCounter && this.gameInstance.getTiles() > 0) {
      elements.tilesCounter.style.display = 'block'
      elements.tilesCounter.style.position = 'absolute'
      elements.tilesCounter.style.top = '220px'
      elements.tilesCounter.style.left = '20px'
      elements.tilesCounter.style.zIndex = '300'
    }
  }

  hasUpgrade(upgradeId: string): boolean {
    return this.upgrades.get(upgradeId)?.purchased || false
  }

  getUpgrades(): Map<string, UpgradeState> {
    return this.upgrades
  }

  getUpgradeLevel(upgradeId: string): number {
    return this.upgrades.get(upgradeId)?.purchaseCount || 0
  }

  private isUpgradeUnlocked(upgrade: UpgradeDefinition): boolean {
    // If no unlock requirement, it's always unlocked
    if (!upgrade.unlockRequirement) {
      return true
    }
    
    // Check if the required upgrade has been purchased
    const requiredUpgradeState = this.upgrades.get(upgrade.unlockRequirement)
    return requiredUpgradeState?.purchased || false
  }

  private getCurrentPrice(upgrade: UpgradeDefinition, purchaseCount: number): number {
    if (!upgrade.priceMultiplier) {
      return upgrade.baseCost
    }
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.priceMultiplier, purchaseCount))
  }

  // Helper methods for letter game to check upgrades
  getMaxHandSize(): number {
    return 7 + this.getUpgradeLevel('bigger-hand') // Base 7 + upgrades
  }

  getMaxWordLength(): number {
    if (this.hasUpgrade('six-letter-words')) return 6
    if (this.hasUpgrade('five-letter-words')) return 5
    if (this.hasUpgrade('four-letter-words')) return 4
    return 3 // Default
  }

  getLetterValueBonus(): number {
    return this.getUpgradeLevel('letter-boost') // +1 per upgrade level
  }

  getMultiplierBonus(): number {
    return this.getUpgradeLevel('multiplier-madness') * 0.5 // +0.5 per upgrade level
  }

  hasVowelPower(): boolean {
    return this.hasUpgrade('vowel-power')
  }

  hasConsonantKing(): boolean {
    return this.hasUpgrade('consonant-king')
  }

  hasWordWizard(): boolean {
    return this.hasUpgrade('word-wizard')
  }
}