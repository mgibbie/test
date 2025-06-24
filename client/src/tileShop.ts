import { UIManager } from './ui'

interface UpgradeDefinition {
  id: string
  name: string
  description: string
  baseCost: number
  maxPurchases: number
  unlockRequirement?: string
  priceMultiplier?: number
  icon: string
  effect: (game: any, purchaseCount: number) => void
}

interface UpgradeState {
  purchased: boolean
  purchaseCount: number
  maxed: boolean
}

export class TileShopManager {
  private ui: UIManager
  private gameInstance: any
  private tileShopElement: HTMLElement | null = null
  private tileUpgrades: Map<string, UpgradeState> = new Map()
  private tileUpgradeDefinitions: UpgradeDefinition[] = []

  constructor(ui: UIManager, gameInstance: any) {
    this.ui = ui
    this.gameInstance = gameInstance
    this.initializeTileUpgrades()
  }

  private initializeTileUpgrades(): void {
    this.tileUpgradeDefinitions = [
      {
        id: 'trash-bucket',
        name: 'Trash Bucket',
        description: 'Unlocks the Discard Zone! Drag tiles here to discard them and get new ones.',
        baseCost: 100,
        maxPurchases: 1,
        icon: '🗑️',
        effect: (game: any, _purchaseCount: number) => {
          console.log('Trash Bucket unlocked!')
          game.unlockDiscardZone()
        }
      }
    ]

    // Initialize upgrade states
    this.tileUpgradeDefinitions.forEach(upgrade => {
      this.tileUpgrades.set(upgrade.id, {
        purchased: false,
        purchaseCount: 0,
        maxed: false
      })
    })
  }

  createTileShop(): HTMLElement {
    const tileShop = document.createElement('div')
    tileShop.className = 'tile-shop-container'
    tileShop.style.display = 'none'
    
    // Shop title
    const title = document.createElement('h2')
    title.className = 'tile-shop-title'
    title.textContent = '🟦 TILE SHOP 🟦'
    
    // Tile tree container - use same class as regular shop
    const tileTree = document.createElement('div')
    tileTree.className = 'skill-tree'
    
    this.updateTileSkillTree(tileTree)
    
    // Back button
    const backButton = document.createElement('button')
    backButton.className = 'back-button'
    backButton.textContent = 'BACK'
    
    backButton.addEventListener('click', () => {
      this.closeTileShop()
    })
    
    tileShop.appendChild(title)
    tileShop.appendChild(tileTree)
    tileShop.appendChild(backButton)
    
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.appendChild(tileShop)
    
    this.tileShopElement = tileShop
    return tileShop
  }

  private updateTileSkillTree(tileTree: HTMLElement): void {
    // Clean up any existing tooltips before recreating the DOM
    this.cleanupAllTooltips()
    
    tileTree.innerHTML = ''
    
    // Create the same structure as regular shop - single row for now
    const upgradeRow = document.createElement('div')
    upgradeRow.className = 'upgrade-row'
    
    this.tileUpgradeDefinitions.forEach(upgrade => {
      const upgradeNode = this.createTileUpgradeNode(upgrade)
      upgradeRow.appendChild(upgradeNode)
    })
    
    tileTree.appendChild(upgradeRow)
  }

  private cleanupAllTooltips(): void {
    // Hide the shared UI tooltip when switching between shops
    this.ui.hideTooltip()
  }

  private createTileUpgradeNode(upgrade: UpgradeDefinition): HTMLElement {
    const upgradeState = this.tileUpgrades.get(upgrade.id)!
    const isUnlocked = this.isTileUpgradeUnlocked(upgrade)
    const canAfford = this.gameInstance.getTiles() >= this.getCurrentTilePrice(upgrade, upgradeState.purchaseCount)
    const isMaxed = upgradeState.purchaseCount >= upgrade.maxPurchases
    
    const node = document.createElement('div')
    node.className = 'upgrade-node'
    
    if (upgradeState.purchased || isMaxed) {
      node.classList.add('purchased')
    }
    
    // Icon
    const icon = document.createElement('div')
    icon.className = 'upgrade-icon'
    icon.textContent = upgrade.icon
    
    // Purchase count (if applicable)
    if (upgrade.maxPurchases > 1) {
      const purchaseCount = document.createElement('div')
      purchaseCount.className = 'purchase-count'
      purchaseCount.textContent = `${upgradeState.purchaseCount}/${upgrade.maxPurchases}`
      node.appendChild(purchaseCount)
    }
    
    node.appendChild(icon)
    
    // Price
    const price = document.createElement('div')
    price.className = 'upgrade-price'
    
    if (isMaxed) {
      price.textContent = 'MAXED'
    } else {
      const currentPrice = this.getCurrentTilePrice(upgrade, upgradeState.purchaseCount)
      price.textContent = `🟦${currentPrice}`
    }
    
    node.appendChild(price)
    
    // Add tooltip functionality using UI manager (same as regular shop)
    node.addEventListener('mouseenter', (e) => {
      this.ui.showTooltip(e, upgrade.name, upgrade.description)
    })
    
    node.addEventListener('mouseleave', () => {
      this.ui.hideTooltip()
    })
    
    node.addEventListener('mousemove', (e) => {
      this.ui.updateTooltipPosition(e)
    })
    
    // Click handler
    if (isUnlocked && canAfford && !isMaxed) {
      node.style.cursor = 'pointer'
      node.addEventListener('click', () => {
        this.purchaseTileUpgrade(upgrade.id)
      })
    }
    
    return node
  }

