import { UIElements } from './types'

export class UIManager {
  private elements: Partial<UIElements> = {}
  private tooltipElement: HTMLElement | null = null
  private currentHealth: number = 10
  private maxHealth: number = 10

  createSplashScreen(): HTMLElement {
    const app = document.querySelector<HTMLDivElement>('#app')!
    
    const splashScreen = document.createElement('div')
    splashScreen.className = 'splash-screen'
    
    const title = document.createElement('h1')
    title.className = 'title'
    title.textContent = 'MIKECREMENTAL'
    
    const startButton = document.createElement('button')
    startButton.className = 'start-button'
    startButton.textContent = 'Start Game'
    
    splashScreen.appendChild(title)
    splashScreen.appendChild(startButton)
    app.appendChild(splashScreen)
    
    return splashScreen
  }

  createGameView(): HTMLElement {
    const app = document.querySelector<HTMLDivElement>('#app')!
    const gameView = document.createElement('div')
    gameView.className = 'game-view'
    app.appendChild(gameView)
    this.elements.gameView = gameView
    return gameView
  }

  createMoneyCounter(): HTMLElement {
    const moneyCounter = document.createElement('div')
    moneyCounter.className = 'money-counter'
    moneyCounter.textContent = '$0'
    
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.appendChild(moneyCounter)
    
    this.elements.moneyCounter = moneyCounter
    return moneyCounter
  }

  createDiamondsCounter(): HTMLElement {
    const diamondsCounter = document.createElement('div')
    diamondsCounter.className = 'diamonds-counter'
    diamondsCounter.textContent = '💎 0'
    diamondsCounter.style.display = 'none' // Initially hidden
    
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.appendChild(diamondsCounter)
    
    this.elements.diamondsCounter = diamondsCounter
    return diamondsCounter
  }

  createEmeraldsCounter(): HTMLElement {
    const emeraldsCounter = document.createElement('div')
    emeraldsCounter.className = 'emeralds-counter'
    emeraldsCounter.style.display = 'none' // Initially hidden
    
    // Create emerald icon
    const emeraldIcon = document.createElement('img')
    emeraldIcon.src = '/assets/emerald.png'
    emeraldIcon.className = 'emerald-icon'
    emeraldIcon.style.width = '20px'
    emeraldIcon.style.height = '20px'
    emeraldIcon.style.marginRight = '5px'
    emeraldIcon.style.verticalAlign = 'middle'
    
    const countText = document.createElement('span')
    countText.textContent = '0'
    
    emeraldsCounter.appendChild(emeraldIcon)
    emeraldsCounter.appendChild(countText)
    
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.appendChild(emeraldsCounter)
    
    this.elements.emeraldsCounter = emeraldsCounter
    return emeraldsCounter
  }

  createSapphiresCounter(): HTMLElement {
    const sapphiresCounter = document.createElement('div')
    sapphiresCounter.className = 'sapphires-counter'
    sapphiresCounter.style.display = 'none' // Initially hidden
    
    // Create sapphire icon
    const sapphireIcon = document.createElement('img')
    sapphireIcon.src = '/assets/sapphire.png'
    sapphireIcon.className = 'sapphire-icon'
    sapphireIcon.style.width = '20px'
    sapphireIcon.style.height = '20px'
    sapphireIcon.style.marginRight = '5px'
    sapphireIcon.style.verticalAlign = 'middle'
    
    const countText = document.createElement('span')
    countText.textContent = '0'
    
    sapphiresCounter.appendChild(sapphireIcon)
    sapphiresCounter.appendChild(countText)
    
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.appendChild(sapphiresCounter)
    
    this.elements.sapphiresCounter = sapphiresCounter
    return sapphiresCounter
  }

  createSpadesCounter(): HTMLElement {
    const spadesCounter = document.createElement('div')
    spadesCounter.className = 'spades-counter'
    spadesCounter.textContent = '♠️ 0'
    spadesCounter.style.display = 'none' // Initially hidden
    
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.appendChild(spadesCounter)
    
    this.elements.spadesCounter = spadesCounter
    return spadesCounter
  }

