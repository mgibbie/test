import { UpgradeDefinition, UpgradeState } from './types'
import { UIManager } from './ui'

export class TetrisShopManager {
  private tetrisShopElement!: HTMLElement
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
        id: 'level-bonus',
        name: 'Level Bonus',
        description: 'Gain +20% sapphire bonus per level achieved in Tetris. Stackable.',
        baseCost: 10,
        maxPurchases: 10,
        priceMultiplier: 1.8,
        icon: '🔺',
        effect: (game: any, purchaseCount: number) => {
          console.log(`Level Bonus upgraded! Now gives +${purchaseCount * 20}% bonus per level`)
        }
      },
      {
        id: 'line-clear-master',
        name: 'Line Clear Master',
        description: 'Each line cleared gives +1 bonus sapphire. Massive rewards for Tetrises!',
        baseCost: 15,
        maxPurchases: 5,
        priceMultiplier: 2.2,
        unlockRequirement: 'level-bonus',
        icon: '📏',
        effect: (game: any, purchaseCount: number) => {
          console.log(`Line Clear Master upgraded! +${purchaseCount} bonus sapphires per line`)
        }
      },
      {
        id: 'speed-demon',
        name: 'Speed Demon',
        description: 'Start each Tetris game 2 levels higher, but gain +50% more sapphires.',
        baseCost: 25,
        maxPurchases: 3,
        priceMultiplier: 2.5,
        unlockRequirement: 'level-bonus',
        icon: '⚡',
        effect: (game: any, purchaseCount: number) => {
          console.log(`Speed Demon upgraded! Start at level ${1 + purchaseCount * 2} with +${purchaseCount * 50}% bonus`)
        }
      },
      {
        id: 'ghost-vision',
        name: 'Ghost Vision',
        description: 'See ghost pieces more clearly and gain +10% sapphires for using hard drop.',
        baseCost: 20,
        maxPurchases: 1,
        unlockRequirement: 'level-bonus',
        icon: '👻',
        effect: (game: any) => {
          console.log('Ghost Vision unlocked! Ghost pieces now more visible + hard drop bonus')
        }
      },
      {
        id: 'tetris-master',
        name: 'Tetris Master',
        description: 'Clearing 4 lines at once (Tetris) gives +100% bonus sapphires.',
        baseCost: 50,
        maxPurchases: 3,
        priceMultiplier: 2.0,
        unlockRequirement: 'line-clear-master',
        icon: '🏆',
        effect: (game: any, purchaseCount: number) => {
          console.log(`Tetris Master upgraded! Tetris gives +${purchaseCount * 100}% bonus`)
        }
      },
      {
        id: 'combo-king',
        name: 'Combo King',
        description: 'Clearing lines consecutively builds a combo multiplier up to 5x.',
        baseCost: 40,
        maxPurchases: 1,
        unlockRequirement: 'line-clear-master',
        icon: '🔥',
        effect: (game: any) => {
          console.log('Combo King unlocked! Consecutive line clears build combo multiplier')
        }
      },
      {
        id: 'lightning-reflexes',
        name: 'Lightning Reflexes',
        description: 'Each level increases sapphire rewards by an additional +5%. Synergizes with Speed Demon.',
        baseCost: 60,
        maxPurchases: 5,
        priceMultiplier: 2.0,
        unlockRequirement: 'speed-demon',
        icon: '⚡',
        effect: (game: any, purchaseCount: number) => {
          console.log(`Lightning Reflexes upgraded! +${purchaseCount * 5}% per level bonus`)
        }
      },
      {
        id: 'crystal-clarity',
        name: 'Crystal Clarity',
        description: 'Preview the next 3 pieces instead of 1, and gain +25% sapphires.',
        baseCost: 45,
        maxPurchases: 1,
        unlockRequirement: 'ghost-vision',
        icon: '🔮',
        effect: (game: any) => {
          console.log('Crystal Clarity unlocked! See 3 next pieces + 25% bonus')
        }
      },
      {
        id: 'sapphire-cascade',
        name: 'Sapphire Cascade',
        description: 'Ultimate upgrade: All Tetris mechanics give +100% more sapphires.',
        baseCost: 200,
        maxPurchases: 1,
        unlockRequirement: 'tetris-master',
        icon: '💎',
        effect: (game: any) => {
          console.log('Sapphire Cascade unlocked! All sapphire gains doubled!')
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

  createTetrisShop(): HTMLElement {
    const tetrisShop = document.createElement('div')
    tetrisShop.className = 'shop-container'
    tetrisShop.style.display = 'none'
    
    // Shop title
    const title = document.createElement('h2')
    title.className = 'shop-title'
    title.textContent = 'TETRIS MASTERY TREE'
    
    // Skill tree container
    const skillTree = document.createElement('div')
    skillTree.className = 'skill-tree'
    
    this.updateSkillTree(skillTree)
    
    // Back button
    const backButton = document.createElement('button')
    backButton.className = 'back-button'
    backButton.textContent = 'BACK'
    
    backButton.addEventListener('click', () => {
      this.closeTetrisShop()
    })
    
    tetrisShop.appendChild(title)
    tetrisShop.appendChild(skillTree)
    tetrisShop.appendChild(backButton)
    
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.appendChild(tetrisShop)
    
    this.tetrisShopElement = tetrisShop
    return tetrisShop
  }

  private updateSkillTree(skillTree: HTMLElement): void {
    skillTree.innerHTML = ''
    
    // Check if level-bonus is purchased to show the tier 2 upgrades
    const levelBonusPurchased = this.upgrades.get('level-bonus')?.purchased || false
    
    // Tier 3 upgrades (top row)
    const tier3Purchased = {
      lineClearMaster: this.upgrades.get('line-clear-master')?.purchased || false,
      speedDemon: this.upgrades.get('speed-demon')?.purchased || false,
      ghostVision: this.upgrades.get('ghost-vision')?.purchased || false
    }
    
    const anyTier3Purchased = Object.values(tier3Purchased).some(Boolean)
    
    if (anyTier3Purchased) {
      // Create tier 4 row (ultimate upgrades)
      const tier4Row = document.createElement('div')
      tier4Row.className = 'upgrade-row'
      
      const tier4Upgrades: string[] = []
      if (tier3Purchased.lineClearMaster) {
        tier4Upgrades.push('tetris-master', 'combo-king')
      }
      if (tier3Purchased.speedDemon) {
        tier4Upgrades.push('lightning-reflexes')
      }
      if (tier3Purchased.ghostVision) {
        tier4Upgrades.push('crystal-clarity')
      }
      
      // Add ultimate upgrade if tetris-master is purchased
      if (this.upgrades.get('tetris-master')?.purchased) {
        tier4Upgrades.push('sapphire-cascade')
      }
      
      tier4Upgrades.forEach(upgradeId => {
        const upgrade = this.upgradeDefinitions.find(u => u.id === upgradeId)
        if (upgrade) {
          const upgradeNode = this.createUpgradeNode(upgrade)
          tier4Row.appendChild(upgradeNode)
        }
      })
      
      if (tier4Upgrades.length > 0) {
        skillTree.appendChild(tier4Row)
      }
    }
    
    if (levelBonusPurchased) {
      // Create tier 2 row (3 main branches)
      const tier2Row = document.createElement('div')
      tier2Row.className = 'upgrade-row'
      
      const tier2Upgrades = ['line-clear-master', 'speed-demon', 'ghost-vision']
      tier2Upgrades.forEach(upgradeId => {
        const upgrade = this.upgradeDefinitions.find(u => u.id === upgradeId)
        if (upgrade) {
          const upgradeNode = this.createUpgradeNode(upgrade)
          tier2Row.appendChild(upgradeNode)
        }
      })
      
      skillTree.appendChild(tier2Row)
      
      // Add connection lines
      this.createConnectionLines(skillTree, tier3Purchased)
    }
    
    // Always show level-bonus at bottom (root)
    const levelBonusUpgrade = this.upgradeDefinitions.find(u => u.id === 'level-bonus')
    if (levelBonusUpgrade) {
      const levelBonusNode = this.createUpgradeNode(levelBonusUpgrade)
      skillTree.appendChild(levelBonusNode)
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
    
    // Create price with sapphire icon
    const sapphireIcon = document.createElement('img')
    sapphireIcon.src = '/assets/sapphire.png'
    sapphireIcon.style.width = '12px'
    sapphireIcon.style.height = '12px'
    sapphireIcon.style.marginRight = '1px'
    sapphireIcon.style.verticalAlign = 'middle'
    
    const priceText = document.createElement('span')
    priceText.textContent = currentPrice.toString()
    
    upgradePrice.appendChild(sapphireIcon)
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
    
    if (this.gameInstance.getSapphires() >= currentPrice) {
      // Deduct sapphires
      this.gameInstance.spendSapphires(currentPrice)
      
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
      const skillTree = this.tetrisShopElement.querySelector('.skill-tree') as HTMLElement
      this.updateSkillTree(skillTree)
      
      console.log(`Purchased tetris upgrade: ${upgradeId}`)
      return true
    }
    return false
  }

  openTetrisShop(): void {
    if (!this.tetrisShopElement) {
      this.createTetrisShop()
    }
    
    const elements = this.ui.getElements()
    if (elements.gameView) {
      elements.gameView.style.display = 'none'
    }
    
    // Refresh all currency displays to ensure they're visible on this screen
    this.gameInstance.refreshAllCurrencyDisplays()
    
    // Explicitly show and position all currency elements for this screen
    this.ensureCurrencyElementsVisible()
    
    // Hide tetris game scene
    const tetrisGameScene = document.querySelector('.tetris-game-container') as HTMLElement
    if (tetrisGameScene) {
      tetrisGameScene.style.display = 'none'
    }
    
    this.tetrisShopElement.style.display = 'block'
    this.gameInstance.setTetrisShopState(true)
  }

  closeTetrisShop(): void {
    this.tetrisShopElement.style.display = 'none'
    
    // Show tetris game scene
    const tetrisGameScene = document.querySelector('.tetris-game-container') as HTMLElement
    if (tetrisGameScene) {
      tetrisGameScene.style.display = 'block'
    }
    
    this.gameInstance.setTetrisShopState(false)
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

  private createConnectionLines(skillTree: HTMLElement, tier3State: any): void {
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
      const levelBonusNode = skillTree.querySelector('[data-upgrade-id="level-bonus"]') as HTMLElement
      const lineClearNode = skillTree.querySelector('[data-upgrade-id="line-clear-master"]') as HTMLElement
      const speedDemonNode = skillTree.querySelector('[data-upgrade-id="speed-demon"]') as HTMLElement
      const ghostVisionNode = skillTree.querySelector('[data-upgrade-id="ghost-vision"]') as HTMLElement
      
      if (!levelBonusNode) return
      
      const skillTreeRect = skillTree.getBoundingClientRect()
      const levelBonusRect = levelBonusNode.getBoundingClientRect()
      const levelBonusCenterX = levelBonusRect.left - skillTreeRect.left + levelBonusRect.width / 2
      
      // Tier 1 to Tier 2 connections
      const tier2Connections = []
      if (lineClearNode) {
        const rect = lineClearNode.getBoundingClientRect()
        tier2Connections.push({
          upgradeId: 'line-clear-master',
          startX: rect.left - skillTreeRect.left + rect.width / 2,
          startY: rect.top - skillTreeRect.top + rect.height,
          endX: levelBonusCenterX,
          endY: levelBonusRect.top - skillTreeRect.top
        })
      }
      
      if (speedDemonNode) {
        const rect = speedDemonNode.getBoundingClientRect()
        tier2Connections.push({
          upgradeId: 'speed-demon',
          startX: rect.left - skillTreeRect.left + rect.width / 2,
          startY: rect.top - skillTreeRect.top + rect.height,
          endX: levelBonusCenterX,
          endY: levelBonusRect.top - skillTreeRect.top
        })
      }
      
      if (ghostVisionNode) {
        const rect = ghostVisionNode.getBoundingClientRect()
        tier2Connections.push({
          upgradeId: 'ghost-vision',
          startX: rect.left - skillTreeRect.left + rect.width / 2,
          startY: rect.top - skillTreeRect.top + rect.height,
          endX: levelBonusCenterX,
          endY: levelBonusRect.top - skillTreeRect.top
        })
      }
      
      // Draw tier 2 connections
      tier2Connections.forEach(connection => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        
        const pathData = `M ${connection.startX} ${connection.startY} L ${connection.endX} ${connection.endY}`
        path.setAttribute('d', pathData)
        path.setAttribute('stroke-width', '2')
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke-dasharray', '5,5')
        
        const upgradeState = this.upgrades.get(connection.upgradeId)
        if (upgradeState?.maxed) {
          path.setAttribute('stroke', '#00ff88')
          path.removeAttribute('stroke-dasharray')
        } else if (upgradeState?.purchased) {
          path.setAttribute('stroke', '#4a90e2')
        } else {
          path.setAttribute('stroke', '#666666')
        }
        
        svg.appendChild(path)
      })
      
      skillTree.appendChild(svg)
    }, 10)
  }
}