  private isTileUpgradeUnlocked(upgrade: UpgradeDefinition): boolean {
    if (!upgrade.unlockRequirement) return true
    
    const requirement = this.tileUpgrades.get(upgrade.unlockRequirement)
    return requirement?.purchased || false
  }

  private getCurrentTilePrice(upgrade: UpgradeDefinition, purchaseCount: number): number {
    if (!upgrade.priceMultiplier) return upgrade.baseCost
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.priceMultiplier, purchaseCount))
  }

  purchaseTileUpgrade(upgradeId: string): boolean {
    const upgrade = this.tileUpgradeDefinitions.find(u => u.id === upgradeId)
    const upgradeState = this.tileUpgrades.get(upgradeId)
    
    if (!upgrade || !upgradeState) return false
    
    const isUnlocked = this.isTileUpgradeUnlocked(upgrade)
    const currentPrice = this.getCurrentTilePrice(upgrade, upgradeState.purchaseCount)
    const canAfford = this.gameInstance.getTiles() >= currentPrice
    const isMaxed = upgradeState.purchaseCount >= upgrade.maxPurchases
    
    if (!isUnlocked || !canAfford || isMaxed) return false
    
    // Spend tiles
    if (!this.gameInstance.spendTiles(currentPrice)) return false
    
    // Update state
    upgradeState.purchaseCount++
    upgradeState.purchased = true
    upgradeState.maxed = upgradeState.purchaseCount >= upgrade.maxPurchases
    
    // Apply effect
    upgrade.effect(this.gameInstance, upgradeState.purchaseCount)
    
    // Check if player has heal-on-purchase and trigger heal for any purchase
    if (this.gameInstance.hasHealOnPurchase()) {
      this.gameInstance.healCubeToFull()
    }
    
    // Update UI
    const skillTree = this.tileShopElement?.querySelector('.skill-tree')
    if (skillTree) {
      this.updateTileSkillTree(skillTree as HTMLElement)
    }
    
    console.log(`Purchased tile upgrade: ${upgrade.name} for 🟦${currentPrice}`)
    return true
  }

  openTileShop(): void {
    // Clean up any stuck tooltips first
    this.cleanupAllTooltips()
    
    if (!this.tileShopElement) {
      this.createTileShop()
    }
    
    // Update the shop display
    const skillTree = this.tileShopElement?.querySelector('.skill-tree')
    if (skillTree) {
      this.updateTileSkillTree(skillTree as HTMLElement)
    }
    
    // Hide other UI elements
    const elements = this.ui.getElements()
    if (elements.gameView) {
      elements.gameView.style.display = 'none'
    }
    
    // Refresh all currency displays to ensure they're visible on this screen
    this.gameInstance.refreshAllCurrencyDisplays()
    
    // Explicitly show and position all currency elements for this screen
    this.ensureCurrencyElementsVisible()
    
    // Show tile shop
    if (this.tileShopElement) {
      this.tileShopElement.style.display = 'block'
    }
    this.gameInstance.setTileShopState(true)
    
    console.log('Opened Tile Shop')
  }

  closeTileShop(): void {
    // Clean up any stuck tooltips when closing
    this.cleanupAllTooltips()
    
    if (this.tileShopElement) {
      this.tileShopElement.style.display = 'none'
    }
    
    this.gameInstance.setTileShopState(false)
    
    // Return to letter game launch screen instead of main game
    this.gameInstance.returnToLetterGameLaunch()
    
    console.log('Closed Tile Shop')
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
    return this.tileUpgrades.get(upgradeId)?.purchased || false
  }

  getTileUpgrades(): Map<string, UpgradeState> {
    return this.tileUpgrades
  }
} 