  createTilesCounter(): HTMLElement {
    const tilesCounter = document.createElement('div')
    tilesCounter.className = 'tiles-counter'
    tilesCounter.textContent = '🟦 0'
    tilesCounter.style.display = 'none' // Initially hidden
    
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.appendChild(tilesCounter)
    
    this.elements.tilesCounter = tilesCounter
    return tilesCounter
  }

  createHealthBar(): { container: HTMLElement; fill: HTMLElement } {
    const healthBarContainer = document.createElement('div')
    healthBarContainer.className = 'health-bar-container'
    
    const healthBarBackground = document.createElement('div')
    healthBarBackground.className = 'health-bar-background'
    
    const healthBarFill = document.createElement('div')
    healthBarFill.className = 'health-bar-fill'
    
    const healthLabel = document.createElement('div')
    healthLabel.className = 'health-label'
    healthLabel.textContent = 'HEALTH'
    
    healthBarBackground.appendChild(healthBarFill)
    healthBarContainer.appendChild(healthLabel)
    healthBarContainer.appendChild(healthBarBackground)
    
    // Add hover events to show health tooltip
    healthBarContainer.addEventListener('mouseenter', (e) => {
      this.showHealthTooltip(e)
    })
    
    healthBarContainer.addEventListener('mouseleave', () => {
      this.hideTooltip()
    })
    
    healthBarContainer.addEventListener('mousemove', (e) => {
      this.updateTooltipPosition(e)
    })
    
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.appendChild(healthBarContainer)
    
    this.elements.healthBarContainer = healthBarContainer
    this.elements.healthBarFill = healthBarFill
    return { container: healthBarContainer, fill: healthBarFill }
  }

  createTimer(): HTMLElement {
    const timer = document.createElement('div')
    timer.className = 'cooldown-timer'
    timer.textContent = '1:00'
    timer.style.display = 'none'
    
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.appendChild(timer)
    
    this.elements.timerElement = timer
    return timer
  }

  createShopButton(onClick: () => void): HTMLElement {
    console.log('🛒 Creating shop button...')
    const shopButton = document.createElement('button')
    shopButton.className = 'shop-button'
    shopButton.textContent = 'SHOP'
    shopButton.style.display = 'none'
    
    // Simple, reliable click handler
    const handleClick = (e: Event) => {
      console.log('🛒 Shop button activated!')
      e.preventDefault()
      e.stopPropagation()
      
      try {
        onClick()
        console.log('🛒 Shop onClick callback executed successfully')
      } catch (error) {
        console.error('🛒 Error in shop onClick callback:', error)
      }
    }
    
    // Add the click event
    shopButton.addEventListener('click', handleClick)
    
    // For mobile devices, also add touchstart as a backup
    shopButton.addEventListener('touchstart', (e) => {
      console.log('🛒 Shop button touch detected')
      e.preventDefault()
      e.stopPropagation()
      
      // Add a small delay to prevent double-firing
      setTimeout(() => {
        handleClick(e)
      }, 50)
    })
    
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.appendChild(shopButton)
    
    this.elements.shopButton = shopButton
    console.log('🛒 Shop button created and added to DOM with class:', shopButton.className)
    return shopButton
  }

  createDegenDiamondsButton(onClick: () => void): HTMLElement {
    const degenButton = document.createElement('button')
    degenButton.className = 'degen-diamonds-button'
    degenButton.textContent = 'DEGEN DIAMONDS'
    
    degenButton.addEventListener('click', onClick)
    
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.appendChild(degenButton)
    
    return degenButton
  }

  createLetterGameButton(onClick: () => void): HTMLElement {
    console.log('🔘 Creating Letter Game button...')
    const letterButton = document.createElement('button')
    letterButton.className = 'letter-game-button'
    letterButton.textContent = 'LETTER GAME'
    
    letterButton.addEventListener('click', () => {
      console.log('🖱️ Letter Game button clicked!')
      onClick()
    })
    
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.appendChild(letterButton)
    
    console.log('✅ Letter Game button created and added to app')
    return letterButton
  }

