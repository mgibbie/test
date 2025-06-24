import { UpgradeDefinition, UpgradeState } from './types'
import { UIManager } from './ui'

export class ShopManager {
  private shopElement!: HTMLElement
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
        id: 'heal-on-purchase',
        name: 'Heal on Purchase',
        description: 'Purchasing any upgrade from the shop will instantly heal the cube to full health and cancel any cooldown timer.',
        baseCost: 10,
        maxPurchases: 1,
        icon: '⬆️',
        effect: (game: any) => {
          game.healCubeToFull()
        }
      },
      {
        id: 'boost-payout',
        name: 'Boost Payout',
        description: 'Increases the value of clicking on the cube by $1. Can be purchased 20 times.',
        baseCost: 30,
        maxPurchases: 20,
        priceMultiplier: 2.5,
        unlockRequirement: 'heal-on-purchase',
        icon: '💸',
        effect: (game: any, _purchaseCount: number) => {
          game.increaseClickValue(1)
        }
      },
      {
        id: 'health-boost',
        name: 'Health Boost',
        description: 'Increases the maximum health of the cube by 1. Can be purchased 30 times.',
        baseCost: 10,
        maxPurchases: 30,
        priceMultiplier: 2.0,
        unlockRequirement: 'heal-on-purchase',
        icon: '❤️',
        effect: (game: any, _purchaseCount: number) => {
          game.increaseMaxHealth(1)
        }
      },
      {
        id: 'shorten-timer',
        name: 'Shorten Timer',
        description: 'Reduces the cooldown timer by 5 seconds. Can be purchased 5 times.',
        baseCost: 5,
        maxPurchases: 5,
        priceMultiplier: 3.0,
        unlockRequirement: 'heal-on-purchase',
        icon: '⏱️',
        effect: (game: any, _purchaseCount: number) => {
          game.reduceTimerDuration(5)
        }
      },
      {
        id: 'placeholder-upgrade-1',
        name: 'Placeholder Upgrade 1',
        description: 'This is a placeholder upgrade that will be implemented later. Coming soon!',
        baseCost: 100,
        maxPurchases: 1,
        unlockRequirement: 'boost-payout',
        icon: '🔮',
        effect: (_game: any, _purchaseCount: number) => {
          // Placeholder effect
          console.log('Placeholder upgrade 1 purchased!')
        }
      },
      {
        id: 'placeholder-upgrade-2',
        name: 'Placeholder Upgrade 2',
        description: 'This is another placeholder upgrade that will be implemented later. Coming soon!',
        baseCost: 150,
        maxPurchases: 1,
        unlockRequirement: 'boost-payout',
        icon: '⭐',
        effect: (_game: any, _purchaseCount: number) => {
          // Placeholder effect
          console.log('Placeholder upgrade 2 purchased!')
        }
      },
      {
        id: 'placeholder-upgrade-3',
        name: 'Unlock Degen Diamonds',
        description: 'Unlocks access to the Degen Diamonds feature! A new button will appear in the bottom left corner.',
        baseCost: 15,
        maxPurchases: 1,
        unlockRequirement: 'health-boost',
        icon: '💎',
        effect: (game: any, _purchaseCount: number) => {
          console.log('Degen Diamonds unlocked!')
          game.showDegenDiamondsButton()
        }
      },
      {
        id: 'unlock-snake',
        name: 'Unlock Snake',
        description: 'Unlocks access to the Snake game! A new button will appear on the main screen.',
        baseCost: 10,
        maxPurchases: 1,
        unlockRequirement: 'health-boost',
        icon: '🐍',
        effect: (game: any, _purchaseCount: number) => {
          console.log('Snake game unlocked!')
          game.showSnakeButton()
        }
      },
      {
        id: 'unlock-letter-game',
        name: 'Unlock Letter Game',
        description: 'Unlocks access to the Letter Game! A new button will appear on the main screen.',
        baseCost: 5,
        maxPurchases: 1,
        unlockRequirement: 'shorten-timer',
        icon: '/assets/lettergamelogo.png',
        effect: (game: any, _purchaseCount: number) => {
          console.log('Letter Game unlocked!')
          game.showLetterGameButton()
        }
      },
      {
        id: 'placeholder-upgrade-6',
        name: 'Placeholder Upgrade 6',
        description: 'This placeholder upgrade unlocks from Shorten Timer. Coming soon!',
        baseCost: 200,
        maxPurchases: 1,
        unlockRequirement: 'shorten-timer',
        icon: '🌟',
        effect: (_game: any, _purchaseCount: number) => {
          console.log('Placeholder upgrade 6 purchased!')
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

  createShop(): HTMLElement {
    const shop = document.createElement('div')
    shop.className = 'shop-container'
    shop.style.display = 'none'
    
    // Shop title
    const title = document.createElement('h2')
    title.className = 'shop-title'
    title.textContent = 'SKILL TREE'
    
    // Skill tree container
    const skillTree = document.createElement('div')
    skillTree.className = 'skill-tree'
    
    this.updateSkillTree(skillTree)
    
    // Back button
    const backButton = document.createElement('button')
    backButton.className = 'back-button'
    backButton.textContent = 'BACK'
    
    backButton.addEventListener('click', () => {
      this.closeShop()
    })
    
    shop.appendChild(title)
    shop.appendChild(skillTree)
    shop.appendChild(backButton)
    
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.appendChild(shop)
    
    this.shopElement = shop
    return shop
  }

  private updateSkillTree(skillTree: HTMLElement): void {
    skillTree.innerHTML = ''
    
    // Check if heal-on-purchase is bought to show second row
    const healPurchased = this.upgrades.get('heal-on-purchase')?.purchased || false
    
    // Check which tier 2 upgrades are purchased to show their respective tier 3 upgrades
    const boostPayoutPurchased = this.upgrades.get('boost-payout')?.purchased || false
    const healthBoostPurchased = this.upgrades.get('health-boost')?.purchased || false
    const shortenTimerPurchased = this.upgrades.get('shorten-timer')?.purchased || false
    const anyTier2Purchased = boostPayoutPurchased || healthBoostPurchased || shortenTimerPurchased
    
    if (anyTier2Purchased) {
      // Create third row with upgrades based on what's been unlocked
      const thirdRow = document.createElement('div')
      thirdRow.className = 'upgrade-row'
      thirdRow.style.gap = '40px' // Normal spacing for up to 6 upgrades
      
      const thirdRowUpgrades: string[] = []
      
      // Add upgrades based on what tier 2 upgrades have been purchased
      if (boostPayoutPurchased) {
        thirdRowUpgrades.push('placeholder-upgrade-1', 'placeholder-upgrade-2')
      }
      if (healthBoostPurchased) {
        thirdRowUpgrades.push('placeholder-upgrade-3', 'unlock-snake')
      }
      if (shortenTimerPurchased) {
        thirdRowUpgrades.push('unlock-letter-game', 'placeholder-upgrade-6')
      }
      
      thirdRowUpgrades.forEach(upgradeId => {
        const upgrade = this.upgradeDefinitions.find(u => u.id === upgradeId)
        if (upgrade) {
          const upgradeNode = this.createUpgradeNode(upgrade)
          thirdRow.appendChild(upgradeNode)
        }
      })
      
      skillTree.appendChild(thirdRow)
    }
    
    if (healPurchased) {
      // Create second row (3 upgrades)
      const secondRow = document.createElement('div')
      secondRow.className = 'upgrade-row'
      
      const secondRowUpgrades = ['boost-payout', 'health-boost', 'shorten-timer']
      secondRowUpgrades.forEach(upgradeId => {
        const upgrade = this.upgradeDefinitions.find(u => u.id === upgradeId)
        if (upgrade) {
          const upgradeNode = this.createUpgradeNode(upgrade)
          secondRow.appendChild(upgradeNode)
        }
      })
      
      skillTree.appendChild(secondRow)
      
      // Add connection lines
      this.createConnectionLines(skillTree, { boostPayoutPurchased, healthBoostPurchased, shortenTimerPurchased })
    }
    
    // Always show heal-on-purchase at bottom
    const healUpgrade = this.upgradeDefinitions.find(u => u.id === 'heal-on-purchase')
    if (healUpgrade) {
      const healNode = this.createUpgradeNode(healUpgrade)
      skillTree.appendChild(healNode)
    }
  }

  private createConnectionLines(skillTree: HTMLElement, tier2State: { boostPayoutPurchased: boolean, healthBoostPurchased: boolean, shortenTimerPurchased: boolean }): void {
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
      const healNode = skillTree.querySelector('[data-upgrade-id="heal-on-purchase"]') as HTMLElement
      const boostPayoutNode = skillTree.querySelector('[data-upgrade-id="boost-payout"]') as HTMLElement
      const healthBoostNode = skillTree.querySelector('[data-upgrade-id="health-boost"]') as HTMLElement
      const shortenTimerNode = skillTree.querySelector('[data-upgrade-id="shorten-timer"]') as HTMLElement
      
      if (!healNode || !boostPayoutNode || !healthBoostNode || !shortenTimerNode) return
      
      const skillTreeRect = skillTree.getBoundingClientRect()
      const healNodeRect = healNode.getBoundingClientRect()
      const boostPayoutRect = boostPayoutNode.getBoundingClientRect()
      const healthBoostRect = healthBoostNode.getBoundingClientRect()
      const shortenTimerRect = shortenTimerNode.getBoundingClientRect()
      
      // Calculate exact center positions for tier 2 to tier 1 connections
      const healCenterX = healNodeRect.left - skillTreeRect.left + healNodeRect.width / 2
      
      const tier2ToTier1Connections = [
        { 
          upgradeId: 'boost-payout', 
          startX: boostPayoutRect.left - skillTreeRect.left + boostPayoutRect.width / 2,
          startY: boostPayoutRect.top - skillTreeRect.top + boostPayoutRect.height,
          endX: healCenterX,
          endY: healNodeRect.top - skillTreeRect.top
        },
        { 
          upgradeId: 'health-boost', 
          startX: healthBoostRect.left - skillTreeRect.left + healthBoostRect.width / 2,
          startY: healthBoostRect.top - skillTreeRect.top + healthBoostRect.height,
          endX: healCenterX,
          endY: healNodeRect.top - skillTreeRect.top
        },
        { 
          upgradeId: 'shorten-timer', 
          startX: shortenTimerRect.left - skillTreeRect.left + shortenTimerRect.width / 2,
          startY: shortenTimerRect.top - skillTreeRect.top + shortenTimerRect.height,
          endX: healCenterX,
          endY: healNodeRect.top - skillTreeRect.top
        }
      ]
      
      // Draw tier 2 to tier 1 connections
      tier2ToTier1Connections.forEach(connection => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        
        const pathData = `M ${connection.startX} ${connection.startY} L ${connection.endX} ${connection.endY}`
        path.setAttribute('d', pathData)
        path.setAttribute('stroke-width', '2')
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke-dasharray', '5,5')
        path.dataset.upgradeId = connection.upgradeId
        
        // Set line color based on upgrade status
        const upgradeState = this.upgrades.get(connection.upgradeId)
        if (upgradeState?.maxed) {
          path.setAttribute('stroke', '#00ff88')
          path.removeAttribute('stroke-dasharray')
        } else if (upgradeState?.purchased) {
          path.setAttribute('stroke', '#4a90e2')
          // Keep dotted for purchased but not maxed
        } else {
          path.setAttribute('stroke', '#666666')
        }
        
        svg.appendChild(path)
      })
      
      // Add connections from tier 2 to tier 3 for each purchased tier 2 upgrade
      const anyTier2Purchased = tier2State.boostPayoutPurchased || tier2State.healthBoostPurchased || tier2State.shortenTimerPurchased
      
      if (anyTier2Purchased) {
        const tier2ToTier3Connections: any[] = []
        
        // Boost Payout connections
        if (tier2State.boostPayoutPurchased) {
          const placeholder1Node = skillTree.querySelector('[data-upgrade-id="placeholder-upgrade-1"]') as HTMLElement
          const placeholder2Node = skillTree.querySelector('[data-upgrade-id="placeholder-upgrade-2"]') as HTMLElement
          
          if (placeholder1Node && placeholder2Node) {
            const placeholder1Rect = placeholder1Node.getBoundingClientRect()
            const placeholder2Rect = placeholder2Node.getBoundingClientRect()
            
            tier2ToTier3Connections.push(
              {
                parentUpgradeId: 'boost-payout',
                childUpgradeId: 'placeholder-upgrade-1',
                startX: boostPayoutRect.left - skillTreeRect.left + boostPayoutRect.width / 2,
                startY: boostPayoutRect.top - skillTreeRect.top,
                endX: placeholder1Rect.left - skillTreeRect.left + placeholder1Rect.width / 2,
                endY: placeholder1Rect.top - skillTreeRect.top + placeholder1Rect.height
              },
              {
                parentUpgradeId: 'boost-payout',
                childUpgradeId: 'placeholder-upgrade-2',
                startX: boostPayoutRect.left - skillTreeRect.left + boostPayoutRect.width / 2,
                startY: boostPayoutRect.top - skillTreeRect.top,
                endX: placeholder2Rect.left - skillTreeRect.left + placeholder2Rect.width / 2,
                endY: placeholder2Rect.top - skillTreeRect.top + placeholder2Rect.height
              }
            )
          }
        }
        
        // Health Boost connections
        if (tier2State.healthBoostPurchased) {
          const placeholder3Node = skillTree.querySelector('[data-upgrade-id="placeholder-upgrade-3"]') as HTMLElement
          const unlockSnakeNode = skillTree.querySelector('[data-upgrade-id="unlock-snake"]') as HTMLElement
          
                      if (placeholder3Node && unlockSnakeNode) {
              const placeholder3Rect = placeholder3Node.getBoundingClientRect()
              const unlockSnakeRect = unlockSnakeNode.getBoundingClientRect()
            
            tier2ToTier3Connections.push(
              {
                parentUpgradeId: 'health-boost',
                childUpgradeId: 'placeholder-upgrade-3',
                startX: healthBoostRect.left - skillTreeRect.left + healthBoostRect.width / 2,
                startY: healthBoostRect.top - skillTreeRect.top,
                endX: placeholder3Rect.left - skillTreeRect.left + placeholder3Rect.width / 2,
                endY: placeholder3Rect.top - skillTreeRect.top + placeholder3Rect.height
              },
              {
                parentUpgradeId: 'health-boost',
                childUpgradeId: 'unlock-snake',
                startX: healthBoostRect.left - skillTreeRect.left + healthBoostRect.width / 2,
                startY: healthBoostRect.top - skillTreeRect.top,
                endX: unlockSnakeRect.left - skillTreeRect.left + unlockSnakeRect.width / 2,
                endY: unlockSnakeRect.top - skillTreeRect.top + unlockSnakeRect.height
              }
            )
          }
        }
        
        // Shorten Timer connections
        if (tier2State.shortenTimerPurchased) {
          const letterGameNode = skillTree.querySelector('[data-upgrade-id="unlock-letter-game"]') as HTMLElement
          const placeholder6Node = skillTree.querySelector('[data-upgrade-id="placeholder-upgrade-6"]') as HTMLElement
          
          if (letterGameNode && placeholder6Node) {
            const letterGameRect = letterGameNode.getBoundingClientRect()
            const placeholder6Rect = placeholder6Node.getBoundingClientRect()
            
            tier2ToTier3Connections.push(
              {
                parentUpgradeId: 'shorten-timer',
                childUpgradeId: 'unlock-letter-game',
                startX: shortenTimerRect.left - skillTreeRect.left + shortenTimerRect.width / 2,
                startY: shortenTimerRect.top - skillTreeRect.top,
                endX: letterGameRect.left - skillTreeRect.left + letterGameRect.width / 2,
                endY: letterGameRect.top - skillTreeRect.top + letterGameRect.height
              },
              {
                parentUpgradeId: 'shorten-timer',
                childUpgradeId: 'placeholder-upgrade-6',
                startX: shortenTimerRect.left - skillTreeRect.left + shortenTimerRect.width / 2,
                startY: shortenTimerRect.top - skillTreeRect.top,
                endX: placeholder6Rect.left - skillTreeRect.left + placeholder6Rect.width / 2,
                endY: placeholder6Rect.top - skillTreeRect.top + placeholder6Rect.height
              }
            )
          }
        }
        
        // Draw all tier 2 to tier 3 connections
        tier2ToTier3Connections.forEach(connection => {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
          
          const pathData = `M ${connection.startX} ${connection.startY} L ${connection.endX} ${connection.endY}`
          path.setAttribute('d', pathData)
          path.setAttribute('stroke-width', '2')
          path.setAttribute('fill', 'none')
          path.setAttribute('stroke-dasharray', '5,5')
          
          // Set line color based on the minimum status between parent and child
          const parentUpgradeId = connection.parentUpgradeId
          const childUpgradeId = connection.childUpgradeId
          const parentUpgradeState = this.upgrades.get(parentUpgradeId)
          const childUpgradeState = this.upgrades.get(childUpgradeId)
          
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
      }
      
      skillTree.appendChild(svg)
    }, 10)
  }

  private createUpgradeNode(upgrade: UpgradeDefinition): HTMLElement {
    const upgradeState = this.upgrades.get(upgrade.id)!
    const upgradeNode = document.createElement('div')
    upgradeNode.className = 'upgrade-node'
    upgradeNode.dataset.upgradeId = upgrade.id
    
    const upgradeIcon = document.createElement('div')
    upgradeIcon.className = 'upgrade-icon'
    
    // Check if icon is an image path or emoji
    if (upgrade.icon.includes('/')) {
      const iconImg = document.createElement('img')
      iconImg.src = upgrade.icon
      iconImg.style.width = '32px'
      iconImg.style.height = '32px'
      iconImg.style.objectFit = 'contain'
      upgradeIcon.appendChild(iconImg)
    } else {
      upgradeIcon.textContent = upgrade.icon
    }
    
    const upgradePrice = document.createElement('div')
    upgradePrice.className = 'upgrade-price'
    
    // Calculate current price
    const currentPrice = this.getCurrentPrice(upgrade, upgradeState.purchaseCount)
    upgradePrice.textContent = `$${currentPrice}`
    
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
      if (upgrade.id === 'boost-payout' || upgrade.id === 'health-boost' || upgrade.id === 'shorten-timer') {
        upgradeNode.classList.add('purchased-blue')
      } else {
        upgradeNode.classList.add('purchased')
      }
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

  private getCurrentPrice(upgrade: UpgradeDefinition, purchaseCount: number): number {
    if (!upgrade.priceMultiplier) {
      return upgrade.baseCost
    }
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.priceMultiplier, purchaseCount))
  }

  purchaseUpgrade(upgradeId: string): boolean {
    const upgrade = this.upgradeDefinitions.find(u => u.id === upgradeId)
    const upgradeState = this.upgrades.get(upgradeId)
    
    if (!upgrade || !upgradeState) return false
    
    // Check if maxed out
    if (upgradeState.purchaseCount >= upgrade.maxPurchases) return false
    
    const currentPrice = this.getCurrentPrice(upgrade, upgradeState.purchaseCount)
    
    if (this.gameInstance.getMoney() >= currentPrice) {
      // Deduct money
      this.gameInstance.spendMoney(currentPrice)
      
      // Update state
      upgradeState.purchaseCount++
      upgradeState.purchased = true
      upgradeState.maxed = upgradeState.purchaseCount >= upgrade.maxPurchases
      
      // Apply upgrade effect
      upgrade.effect(this.gameInstance, upgradeState.purchaseCount)
      
      // Check if player has heal-on-purchase and trigger heal for any purchase
      const healUpgrade = this.upgrades.get('heal-on-purchase')
      if (healUpgrade?.purchased) {
        this.gameInstance.healCubeToFull()
      }
      
      // Update the skill tree display
      const skillTree = this.shopElement.querySelector('.skill-tree') as HTMLElement
      this.updateSkillTree(skillTree)
      
      console.log(`Purchased upgrade: ${upgradeId} (${upgradeState.purchaseCount}/${upgrade.maxPurchases})`)
      return true
    }
    return false
  }

  openShop(): void {
    const elements = this.ui.getElements()
    if (elements.gameView) {
      elements.gameView.style.display = 'none'
    }
    
    // Refresh all currency displays to ensure they're visible on this screen
    this.gameInstance.refreshAllCurrencyDisplays()
    
    // Explicitly show and position all currency elements for this screen
    this.ensureCurrencyElementsVisible()
    
    this.shopElement.style.display = 'block'
    this.gameInstance.setShopState(true)
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

  closeShop(): void {
    this.shopElement.style.display = 'none'
    const elements = this.ui.getElements()
    if (elements.gameView) {
      elements.gameView.style.display = 'block'
    }
    this.gameInstance.setShopState(false)
  }

  hasUpgrade(upgradeId: string): boolean {
    return this.upgrades.get(upgradeId)?.purchased || false
  }

  getUpgrades(): Map<string, UpgradeState> {
    return this.upgrades
  }
} 