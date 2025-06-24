import { UpgradeDefinition, UpgradeState } from './types'
import { UIManager } from './ui'

export class DiamondShopManager {
  private diamondShopElement!: HTMLElement
  private diamondUpgrades: Map<string, UpgradeState> = new Map()
  private diamondUpgradeDefinitions: UpgradeDefinition[] = []
  private ui: UIManager
  private gameInstance: any

  constructor(ui: UIManager, gameInstance: any) {
    this.ui = ui
    this.gameInstance = gameInstance
    this.initializeDiamondUpgrades()
  }

  private initializeDiamondUpgrades(): void {
    this.diamondUpgradeDefinitions = [
      {
        id: 'bomb-slider',
        name: 'Bomb Slider',
        description: 'Unlocks the bomb slider feature, allowing you to control explosive mining operations.',
        baseCost: 5,
        maxPurchases: 1,
        icon: '💣',
        effect: (game: any) => {
          console.log('Bomb slider unlocked!')
          game.unlockBombSlider()
        }
      }
    ]

    // Initialize upgrade states
    this.diamondUpgradeDefinitions.forEach(upgrade => {
      this.diamondUpgrades.set(upgrade.id, {
        purchased: false,
        purchaseCount: 0,
        maxed: false
      })
    })
  }

  createDiamondShop(): HTMLElement {
    const diamondShop = document.createElement('div')
    diamondShop.className = 'diamond-shop-container'
    diamondShop.style.display = 'none'
    
    // Shop title
    const title = document.createElement('h2')
    title.className = 'diamond-shop-title'
    title.textContent = '💎 DIAMOND SHOP 💎'
    
    // Diamond tree container - use same class as regular shop
    const diamondTree = document.createElement('div')
    diamondTree.className = 'skill-tree'
    
    this.updateDiamondSkillTree(diamondTree)
    
    // Back button
    const backButton = document.createElement('button')
    backButton.className = 'back-button'
    backButton.textContent = 'BACK'
    
    backButton.addEventListener('click', () => {
      this.closeDiamondShop()
    })
    
    diamondShop.appendChild(title)
    diamondShop.appendChild(diamondTree)
    diamondShop.appendChild(backButton)
    
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.appendChild(diamondShop)
    
    this.diamondShopElement = diamondShop
    return diamondShop
  }

  private cleanupAllTooltips(): void {
    // Hide the shared UI tooltip when switching between shops
    this.ui.hideTooltip()
  }

  private updateDiamondSkillTree(diamondTree: HTMLElement): void {
    // Clean up any existing tooltips before recreating the DOM
    this.cleanupAllTooltips()
    
    diamondTree.innerHTML = ''
    
    // Create the same structure as regular shop - single row for now
    const upgradeRow = document.createElement('div')
    upgradeRow.className = 'upgrade-row'
    
    this.diamondUpgradeDefinitions.forEach(upgrade => {
      const upgradeNode = this.createDiamondUpgradeNode(upgrade)
      upgradeRow.appendChild(upgradeNode)
    })
    
    diamondTree.appendChild(upgradeRow)
  }

  private createDiamondUpgradeNode(upgrade: UpgradeDefinition): HTMLElement {
    const upgradeState = this.diamondUpgrades.get(upgrade.id)!
    const isUnlocked = this.isDiamondUpgradeUnlocked(upgrade)
    const canAfford = this.gameInstance.getDiamonds() >= this.getCurrentDiamondPrice(upgrade, upgradeState.purchaseCount)
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
      const currentPrice = this.getCurrentDiamondPrice(upgrade, upgradeState.purchaseCount)
      price.textContent = `💎${currentPrice}`
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
        this.purchaseDiamondUpgrade(upgrade.id)
      })
    }
    
    return node
  }

  private isDiamondUpgradeUnlocked(upgrade: UpgradeDefinition): boolean {
    if (!upgrade.unlockRequirement) return true
    
    const requirement = this.diamondUpgrades.get(upgrade.unlockRequirement)
    return requirement?.purchased || false
  }

  private getCurrentDiamondPrice(upgrade: UpgradeDefinition, purchaseCount: number): number {
    if (!upgrade.priceMultiplier) return upgrade.baseCost
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.priceMultiplier, purchaseCount))
  }

  purchaseDiamondUpgrade(upgradeId: string): boolean {
    const upgrade = this.diamondUpgradeDefinitions.find(u => u.id === upgradeId)
    const upgradeState = this.diamondUpgrades.get(upgradeId)
    
    if (!upgrade || !upgradeState) return false
    
    const isUnlocked = this.isDiamondUpgradeUnlocked(upgrade)
    const currentPrice = this.getCurrentDiamondPrice(upgrade, upgradeState.purchaseCount)
    const canAfford = this.gameInstance.getDiamonds() >= currentPrice
    const isMaxed = upgradeState.purchaseCount >= upgrade.maxPurchases
    
    if (!isUnlocked || !canAfford || isMaxed) return false
    
    // Spend diamonds
    if (!this.gameInstance.spendDiamonds(currentPrice)) return false
    
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
    this.updateDiamondSkillTree(this.diamondShopElement.querySelector('.skill-tree')!)
    
    console.log(`Purchased diamond upgrade: ${upgrade.name} for 💎${currentPrice}`)
    return true
  }

  openDiamondShop(): void {
    // Clean up any stuck tooltips first
    this.cleanupAllTooltips()
    
    if (!this.diamondShopElement) {
      this.createDiamondShop()
    }
    
    // Update the shop display
    this.updateDiamondSkillTree(this.diamondShopElement.querySelector('.skill-tree')!)
    
    // Hide other UI elements
    const elements = this.ui.getElements()
    if (elements.gameView) {
      elements.gameView.style.display = 'none'
    }
    
    // Refresh all currency displays to ensure they're visible on this screen
    this.gameInstance.refreshAllCurrencyDisplays()
    
    // Explicitly show and position all currency elements for this screen
    this.ensureCurrencyElementsVisible()
    
    // Hide degen diamonds scene if it's open
    this.gameInstance.closeDegenDiamonds()
    
    // Show diamond shop
    this.diamondShopElement.style.display = 'block'
    this.gameInstance.setDiamondShopState(true)
    
    console.log('Opened Diamond Shop')
  }

  closeDiamondShop(): void {
    // Clean up any stuck tooltips when closing
    this.cleanupAllTooltips()
    
    if (this.diamondShopElement) {
      this.diamondShopElement.style.display = 'none'
    }
    
    const elements = this.ui.getElements()
    if (elements.gameView) {
      elements.gameView.style.display = 'block'
    }
    
    this.gameInstance.setDiamondShopState(false)
    
    // Return to degen diamonds scene
    this.gameInstance.openDegenDiamonds()
    
    console.log('Closed Diamond Shop')
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
    return this.diamondUpgrades.get(upgradeId)?.purchased || false
  }

  getDiamondUpgrades(): Map<string, UpgradeState> {
    return this.diamondUpgrades
  }
} 