  createTileShopButton(onClick: () => void): HTMLElement {
    const tileShopButton = document.createElement('button')
    tileShopButton.className = 'tile-shop-button'
    tileShopButton.textContent = 'TILE SHOP'
    
    tileShopButton.addEventListener('click', onClick)
    
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.appendChild(tileShopButton)
    
    return tileShopButton
  }

  createSnakeButton(onClick: () => void): HTMLElement {
    const snakeButton = document.createElement('button')
    snakeButton.className = 'snake-button'
    snakeButton.textContent = 'SNAKE'
    
    snakeButton.addEventListener('click', onClick)
    
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.appendChild(snakeButton)
    
    return snakeButton
  }

  createTetrisButton(onClick: () => void): HTMLElement {
    const tetrisButton = document.createElement('button')
    tetrisButton.className = 'tetris-button'
    tetrisButton.textContent = 'TETRIS'
    
    tetrisButton.addEventListener('click', onClick)
    
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.appendChild(tetrisButton)
    
    return tetrisButton
  }

  createBalatroButton(onClick: () => void): HTMLElement {
    const balatroButton = document.createElement('button')
    balatroButton.className = 'balatro-button'
    balatroButton.textContent = 'BALATRO'
    
    balatroButton.addEventListener('click', onClick)
    
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.appendChild(balatroButton)
    
    return balatroButton
  }

  createTooltip(): HTMLElement {
    const tooltip = document.createElement('div')
    tooltip.className = 'tooltip'
    tooltip.style.display = 'none'
    
    const tooltipTitle = document.createElement('div')
    tooltipTitle.className = 'tooltip-title'
    
    const tooltipDescription = document.createElement('div')
    tooltipDescription.className = 'tooltip-description'
    
    tooltip.appendChild(tooltipTitle)
    tooltip.appendChild(tooltipDescription)
    
    document.body.appendChild(tooltip)
    this.tooltipElement = tooltip
    return tooltip
  }

  updateMoneyCounter(money: number): void {
    // Create money counter if it doesn't exist
    if (!this.elements.moneyCounter) {
      this.createMoneyCounter()
    }
    
    if (this.elements.moneyCounter) {
      this.elements.moneyCounter.textContent = `$${money}`
      // Money counter should always be visible
      this.elements.moneyCounter.style.display = 'block'
    }
  }

  updateDiamondsCounter(diamonds: number): void {
    // Create diamonds counter if it doesn't exist
    if (!this.elements.diamondsCounter) {
      this.createDiamondsCounter()
    }
    
    if (this.elements.diamondsCounter) {
      this.elements.diamondsCounter.textContent = `💎 ${diamonds}`
      // Only show if player has diamonds
      this.elements.diamondsCounter.style.display = diamonds > 0 ? 'block' : 'none'
    }
  }

  updateEmeraldsCounter(emeralds: number): void {
    // Create emeralds counter if it doesn't exist
    if (!this.elements.emeraldsCounter) {
      this.createEmeraldsCounter()
    }
    
    if (this.elements.emeraldsCounter) {
      const countText = this.elements.emeraldsCounter.querySelector('span')
      if (countText) {
        countText.textContent = emeralds.toString()
      }
      // Only show if player has emeralds
      this.elements.emeraldsCounter.style.display = emeralds > 0 ? 'block' : 'none'
    }
  }

  updateSapphiresCounter(sapphires: number): void {
    // Create sapphires counter if it doesn't exist
    if (!this.elements.sapphiresCounter) {
      this.createSapphiresCounter()
    }
    
    if (this.elements.sapphiresCounter) {
      const countText = this.elements.sapphiresCounter.querySelector('span')
      if (countText) {
        countText.textContent = sapphires.toString()
      }
      // Only show if player has sapphires
      this.elements.sapphiresCounter.style.display = sapphires > 0 ? 'block' : 'none'
    }
  }

  updateSpadesCounter(spades: number): void {
    // Create spades counter if it doesn't exist
    if (!this.elements.spadesCounter) {
      this.createSpadesCounter()
    }
    
    if (this.elements.spadesCounter) {
      this.elements.spadesCounter.textContent = `♠️ ${spades}`
      // Only show if player has spades
      this.elements.spadesCounter.style.display = spades > 0 ? 'block' : 'none'
    }
  }

