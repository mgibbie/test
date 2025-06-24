import { UpgradeDefinition, UpgradeState } from './types'
import { UIManager } from './ui'

export class SnakeShopManager {
  private snakeShopElement!: HTMLElement
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
        id: 'border-portals',
        name: 'Border Portals',
        description: 'Hitting the edge of the map no longer causes you to lose but instead teleports you to the other side.',
        baseCost: 7,
        maxPurchases: 1,
        icon: '🌀',
        effect: (game: any) => {
          game.unlockBorderPortals()
        }
      },
      {
        id: 'speed-boost',
        name: 'Snakeskin',
        description: 'Gain +10 max health for your snake. Stackable.',
        baseCost: 40,
        maxPurchases: 20,
        priceMultiplier: 2,
        unlockRequirement: 'border-portals',
        icon: '💚',
        effect: (game: any, purchaseCount: number) => {
          // Each purchase gives +10 max health
          game.increaseSnakeMaxHealth(10)
          console.log(`Snakeskin purchased! Max health increased by 10. Total purchases: ${purchaseCount}`)
        }
      },
      {
        id: 'double-food',
        name: 'Extra Food',
        description: 'Each food item gives +1 extra emerald when eaten. Snake length increase remains normal.',
        baseCost: 15,
        maxPurchases: 10,
        priceMultiplier: 2,
        unlockRequirement: 'border-portals',
        icon: '🍎',
        effect: (game: any, purchaseCount: number) => {
          console.log(`Extra Food activated! Level ${purchaseCount}: +${purchaseCount} extra emeralds per food`)
        }
      },
      {
        id: 'ghost-mode',
        name: 'Extra Lives',
        description: 'Start each snake game with extra lives. Each life lets you revive at full health when you die.',
        baseCost: 40,
        maxPurchases: 5,
        priceMultiplier: 2,
        unlockRequirement: 'border-portals',
        icon: '🐍',
        effect: (game: any, purchaseCount: number) => {
          console.log(`Extra Lives purchased! You now start with ${purchaseCount} extra lives in snake.`)
          // Update the snake game immediately if it exists
          if (game.snakeGame) {
            game.snakeGame.extraLives = purchaseCount;
            game.snakeGame.livesLeft = 1 + purchaseCount;
            game.snakeGame.updateLivesDisplay();
            console.log(`Updated snake game immediately - Extra lives: ${purchaseCount}, Total lives: ${1 + purchaseCount}`);
          }
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

  createSnakeShop(): HTMLElement {
    const snakeShop = document.createElement('div')
    snakeShop.className = 'shop-container'
    snakeShop.style.display = 'none'
    
    // Shop title
    const title = document.createElement('h2')
    title.className = 'shop-title'
    title.textContent = 'SNAKE SKILL TREE'
    
    // Skill tree container
    const skillTree = document.createElement('div')
    skillTree.className = 'skill-tree'
    
    this.updateSkillTree(skillTree)
    
    // Back button
    const backButton = document.createElement('button')
    backButton.className = 'back-button'
    backButton.textContent = 'BACK'
    
    backButton.addEventListener('click', () => {
      this.closeSnakeShop()
    })
    
    snakeShop.appendChild(title)
    snakeShop.appendChild(skillTree)
    snakeShop.appendChild(backButton)
    
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.appendChild(snakeShop)
    
    this.snakeShopElement = snakeShop
    return snakeShop
  }

  private updateSkillTree(skillTree: HTMLElement): void {
    skillTree.innerHTML = ''
    
    // Check if border-portals is purchased to show the other upgrades
    const borderPortalsPurchased = this.upgrades.get('border-portals')?.purchased || false
    
    if (borderPortalsPurchased) {
      // Create top row with unlocked upgrades (above border portals)
      const topRow = document.createElement('div')
      topRow.className = 'upgrade-row'
      
      const topRowUpgrades = ['speed-boost', 'double-food', 'ghost-mode']
      topRowUpgrades.forEach(upgradeId => {
        const upgrade = this.upgradeDefinitions.find(u => u.id === upgradeId)
        if (upgrade) {
          const upgradeNode = this.createUpgradeNode(upgrade)
          topRow.appendChild(upgradeNode)
        }
      })
      
      skillTree.appendChild(topRow)
      
      // Add connection lines
      this.createConnectionLines(skillTree)
    }
    
    // Always show border-portals at bottom
    const borderPortalsUpgrade = this.upgradeDefinitions.find(u => u.id === 'border-portals')
    if (borderPortalsUpgrade) {
      const borderPortalsNode = this.createUpgradeNode(borderPortalsUpgrade)
      skillTree.appendChild(borderPortalsNode)
    }
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
    
    // Create price with emerald icon
    const emeraldIcon = document.createElement('img')
    emeraldIcon.src = '/assets/emerald.png'
    emeraldIcon.style.width = '12px'
    emeraldIcon.style.height = '12px'
    emeraldIcon.style.marginRight = '1px'
    emeraldIcon.style.verticalAlign = 'middle'
    
    const priceText = document.createElement('span')
    priceText.textContent = currentPrice.toString()
    
    upgradePrice.appendChild(emeraldIcon)
    upgradePrice.appendChild(priceText)
    
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
    
    if (this.gameInstance.getEmeralds() >= currentPrice) {
      // Deduct emeralds
      this.gameInstance.spendEmeralds(currentPrice)
      
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
      const skillTree = this.snakeShopElement.querySelector('.skill-tree') as HTMLElement
      this.updateSkillTree(skillTree)
      
      console.log(`Purchased snake upgrade: ${upgradeId}`)
      return true
    }
    return false
  }

  openSnakeShop(): void {
    if (!this.snakeShopElement) {
      this.createSnakeShop()
    }
    
    const elements = this.ui.getElements()
    if (elements.gameView) {
      elements.gameView.style.display = 'none'
    }
    
    // Refresh all currency displays to ensure they're visible on this screen
    this.gameInstance.refreshAllCurrencyDisplays()
    
    // Explicitly show and position all currency elements for this screen
    this.ensureCurrencyElementsVisible()
    
    // Hide snake game scene
    const snakeGameScene = document.querySelector('.snake-game-container') as HTMLElement
    if (snakeGameScene) {
      snakeGameScene.style.display = 'none'
    }
    
    this.snakeShopElement.style.display = 'block'
    this.gameInstance.setSnakeShopState(true)
  }

  closeSnakeShop(): void {
    this.snakeShopElement.style.display = 'none'
    
    // Show snake game scene
    const snakeGameScene = document.querySelector('.snake-game-container') as HTMLElement
    if (snakeGameScene) {
      snakeGameScene.style.display = 'block'
    }
    
    this.gameInstance.setSnakeShopState(false)
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
    
    // Tiles counter - visible if player has tiles
    if (elements.tilesCounter && this.gameInstance.getTiles() > 0) {
      elements.tilesCounter.style.display = 'block'
      elements.tilesCounter.style.position = 'absolute'
      elements.tilesCounter.style.top = '180px'
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

  private createConnectionLines(skillTree: HTMLElement): void {
    // Use setTimeout to ensure upgrade nodes are rendered before calculating positions
    setTimeout(() => {
      // Remove any existing SVG
      const existingSvg = skillTree.querySelector('.connection-lines-svg')
      if (existingSvg) {
        existingSvg.remove()
      }
      
      // Create SVG container
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('class', 'connection-lines-svg')
      svg.style.position = 'absolute'
      svg.style.top = '0'
      svg.style.left = '0'
      svg.style.width = '100%'
      svg.style.height = '100%'
      svg.style.pointerEvents = 'none'
      svg.style.zIndex = '1'
      
      // Get the upgrade nodes
      const borderPortalsNode = skillTree.querySelector('[data-upgrade-id="border-portals"]') as HTMLElement
      const speedBoostNode = skillTree.querySelector('[data-upgrade-id="speed-boost"]') as HTMLElement
      const doubleFoodNode = skillTree.querySelector('[data-upgrade-id="double-food"]') as HTMLElement
      const ghostModeNode = skillTree.querySelector('[data-upgrade-id="ghost-mode"]') as HTMLElement
      
      if (!borderPortalsNode || !speedBoostNode || !doubleFoodNode || !ghostModeNode) return
      
      const skillTreeRect = skillTree.getBoundingClientRect()
      const borderPortalsRect = borderPortalsNode.getBoundingClientRect()
      const speedBoostRect = speedBoostNode.getBoundingClientRect()
      const doubleFoodRect = doubleFoodNode.getBoundingClientRect()
      const ghostModeRect = ghostModeNode.getBoundingClientRect()
      
      // Calculate exact center positions for connections from top row to border portals
      const borderPortalsCenterX = borderPortalsRect.left - skillTreeRect.left + borderPortalsRect.width / 2
      
      const connections = [
        { 
          upgradeId: 'speed-boost', 
          startX: speedBoostRect.left - skillTreeRect.left + speedBoostRect.width / 2,
          startY: speedBoostRect.top - skillTreeRect.top + speedBoostRect.height,
          endX: borderPortalsCenterX,
          endY: borderPortalsRect.top - skillTreeRect.top
        },
        { 
          upgradeId: 'double-food', 
          startX: doubleFoodRect.left - skillTreeRect.left + doubleFoodRect.width / 2,
          startY: doubleFoodRect.top - skillTreeRect.top + doubleFoodRect.height,
          endX: borderPortalsCenterX,
          endY: borderPortalsRect.top - skillTreeRect.top
        },
        { 
          upgradeId: 'ghost-mode', 
          startX: ghostModeRect.left - skillTreeRect.left + ghostModeRect.width / 2,
          startY: ghostModeRect.top - skillTreeRect.top + ghostModeRect.height,
          endX: borderPortalsCenterX,
          endY: borderPortalsRect.top - skillTreeRect.top
        }
      ]
      
      // Draw connections
      connections.forEach(connection => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        
        const pathData = `M ${connection.startX} ${connection.startY} L ${connection.endX} ${connection.endY}`
        path.setAttribute('d', pathData)
        path.setAttribute('stroke-width', '2')
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke-dasharray', '5,5')
        path.dataset.upgradeId = connection.upgradeId
        
        // Set line color based on the minimum status between parent (border-portals) and child upgrade
        const parentUpgradeState = this.upgrades.get('border-portals')
        const childUpgradeState = this.upgrades.get(connection.upgradeId)
        
        // Convert upgrade state to numeric level (0 = not purchased, 1 = purchased, 2 = maxed)
        const getUpgradeLevel = (state: any) => {
          if (!state || !state.purchased) return 0
          if (state.maxed) return 2
          return 1
        }
        
        const parentLevel = getUpgradeLevel(parentUpgradeState)
        const childLevel = getUpgradeLevel(childUpgradeState)
        const minLevel = Math.min(parentLevel, childLevel)
        
        // Color based on minimum level
        if (minLevel === 2) {
          // Both are maxed - green solid
          path.setAttribute('stroke', '#00ff88')
          path.removeAttribute('stroke-dasharray')
        } else if (minLevel === 1) {
          // Both are at least purchased - blue dotted
          path.setAttribute('stroke', '#4a90e2')
          // Keep dotted for purchased but not maxed
        } else {
          // At least one is not purchased - gray dotted
          path.setAttribute('stroke', '#666666')
        }
        
        svg.appendChild(path)
      })
      
      skillTree.appendChild(svg)
    }, 10)
  }
} 