  updateTilesCounter(tiles: number): void {
    // Create tiles counter if it doesn't exist
    if (!this.elements.tilesCounter) {
      this.createTilesCounter()
    }
    
    if (this.elements.tilesCounter) {
      this.elements.tilesCounter.textContent = `🟦 ${tiles}`
      // Only show if player has tiles
      this.elements.tilesCounter.style.display = tiles > 0 ? 'block' : 'none'
    }
  }

  updateHealthBar(health: number, maxHealth: number): void {
    // Store the actual values for tooltip use
    this.currentHealth = health
    this.maxHealth = maxHealth
    
    if (this.elements.healthBarFill) {
      const healthPercentage = (health / maxHealth) * 100
      this.elements.healthBarFill.style.width = `${healthPercentage}%`
      
      if (healthPercentage > 60) {
        this.elements.healthBarFill.style.backgroundColor = '#ff4444'
      } else if (healthPercentage > 30) {
        this.elements.healthBarFill.style.backgroundColor = '#ff8844'
      } else {
        this.elements.healthBarFill.style.backgroundColor = '#ffaa44'
      }
    }
  }

  updateTimer(cooldownTimer: number): void {
    if (this.elements.timerElement) {
      const minutes = Math.floor(cooldownTimer / 60)
      const seconds = cooldownTimer % 60
      this.elements.timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
  }

  showShopButton(): void {
    console.log('🛒 showShopButton called')
    if (this.elements.shopButton) {
      this.elements.shopButton.style.display = 'block'
      console.log('🛒 Shop button display set to block')
      
      // Ensure button is visible and clickable
      this.elements.shopButton.style.visibility = 'visible'
      this.elements.shopButton.style.pointerEvents = 'auto'
      
      console.log('🛒 Shop button styles updated for visibility')
      
      // Don't add to mobile hover fix - shop buttons handle their own events
    } else {
      console.log('🛒 Shop button element not found!')
    }
  }

  showTimer(): void {
    if (this.elements.timerElement) {
      this.elements.timerElement.style.display = 'block'
    }
  }

  hideTimer(): void {
    if (this.elements.timerElement) {
      this.elements.timerElement.style.display = 'none'
    }
  }

  showTooltip(event: MouseEvent, title: string, description: string): void {
    if (!this.tooltipElement) return
    
    const tooltipTitle = this.tooltipElement.querySelector('.tooltip-title') as HTMLElement
    const tooltipDescription = this.tooltipElement.querySelector('.tooltip-description') as HTMLElement
    
    tooltipTitle.textContent = title
    tooltipDescription.textContent = description
    
    this.tooltipElement.style.display = 'block'
    this.updateTooltipPosition(event)
  }

  showHealthTooltip(event: MouseEvent): void {
    if (!this.tooltipElement) return
    
    const tooltipTitle = this.tooltipElement.querySelector('.tooltip-title') as HTMLElement
    const tooltipDescription = this.tooltipElement.querySelector('.tooltip-description') as HTMLElement
    
    tooltipTitle.textContent = `${this.currentHealth}/${this.maxHealth} HP`
    tooltipDescription.textContent = ''
    
    this.tooltipElement.style.display = 'block'
    this.updateTooltipPosition(event)
  }

  hideTooltip(): void {
    if (this.tooltipElement) {
      this.tooltipElement.style.display = 'none'
    }
  }

  updateTooltipPosition(event: MouseEvent): void {
    if (!this.tooltipElement) return
    
    const tooltip = this.tooltipElement
    const offsetX = 15
    const offsetY = -10
    
    tooltip.style.left = `${event.clientX + offsetX}px`
    tooltip.style.top = `${event.clientY + offsetY}px`
    
    const rect = tooltip.getBoundingClientRect()
    if (rect.right > window.innerWidth) {
      tooltip.style.left = `${event.clientX - rect.width - offsetX}px`
    }
    if (rect.bottom > window.innerHeight) {
      tooltip.style.top = `${event.clientY - rect.height + offsetY}px`
    }
  }

  getElements(): Partial<UIElements> {
    return this.elements
  }
} 