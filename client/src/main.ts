import './style.css'
import * as THREE from 'three'
import { GameState } from './types'
import { UIManager } from './ui'
import { ShopManager } from './shop'
import { DiamondShopManager } from './diamond-shop'
import { SnakeShopManager } from './snakeShop'
import { TetrisShopManager } from './tetrisShop'
import { TileShopManager } from './tileShop'
import { LetterGame } from './letter-game'
import { TetrisGame } from './tetris-game'
import './mobile-hover-fix'

class SnakeGame {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private scoreDisplay: HTMLElement
  private rewardDisplay: HTMLElement
  private startButton: HTMLElement
  private restartButton: HTMLElement
  private gameInstance: any
  private gameOverPopup: HTMLElement | null = null
  private pendingReward: number = 0
  
  private snake: { x: number; y: number }[] = []
  private food: { x: number; y: number } = { x: 0, y: 0 }
  private direction: { x: number; y: number } = { x: 0, y: 0 }
  private nextDirection: { x: number; y: number } = { x: 0, y: 0 }
  private score: number = 0
  private isGameRunning: boolean = false
  private gameLoop: number | null = null
  private emeraldImage: HTMLImageElement | null = null
  public maxHealth: number = 20
  public health: number = 20
  private healthDisplay: HTMLElement | null = null
  public extraLives: number = 0;
  public livesLeft: number = 0;
  private livesDisplay: HTMLElement | null = null;
  
  private readonly GRID_SIZE = 20
  private readonly CANVAS_SIZE = 400
  private readonly GAME_SPEED = 150
  private wrapper: HTMLElement | null = null;
  private dpadElement: HTMLElement | null = null;

  constructor(canvas: HTMLCanvasElement, scoreDisplay: HTMLElement, rewardDisplay: HTMLElement, startButton: HTMLElement, restartButton: HTMLElement, gameInstance: any, healthDisplay: HTMLElement, wrapper: HTMLElement | null) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.scoreDisplay = scoreDisplay
    this.rewardDisplay = rewardDisplay
    this.startButton = startButton
    this.restartButton = restartButton
    this.gameInstance = gameInstance
    this.healthDisplay = healthDisplay
    this.wrapper = wrapper;
    
    this.loadEmeraldImage()
    this.setupControls()
    this.setupDpad()
    this.resetGame()
    this.createLivesDisplay()
  }

  private loadEmeraldImage(): void {
    this.emeraldImage = new Image()
    this.emeraldImage.src = '/assets/emerald.png'
    this.emeraldImage.onload = () => {
      // Redraw once image is loaded
      if (!this.isGameRunning) {
        this.draw()
      }
    }
  }

  private setupControls(): void {
    document.addEventListener('keydown', (e) => {
      if (!this.isGameRunning) return
      
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          if (this.direction.y === 0) {
            this.nextDirection = { x: 0, y: -1 }
          }
          break
        case 's':
        case 'arrowdown':
          if (this.direction.y === 0) {
            this.nextDirection = { x: 0, y: 1 }
          }
          break
        case 'a':
        case 'arrowleft':
          if (this.direction.x === 0) {
            this.nextDirection = { x: -1, y: 0 }
          }
          break
        case 'd':
        case 'arrowright':
          if (this.direction.x === 0) {
            this.nextDirection = { x: 1, y: 0 }
          }
          break
      }
    })
  }

  private setupDpad(): void {
    // Only create D-pad on mobile devices
    if (!this.gameInstance.isMobileDevice()) {
      return
    }

    // Create D-pad container
    this.dpadElement = document.createElement('div')
    this.dpadElement.className = 'snake-dpad'
    
    const dpadContainer = document.createElement('div')
    dpadContainer.className = 'dpad-container'
    
    // Create center circle
    const centerCircle = document.createElement('div')
    centerCircle.className = 'dpad-center'
    dpadContainer.appendChild(centerCircle)
    
    // Create direction buttons
    const directions = [
      { class: 'dpad-up', text: '↑', direction: { x: 0, y: -1 } },
      { class: 'dpad-down', text: '↓', direction: { x: 0, y: 1 } },
      { class: 'dpad-left', text: '←', direction: { x: -1, y: 0 } },
      { class: 'dpad-right', text: '→', direction: { x: 1, y: 0 } }
    ]
    
    directions.forEach(dir => {
      const button = document.createElement('div')
      button.className = `dpad-button ${dir.class}`
      button.textContent = dir.text
      button.setAttribute('data-direction', JSON.stringify(dir.direction))
      
      // Add touch event listeners
      button.addEventListener('touchstart', (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (!this.isGameRunning) return
        
        const newDirection = JSON.parse(button.getAttribute('data-direction') || '{}')
        
        // Check if the direction is valid (can't reverse into itself)
        if (newDirection.x !== 0 && this.direction.x === 0) {
          this.nextDirection = newDirection
        } else if (newDirection.y !== 0 && this.direction.y === 0) {
          this.nextDirection = newDirection
        }
        
        // Add visual feedback
        button.classList.add('pressed')
        
        // Remove pressed state after animation
        setTimeout(() => {
          button.classList.remove('pressed')
        }, 200)
      }, { passive: false })
      
      // Also add click event for testing on non-mobile
      button.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (!this.isGameRunning) return
        
        const newDirection = JSON.parse(button.getAttribute('data-direction') || '{}')
        
        // Check if the direction is valid (can't reverse into itself)
        if (newDirection.x !== 0 && this.direction.x === 0) {
          this.nextDirection = newDirection
        } else if (newDirection.y !== 0 && this.direction.y === 0) {
          this.nextDirection = newDirection
        }
      })
      
      dpadContainer.appendChild(button)
    })
    
    this.dpadElement.appendChild(dpadContainer)
    
    // Add to wrapper if available, otherwise to document body
    if (this.wrapper) {
      this.wrapper.appendChild(this.dpadElement)
    } else {
      document.body.appendChild(this.dpadElement)
    }
  }

  private showDpad(): void {
    if (this.dpadElement) {
      this.dpadElement.classList.add('visible')
    }
  }

  private hideDpad(): void {
    if (this.dpadElement) {
      this.dpadElement.classList.remove('visible')
    }
  }

  private resetGame(): void {
    this.snake = [{ x: 10, y: 10 }]
    this.direction = { x: 0, y: 0 }
    this.nextDirection = { x: 0, y: 0 }
    this.score = 0
    this.health = this.maxHealth
    this.generateFood()
    this.updateDisplay()
    this.updateHealthDisplay()
    this.draw()
    
    // Get extra lives from upgrade
    this.extraLives = this.gameInstance.snakeShop.getUpgradeLevel('ghost-mode');
    this.livesLeft = 1 + this.extraLives;
    console.log('🐍 Snake game reset - Extra lives upgrade level:', this.extraLives, 'Total lives:', this.livesLeft);
    
    this.updateLivesDisplay();
  }

  private generateFood(): void {
    const gridCount = this.CANVAS_SIZE / this.GRID_SIZE
    let foodPosition: { x: number; y: number }
    
    do {
      foodPosition = {
        x: Math.floor(Math.random() * gridCount),
        y: Math.floor(Math.random() * gridCount)
      }
    } while (this.snake.some(segment => segment.x === foodPosition.x && segment.y === foodPosition.y))
    
    this.food = foodPosition
  }

  private draw(): void {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e'
    this.ctx.fillRect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE)
    
    // Draw grid lines
    this.ctx.strokeStyle = '#333'
    this.ctx.lineWidth = 1
    for (let i = 0; i <= this.CANVAS_SIZE; i += this.GRID_SIZE) {
      this.ctx.beginPath()
      this.ctx.moveTo(i, 0)
      this.ctx.lineTo(i, this.CANVAS_SIZE)
      this.ctx.stroke()
      
      this.ctx.beginPath()
      this.ctx.moveTo(0, i)
      this.ctx.lineTo(this.CANVAS_SIZE, i)
      this.ctx.stroke()
    }
    
    // Draw snake
    this.ctx.fillStyle = '#00ff88'
    this.snake.forEach((segment, index) => {
      this.ctx.fillRect(
        segment.x * this.GRID_SIZE + 1,
        segment.y * this.GRID_SIZE + 1,
        this.GRID_SIZE - 2,
        this.GRID_SIZE - 2
      )
      
      // Draw head differently
      if (index === 0) {
        this.ctx.fillStyle = '#00cc66'
        this.ctx.fillRect(
          segment.x * this.GRID_SIZE + 3,
          segment.y * this.GRID_SIZE + 3,
          this.GRID_SIZE - 6,
          this.GRID_SIZE - 6
        )
        this.ctx.fillStyle = '#00ff88'
      }
    })
    
    // Draw food (emerald)
    if (this.emeraldImage && this.emeraldImage.complete) {
      this.ctx.drawImage(
        this.emeraldImage,
        this.food.x * this.GRID_SIZE + 2,
        this.food.y * this.GRID_SIZE + 2,
        this.GRID_SIZE - 4,
        this.GRID_SIZE - 4
      )
    } else {
      // Fallback to green square if image not loaded
      this.ctx.fillStyle = '#4caf50'
      this.ctx.fillRect(
        this.food.x * this.GRID_SIZE + 2,
        this.food.y * this.GRID_SIZE + 2,
        this.GRID_SIZE - 4,
        this.GRID_SIZE - 4
      )
    }
  }

  private update(): void {
    if (!this.isGameRunning) return
    
    // Update direction
    this.direction = { ...this.nextDirection }
    
    // Don't move if snake is stationary (waiting for first input)
    if (this.direction.x === 0 && this.direction.y === 0) {
      return
    }
    
    // Move snake
    const head = { ...this.snake[0] }
    head.x += this.direction.x
    head.y += this.direction.y
    
    // Check wall collision with portal logic
    const gridCount = this.CANVAS_SIZE / this.GRID_SIZE
    
    // Handle border portals if unlocked
    if (this.gameInstance.getState().borderPortalsUnlocked) {
      // Teleport to opposite side
      if (head.x < 0) {
        head.x = gridCount - 1
      } else if (head.x >= gridCount) {
        head.x = 0
      }
      
      if (head.y < 0) {
        head.y = gridCount - 1
      } else if (head.y >= gridCount) {
        head.y = 0
      }
    } else {
      // Original collision behavior
      if (head.x < 0 || head.x >= gridCount || head.y < 0 || head.y >= gridCount) {
        this.gameOver()
        return
      }
    }
    
    // Check self collision
    if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.gameOver()
      return
    }
    
    this.snake.unshift(head)
    
    // Check food collision
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score++
      this.health -= 2 // Each emerald deals 2 damage
      
      this.generateFood()
      this.updateDisplay()
      this.updateHealthDisplay()
      
      // Check if health reaches 0
      if (this.health <= 0) {
        this.gameOver()
        return
      }
    } else {
      this.snake.pop()
    }
    
    this.draw()
  }

  private updateDisplay(): void {
    this.scoreDisplay.textContent = `Score: ${this.score}`
    const baseReward = this.score // 1 emerald per food eaten
    const extraFoodLevel = this.gameInstance.getExtraFoodLevel()
    const totalReward = baseReward + (baseReward * extraFoodLevel) // Total including bonus
    const rewardCount = this.rewardDisplay.querySelector('span:last-child')
    if (rewardCount) {
      rewardCount.textContent = totalReward.toString()
    }
  }

  public updateHealthDisplay(): void {
    if (this.healthDisplay) {
      const healthBarFill = this.healthDisplay.querySelector('.snake-health-bar-fill') as HTMLElement
      const healthBarText = this.healthDisplay.querySelector('.snake-health-bar-text') as HTMLElement
      
      if (healthBarFill) {
        const healthPercentage = (this.health / this.maxHealth) * 100
        healthBarFill.style.width = `${healthPercentage}%`
        
        // Change color based on health level
        if (healthPercentage > 60) {
          healthBarFill.style.background = 'linear-gradient(90deg, #ff4444, #cc3333)'
        } else if (healthPercentage > 30) {
          healthBarFill.style.background = 'linear-gradient(90deg, #ff6666, #dd2222)'
        } else {
          healthBarFill.style.background = 'linear-gradient(90deg, #ff8888, #ff0000)'
        }
      }
      
      if (healthBarText) {
        healthBarText.textContent = `${this.health}/${this.maxHealth}`
      }
    }
  }

  private gameOver(): void {
    console.log('💀 GAME OVER called - isGameRunning:', this.isGameRunning)
    console.log('🔍 Current state - livesLeft:', this.livesLeft, 'extraLives:', this.extraLives, 'health:', this.health)
    
    this.isGameRunning = false
    if (this.gameLoop) {
      clearInterval(this.gameLoop)
      this.gameLoop = null
      console.log('🛑 Game loop stopped')
    }
    
    // Hide D-pad when game over
    this.hideDpad()

    console.log('❤️ Lives check - livesLeft:', this.livesLeft, 'condition (livesLeft > 1):', this.livesLeft > 1)
    // Check for extra lives first - if livesLeft > 1, use an extra life
    if (this.livesLeft > 1) {
      console.log('🎯 Using extra life, continuing game')
      this.livesLeft--;
      
      // Reset only health - keep snake size, position, and food location
      this.health = this.maxHealth;
      
      // Update displays
      this.updateHealthDisplay();
      this.updateLivesDisplay();
      this.draw(); // Redraw the game
      
      console.log('✅ Extra life used successfully - Lives left:', this.livesLeft, 'Health:', this.health, 'Snake size:', this.snake.length)
      
      // Restart the game loop since we're continuing
      this.isGameRunning = true;
      
      // Show D-pad again when continuing
      this.showDpad()
      
      this.gameLoop = setInterval(() => {
        this.update()
      }, this.GAME_SPEED)
      console.log('🔄 Game loop restarted for extra life')
      
      // Continue the game instead of ending
      return;
    }

    console.log('💀 No extra lives remaining, proceeding to game over...')
    console.log('📊 Calculating final score and reward...')
    // Store final score and reward before resetting
    const finalScore = this.score
    const baseReward = finalScore // Base 1 emerald per food
    const extraFoodLevel = this.gameInstance.getExtraFoodLevel()
    const bonusReward = finalScore * extraFoodLevel // Bonus emeralds per food
    const totalReward = baseReward + bonusReward
    
    console.log('🏆 Final stats - Score:', finalScore, 'Total reward:', totalReward)

    // Store the reward to be awarded when popup is closed
    this.pendingReward = totalReward
    console.log('💰 Pending reward set to:', this.pendingReward)

    // Do NOT reset game state here!
    // Show restart button
    this.startButton.style.display = 'none'
    this.restartButton.style.display = 'block'
    console.log('🔄 Switched to restart button')

    // Draw game over overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE)
    console.log('🎨 Drew game over overlay on canvas')

    // Create and show the game over popup
    console.log('🚀 About to create game over popup...')
    this.createGameOverPopup(finalScore, totalReward)
  }

  private createGameOverPopup(finalScore: number, totalReward: number): void {
    console.log('🚨 Creating game over popup with score:', finalScore, 'reward:', totalReward)
    
    // Remove existing popup if any
    if (this.gameOverPopup) {
      console.log('🗑️ Removing existing popup')
      this.gameOverPopup.remove()
    }

    // Create popup container
    this.gameOverPopup = document.createElement('div')
    this.gameOverPopup.className = 'game-over-popup'
    this.gameOverPopup.style.position = 'fixed'
    this.gameOverPopup.style.top = '50%'
    this.gameOverPopup.style.left = '50%'
    this.gameOverPopup.style.transform = 'translate(-50%, -50%)'
    this.gameOverPopup.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'
    this.gameOverPopup.style.padding = '30px'
    this.gameOverPopup.style.borderRadius = '15px'
    this.gameOverPopup.style.border = '2px solid #ff4444'
    this.gameOverPopup.style.boxShadow = '0 0 20px rgba(255, 68, 68, 0.5)'
    this.gameOverPopup.style.zIndex = '10000'
    this.gameOverPopup.style.textAlign = 'center'
    this.gameOverPopup.style.color = '#ffffff'
    this.gameOverPopup.style.minWidth = '300px'
    
    console.log('✅ Created popup element with styles')

    // Game Over text
    const gameOverText = document.createElement('h2')
    gameOverText.textContent = 'GAME OVER'
    gameOverText.style.color = '#ff4444'
    gameOverText.style.marginBottom = '20px'
    gameOverText.style.fontSize = '24px'

    // Score text
    const scoreText = document.createElement('p')
    scoreText.textContent = `Final Score: ${finalScore}`
    scoreText.style.marginBottom = '15px'
    scoreText.style.fontSize = '18px'

    // Reward text with emerald icon
    const rewardText = document.createElement('div')
    rewardText.style.display = 'flex'
    rewardText.style.alignItems = 'center'
    rewardText.style.justifyContent = 'center'
    rewardText.style.marginBottom = '25px'
    rewardText.style.fontSize = '18px'

    const rewardLabel = document.createElement('span')
    rewardLabel.textContent = 'Earned: '
    rewardLabel.style.marginRight = '5px'

    const emeraldIcon = document.createElement('img')
    emeraldIcon.src = '/assets/emerald.png'
    emeraldIcon.style.width = '20px'
    emeraldIcon.style.height = '20px'
    emeraldIcon.style.marginRight = '5px'

    const rewardAmount = document.createElement('span')
    rewardAmount.textContent = totalReward.toString()

    rewardText.appendChild(rewardLabel)
    rewardText.appendChild(emeraldIcon)
    rewardText.appendChild(rewardAmount)

    // Try Again button
    const tryAgainButton = document.createElement('button')
    tryAgainButton.textContent = 'TRY AGAIN'
    tryAgainButton.style.backgroundColor = '#4caf50'
    tryAgainButton.style.color = 'white'
    tryAgainButton.style.border = 'none'
    tryAgainButton.style.padding = '12px 24px'
    tryAgainButton.style.borderRadius = '8px'
    tryAgainButton.style.fontSize = '16px'
    tryAgainButton.style.cursor = 'pointer'
    tryAgainButton.style.transition = 'all 0.3s ease'
    tryAgainButton.style.marginTop = '10px'

    tryAgainButton.addEventListener('mouseover', () => {
      tryAgainButton.style.backgroundColor = '#45a049'
      tryAgainButton.style.transform = 'scale(1.05)'
    })

    tryAgainButton.addEventListener('mouseout', () => {
      tryAgainButton.style.backgroundColor = '#4caf50'
      tryAgainButton.style.transform = 'scale(1)'
    })

    tryAgainButton.addEventListener('click', () => {
      console.log('🔄 Try again button clicked')
      // Award the pending reward when closing the popup
      if (this.pendingReward > 0) {
        this.gameInstance.addEmeralds(this.pendingReward)
        console.log('💎 Awarded', this.pendingReward, 'emeralds')
        this.pendingReward = 0
        
        // Refresh currency displays to show updated emerald count immediately
        this.gameInstance.refreshAllCurrencyDisplays()
        this.gameInstance.ensureCurrencyElementsVisible()
      }
      this.gameOverPopup?.remove()
      this.gameOverPopup = null
      this.resetGame()
      this.draw()
      
      // Show the start button so player can choose when to play again
      this.startButton.style.display = 'block'
      this.restartButton.style.display = 'none'
      console.log('🎮 Returned to snake game screen - ready to start new game')
    })

    // Add all elements to popup
    this.gameOverPopup.appendChild(gameOverText)
    this.gameOverPopup.appendChild(scoreText)
    this.gameOverPopup.appendChild(rewardText)
    this.gameOverPopup.appendChild(tryAgainButton)
    
    console.log('📝 Added all elements to popup')

    // Attach popup directly to document body for maximum visibility
    document.body.appendChild(this.gameOverPopup)
    console.log('🎯 Popup attached to document body')
    
    // Log popup position and visibility
    const rect = this.gameOverPopup.getBoundingClientRect()
    console.log('📍 Popup position:', rect)
    console.log('👁️ Popup visible:', this.gameOverPopup.style.display !== 'none')
  }

  public startGame(): void {
    if (this.isGameRunning) return
    
    this.isGameRunning = true
    this.direction = { x: 0, y: 0 } // Start stationary - no movement until input
    this.nextDirection = { x: 0, y: 0 }
    
    this.startButton.style.display = 'none'
    this.restartButton.style.display = 'none'
    
    // Show D-pad on mobile
    this.showDpad()
    
    this.gameLoop = setInterval(() => {
      this.update()
    }, this.GAME_SPEED)
  }

  public restartGame(): void {
    // Stop current game without showing buttons
    this.isGameRunning = false
    if (this.gameLoop) {
      clearInterval(this.gameLoop)
      this.gameLoop = null
    }
    
    this.resetGame()
    // Clear the canvas to remove any game over message
    this.draw()
    this.startGame()
  }

  public pauseGame(): void {
    this.isGameRunning = false
    if (this.gameLoop) {
      clearInterval(this.gameLoop)
      this.gameLoop = null
    }
    this.startButton.style.display = 'block'
    this.restartButton.style.display = 'none'
    
    // Hide D-pad when paused
    this.hideDpad()
  }

  public createLivesDisplay(): void {
    // Remove old display if it exists
    if (this.livesDisplay && this.livesDisplay.parentElement) {
      this.livesDisplay.parentElement.removeChild(this.livesDisplay);
    }
    this.livesDisplay = document.createElement('div');
    this.livesDisplay.className = 'snake-lives-display';
    this.livesDisplay.style.textAlign = 'center';
    this.livesDisplay.style.fontSize = '1.5rem';
    this.livesDisplay.style.fontWeight = 'bold';
    this.livesDisplay.style.marginBottom = '8px';
    if (this.wrapper) {
      this.wrapper.insertBefore(this.livesDisplay, this.wrapper.firstChild);
    }
    this.updateLivesDisplay();
  }

  public updateLivesDisplay(): void {
    if (this.livesDisplay) {
      const snakeEmoji = '🐍';
      this.livesDisplay.textContent = Array(this.livesLeft).fill(snakeEmoji).join(' ');
    }
  }
}

class MikecrementalGame {
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private renderer!: THREE.WebGLRenderer
  private splashScreen!: HTMLElement
  private cube!: THREE.Mesh
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private cooldownInterval: number | null = null
  
  // Scene management
  private degenDiamondsScene: HTMLElement | null = null
  private diamondGameScene: HTMLElement | null = null
  private snakeGameScene: HTMLElement | null = null
  private tetrisGameScene: HTMLElement | null = null
  private letterGameScene: HTMLElement | null = null
  private currentWager: number = 0
  private currentDiamondWager: number = 0
  private currentEmeraldWager: number = 0
  private currentTileWager: number = 0
  
  // Game state
  private state: GameState = {
    money: 0,
    diamonds: 0,
    emeralds: 0,
    sapphires: 0,
    spades: 0,
    tiles: 0,
    health: 10,
    maxHealth: 10,
    isOnCooldown: false,
    cooldownTimer: 60,
    hasReachedZeroHealth: false,
    gameStarted: false,
    clickValue: 1,
    isInShop: false,
    isInDegenDiamonds: false,
    isInDiamondShop: false,
    isInSnakeShop: false,
    isInTetrisShop: false,
    isInTileShop: false,
    isInLetterGameLaunch: false,
    isInLetterGame: false,
    isInTetrisGame: false,
    isInLetterShop: false,
    isInBalatroGame: false,
    bombSliderUnlocked: false,
    bombCount: 1,
    isInSnakeGame: false,
    borderPortalsUnlocked: false,
    discardZoneUnlocked: false,
    letterGameUnlocked: false,
    tetrisGameUnlocked: false,
    balatroGameUnlocked: false
  }

  // Bomb count to percentage mapping
  private bombPercentages: { [key: number]: number } = {
    1: 5, 2: 10, 3: 15, 4: 20, 5: 25, 6: 32, 7: 40, 8: 47, 9: 56, 10: 67,
    11: 78, 12: 93, 13: 109, 14: 128, 15: 150, 16: 178, 17: 212, 18: 257,
    19: 317, 20: 400, 21: 550, 22: 750, 23: 1250, 24: 2500
  }

  // Timer settings
  private baseCooldownDuration: number = 60
  private timerReduction: number = 0

  // Managers
  private ui: UIManager
  private shop: ShopManager
  private diamondShop: DiamondShopManager
  private snakeShop: SnakeShopManager
  private tetrisShop: TetrisShopManager | null = null
  private tileShop: TileShopManager
  private letterGame: LetterGame
  private tetrisGame: TetrisGame | null = null

  // Add to class properties:
  private snakeGame: SnakeGame | null = null;

  constructor() {
    this.ui = new UIManager()
    this.shop = new ShopManager(this.ui, this)
    this.diamondShop = new DiamondShopManager(this.ui, this)
    this.snakeShop = new SnakeShopManager(this.ui, this)
    this.tileShop = new TileShopManager(this.ui, this)
    this.letterGame = new LetterGame(this.ui, this)
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    
    this.createSplashScreen()
    this.initThree()
    this.setupEventListeners()
  }

  private createSplashScreen(): void {
    this.splashScreen = this.ui.createSplashScreen()
    
    const startButton = this.splashScreen.querySelector('.start-button')!
    startButton.addEventListener('click', () => {
      this.startGame()
    })
  }

  private initThree(): void {
    // Create scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a1a2e)

    // Create camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.camera.position.z = 5

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)

    // Create cube
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00ff88,
      wireframe: true 
    })
    this.cube = new THREE.Mesh(geometry, material)
    this.scene.add(this.cube)

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(1, 1, 1).normalize()
    this.scene.add(directionalLight)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      
      if (this.state.gameStarted) {
        this.cube.rotation.x += 0.01
        this.cube.rotation.y += 0.01
      }
      
      this.renderer.render(this.scene, this.camera)
    }
    
    animate()
  }

  private setupEventListeners(): void {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    })

    // Handle mouse clicks on the cube
    window.addEventListener('click', (event) => {
      if (!this.state.gameStarted || this.state.isOnCooldown || this.state.isInShop || this.state.isInDegenDiamonds || this.state.isInDiamondShop || this.state.isInSnakeShop || this.state.isInTetrisShop || this.state.isInSnakeGame || this.state.isInTetrisGame) return

      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

      this.raycaster.setFromCamera(this.mouse, this.camera)
      const intersects = this.raycaster.intersectObject(this.cube)

      if (intersects.length > 0) {
        this.onCubeClick()
      }
    })
  }

  private onCubeClick(): void {
    if (this.state.isOnCooldown) return

    this.state.money += this.state.clickValue
    this.state.health--
    this.ui.updateMoneyCounter(this.state.money)
    this.ui.updateHealthBar(this.state.health, this.state.maxHealth)
    
    // Visual feedback
    const originalColor = 0x00ff88
    const flashColor = 0xffff00
    
    ;(this.cube.material as THREE.MeshBasicMaterial).color.setHex(flashColor)
    this.cube.scale.set(1.2, 1.2, 1.2)
    
    setTimeout(() => {
      ;(this.cube.material as THREE.MeshBasicMaterial).color.setHex(originalColor)
      this.cube.scale.set(1, 1, 1)
    }, 100)
    
    if (this.state.health <= 0) {
      this.startCooldown()
    }
    
    console.log(`Cube clicked! Money: $${this.state.money}, Health: ${this.state.health}, Click Value: $${this.state.clickValue}`)
  }

  private startCooldown(): void {
    this.state.isOnCooldown = true
    this.state.cooldownTimer = this.baseCooldownDuration - this.timerReduction
    
    if (!this.state.hasReachedZeroHealth) {
      this.state.hasReachedZeroHealth = true
      this.ui.showShopButton()
    }
    
    ;(this.cube.material as THREE.MeshBasicMaterial).color.setHex(0x666666)
    this.ui.showTimer()
    this.ui.updateTimer(this.state.cooldownTimer)
    
    this.cooldownInterval = setInterval(() => {
      this.state.cooldownTimer--
      this.ui.updateTimer(this.state.cooldownTimer)
      
      if (this.state.cooldownTimer <= 0) {
        this.endCooldown()
      }
    }, 1000)
  }

  private endCooldown(): void {
    this.state.isOnCooldown = false
    this.state.health = this.state.maxHealth
    
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval)
      this.cooldownInterval = null
    }
    
    this.ui.hideTimer()
    ;(this.cube.material as THREE.MeshBasicMaterial).color.setHex(0x00ff88)
    this.ui.updateHealthBar(this.state.health, this.state.maxHealth)
    
    console.log('Cube is ready to click again!')
  }

  private startGame(): void {
    this.state.gameStarted = true
    
    this.splashScreen.classList.add('hidden')
    
    setTimeout(() => {
      const app = document.querySelector<HTMLDivElement>('#app')!
      const gameContainer = document.createElement('div')
      gameContainer.className = 'game-container'
      
      this.renderer.domElement.id = 'three-canvas'
      gameContainer.appendChild(this.renderer.domElement)
      app.appendChild(gameContainer)
      
      this.ui.createGameView()
      this.ui.createMoneyCounter()
      this.ui.createDiamondsCounter()
      this.ui.createEmeraldsCounter()
      this.ui.createSapphiresCounter()
      this.ui.createSpadesCounter()
      this.ui.createTilesCounter()
      this.ui.createHealthBar()
      this.ui.createTimer()
      this.ui.createShopButton(() => this.shop.openShop())
      this.shop.createShop()
      this.ui.createTooltip()
      
      // Initialize Letter Game and create its UI
      console.log('🎯 Starting Letter Game initialization...')
      this.letterGame.initialize().then(() => {
        console.log('✅ Letter Game initialized successfully')
        const letterGameUI = this.letterGame.createGameUI()
        console.log('🎮 Letter Game UI created:', !!letterGameUI)
        app.appendChild(letterGameUI)
        console.log('📱 Letter Game UI appended to app')
      }).catch(error => {
        console.error('❌ Failed to initialize Letter Game:', error)
      })
      
      console.log('Mikecremental game started!')
    }, 500)
  }

  // Public methods for shop integration
  public healCubeToFull(): void {
    this.state.health = this.state.maxHealth
    this.state.isOnCooldown = false
    
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval)
      this.cooldownInterval = null
    }
    
    this.ui.hideTimer()
    ;(this.cube.material as THREE.MeshBasicMaterial).color.setHex(0x00ff88)
    this.ui.updateHealthBar(this.state.health, this.state.maxHealth)
  }

  public getMoney(): number {
    return this.state.money
  }

  public spendMoney(amount: number): boolean {
    if (this.state.money >= amount) {
      this.state.money -= amount
      this.ui.updateMoneyCounter(this.state.money)
      return true
    }
    return false
  }

  public getDiamonds(): number {
    return this.state.diamonds
  }

  public addDiamonds(amount: number): void {
    this.state.diamonds += amount
    this.ui.updateDiamondsCounter(this.state.diamonds)
  }

  public spendDiamonds(amount: number): boolean {
    if (this.state.diamonds >= amount) {
      this.state.diamonds -= amount
      this.ui.updateDiamondsCounter(this.state.diamonds)
      return true
    }
    return false
  }

  public getEmeralds(): number {
    return this.state.emeralds
  }

  public addEmeralds(amount: number): void {
    this.state.emeralds += amount
    this.ui.updateEmeraldsCounter(this.state.emeralds)
  }

  public spendEmeralds(amount: number): boolean {
    if (this.state.emeralds >= amount) {
      this.state.emeralds -= amount
      this.ui.updateEmeraldsCounter(this.state.emeralds)
      return true
    }
    return false
  }

  public getTiles(): number {
    return this.state.tiles
  }

  public addTiles(amount: number): void {
    this.state.tiles += amount
    this.refreshAllCurrencyDisplays()
  }

  public spendTiles(amount: number): boolean {
    if (this.state.tiles >= amount) {
      this.state.tiles -= amount
      this.refreshAllCurrencyDisplays()
      return true
    }
    return false
  }

  public getSapphires(): number {
    return this.state.sapphires
  }

  public addSapphires(amount: number): void {
    this.state.sapphires += amount
    this.ui.updateSapphiresCounter(this.state.sapphires)
  }

  public spendSapphires(amount: number): boolean {
    if (this.state.sapphires >= amount) {
      this.state.sapphires -= amount
      this.ui.updateSapphiresCounter(this.state.sapphires)
      return true
    }
    return false
  }

  public getSpades(): number {
    return this.state.spades
  }

  public addSpades(amount: number): void {
    this.state.spades += amount
    this.ui.updateSpadesCounter(this.state.spades)
  }

  public spendSpades(amount: number): boolean {
    if (this.state.spades >= amount) {
      this.state.spades -= amount
      this.ui.updateSpadesCounter(this.state.spades)
      return true
    }
    return false
  }

  public refreshAllCurrencyDisplays(): void {
    this.ui.updateMoneyCounter(this.state.money)
    this.ui.updateDiamondsCounter(this.state.diamonds)
    this.ui.updateEmeraldsCounter(this.state.emeralds)
    this.ui.updateSapphiresCounter(this.state.sapphires)
    this.ui.updateSpadesCounter(this.state.spades)
    this.ui.updateTilesCounter(this.state.tiles)
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
    if (elements.diamondsCounter && this.state.diamonds > 0) {
      elements.diamondsCounter.style.display = 'block'
      elements.diamondsCounter.style.position = 'absolute'
      elements.diamondsCounter.style.top = '80px'
      elements.diamondsCounter.style.left = '20px'
      elements.diamondsCounter.style.zIndex = '300'
    }
    
    // Emeralds counter - visible if player has emeralds
    if (elements.emeraldsCounter && this.state.emeralds > 0) {
      elements.emeraldsCounter.style.display = 'block'
      elements.emeraldsCounter.style.position = 'absolute'
      elements.emeraldsCounter.style.top = '140px'
      elements.emeraldsCounter.style.left = '20px'
      elements.emeraldsCounter.style.zIndex = '300'
    }
    
    // Sapphires counter - visible if player has sapphires
    if (elements.sapphiresCounter && this.state.sapphires > 0) {
      elements.sapphiresCounter.style.display = 'block'
      elements.sapphiresCounter.style.position = 'absolute'
      elements.sapphiresCounter.style.top = '180px'
      elements.sapphiresCounter.style.left = '20px'
      elements.sapphiresCounter.style.zIndex = '300'
    }
    
    // Spades counter - visible if player has spades
    if (elements.spadesCounter && this.state.spades > 0) {
      elements.spadesCounter.style.display = 'block'
      elements.spadesCounter.style.position = 'absolute'
      elements.spadesCounter.style.top = '220px'
      elements.spadesCounter.style.left = '20px'
      elements.spadesCounter.style.zIndex = '300'
    }
    
    // Tiles counter - visible if player has tiles
    if (elements.tilesCounter && this.state.tiles > 0) {
      elements.tilesCounter.style.display = 'block'
      elements.tilesCounter.style.position = 'absolute'
      elements.tilesCounter.style.top = '260px'
      elements.tilesCounter.style.left = '20px'
      elements.tilesCounter.style.zIndex = '300'
    }
  }

  public getState(): GameState {
    return { ...this.state }
  }

  public increaseClickValue(amount: number): void {
    this.state.clickValue += amount
    console.log(`Click value increased to $${this.state.clickValue}`)
  }

  public increaseMaxHealth(amount: number): void {
    this.state.maxHealth += amount
    // Also heal to the new max health when upgrading
    this.state.health = this.state.maxHealth
    this.ui.updateHealthBar(this.state.health, this.state.maxHealth)
    console.log(`Max health increased to ${this.state.maxHealth}`)
  }

  public setShopState(inShop: boolean): void {
    this.state.isInShop = inShop
  }

  public setDiamondShopState(inDiamondShop: boolean): void {
    this.state.isInDiamondShop = inDiamondShop
  }

  public setSnakeShopState(inSnakeShop: boolean): void {
    this.state.isInSnakeShop = inSnakeShop
  }

  public setTileShopState(inTileShop: boolean): void {
    this.state.isInTileShop = inTileShop
  }

  public setTetrisShopState(inTetrisShop: boolean): void {
    this.state.isInTetrisShop = inTetrisShop
  }

  public setTetrisGameState(inTetrisGame: boolean): void {
    this.state.isInTetrisGame = inTetrisGame
  }

  public setLetterGameLaunchState(inLetterGameLaunch: boolean): void {
    this.state.isInLetterGameLaunch = inLetterGameLaunch
  }

  public setLetterGameState(inLetterGame: boolean): void {
    this.state.isInLetterGame = inLetterGame
  }

  public unlockDiscardZone(): void {
    console.log('Discard Zone unlocked!')
    this.state.discardZoneUnlocked = true
    
    // Refresh the letter game UI to show the discard zone
    if (this.letterGame) {
      this.letterGame.refreshGameUI()
    }
  }

  public unlockBorderPortals(): void {
    console.log('Border Portals have been unlocked!')
    this.state.borderPortalsUnlocked = true
  }

  public getExtraFoodLevel(): number {
    return this.snakeShop.getUpgradeLevel('double-food')
  }

  public getTetrisLevelBonus(): number {
    return this.tetrisShop ? this.tetrisShop.getUpgradeLevel('level-bonus') * 0.2 : 0
  }

  public hasHealOnPurchase(): boolean {
    return this.shop.hasUpgrade('heal-on-purchase')
  }

  public reduceTimerDuration(seconds: number): void {
    this.timerReduction += seconds
    const newDuration = this.baseCooldownDuration - this.timerReduction
    console.log(`Timer duration reduced by ${seconds}s. New cooldown duration: ${newDuration}s`)
  }

  public unlockBombSlider(): void {
    console.log('Bomb Slider has been unlocked!')
    this.state.bombSliderUnlocked = true
    this.updateBombSliderVisibility()
  }

  private getBonusPercentage(bombCount: number): number {
    return this.bombPercentages[bombCount] || 5 // Default to 5% if not found
  }

  public showDegenDiamondsButton(): void {
    this.ui.createDegenDiamondsButton(() => this.openDegenDiamonds())
  }

  public showLetterGameButton(): void {
    console.log('🎮 Letter Game unlocked!')
    this.state.letterGameUnlocked = true
    this.ui.createLetterGameButton(() => this.openLetterGame())
  }

  public showSnakeButton(): void {
    this.ui.createSnakeButton(() => this.openSnakeGame())
  }

  public showTileShopButton(): void {
    this.ui.createTileShopButton(() => this.tileShop.openTileShop())
  }

  public showTetrisButton(): void {
    this.state.tetrisGameUnlocked = true
    this.ui.createTetrisButton(() => this.openTetrisGame())
  }

  public openTetrisGame(): void {
    if (!this.tetrisGameScene) {
      this.createTetrisGameScene()
    }
    
    const elements = this.ui.getElements()
    if (elements.gameView) {
      elements.gameView.style.display = 'none'
    }
    
    // Refresh all currency displays to ensure they're visible on this screen
    this.refreshAllCurrencyDisplays()
    
    // Explicitly show and position all currency elements for this screen
    this.ensureCurrencyElementsVisible()
    
    this.tetrisGameScene!.style.display = 'block'
    this.state.isInTetrisGame = true
    console.log('Opened Tetris Game')
  }

  private closeTetrisGame(): void {
    if (this.tetrisGameScene) {
      this.tetrisGameScene.style.display = 'none'
    }
    
    this.restoreMainUI()
    this.state.isInTetrisGame = false
    console.log('Closed Tetris Game')
  }

  private createTetrisGameScene(): void {
    const app = document.querySelector<HTMLDivElement>('#app')!
    
    const tetrisScene = document.createElement('div')
    tetrisScene.className = 'tetris-game-container'
    tetrisScene.style.display = 'none'
    
    // Scene title
    const title = document.createElement('h2')
    title.className = 'tetris-title'
    title.textContent = '🔷 TETRIS GAME 🔷'
    title.style.color = '#ffffff'
    title.style.fontSize = '2.2rem'
    title.style.fontWeight = 'bold'
    title.style.textShadow = '0 0 30px rgba(33, 150, 243, 0.8)'
    title.style.margin = '0 0 15px 0'
    title.style.letterSpacing = '0.1em'
    title.style.textAlign = 'center'
    title.style.animation = 'glow-blue-tetris 2s ease-in-out infinite alternate'
    
    // Game info section
    const gameInfo = document.createElement('div')
    gameInfo.className = 'tetris-game-info'
    
    const scoreDisplay = document.createElement('div')
    scoreDisplay.className = 'tetris-score'
    scoreDisplay.textContent = 'Score: 0'
    
    const rewardDisplay = document.createElement('div')
    rewardDisplay.className = 'tetris-reward'
    
    // Create reward display with sapphire icon
    const rewardLabel = document.createElement('span')
    rewardLabel.textContent = 'Reward: '
    
    const sapphireIcon = document.createElement('img')
    sapphireIcon.src = '/assets/sapphire.png'
    sapphireIcon.className = 'sapphire-icon-small'
    sapphireIcon.style.width = '16px'
    sapphireIcon.style.height = '16px'
    sapphireIcon.style.marginRight = '3px'
    sapphireIcon.style.verticalAlign = 'middle'
    
    const rewardCount = document.createElement('span')
    rewardCount.textContent = '0'
    
    rewardDisplay.appendChild(rewardLabel)
    rewardDisplay.appendChild(sapphireIcon)
    rewardDisplay.appendChild(rewardCount)
    
    gameInfo.appendChild(scoreDisplay)
    gameInfo.appendChild(rewardDisplay)
    
    // Game canvas
    const gameCanvas = document.createElement('canvas')
    gameCanvas.className = 'tetris-canvas'
    gameCanvas.width = 300
    gameCanvas.height = 600
    
    // Game controls info
    const controlsInfo = document.createElement('div')
    controlsInfo.className = 'tetris-controls'
    controlsInfo.innerHTML = `
      <div>Controls:</div>
      <div>A/D or ←/→ : Move</div>
      <div>S or ↓ : Soft Drop</div>
      <div>W or ↑ : Rotate</div>
      <div>Space : Hard Drop</div>
    `
    
    // Game buttons
    const buttonContainer = document.createElement('div')
    buttonContainer.className = 'tetris-buttons'
    
    const startButton = document.createElement('button')
    startButton.className = 'tetris-start-button'
    startButton.textContent = 'START GAME (for 💎15)'
    
    const restartButton = document.createElement('button')
    restartButton.className = 'tetris-restart-button'
    restartButton.textContent = 'RESTART (for 💎15)'
    restartButton.style.display = 'none'
    
    const tetrisShopButton = document.createElement('button')
    tetrisShopButton.className = 'tetris-shop-button'
    tetrisShopButton.textContent = '🔷 SHOP'
    
    const backButton = document.createElement('button')
    backButton.className = 'tetris-back-button'
    backButton.textContent = 'BACK'
    
    buttonContainer.appendChild(startButton)
    buttonContainer.appendChild(restartButton)
    
    // Create content wrapper for better centering
    const contentWrapper = document.createElement('div')
    contentWrapper.className = 'tetris-game-content'
    
    contentWrapper.appendChild(title)
    contentWrapper.appendChild(gameCanvas)
    contentWrapper.appendChild(gameInfo)
    contentWrapper.appendChild(controlsInfo)
    contentWrapper.appendChild(buttonContainer)
    
    // Initialize tetris game logic and shop after contentWrapper is created
    const tetrisGame = new TetrisGame(gameCanvas, scoreDisplay, rewardDisplay, startButton, restartButton, this, contentWrapper)
    if (!this.tetrisShop) {
      this.tetrisShop = new TetrisShopManager(this.ui, this)
    }
    
    // Update button states based on diamond availability
    const updateButtonStates = () => {
      const canAfford = this.state.diamonds >= 15
      if (!canAfford) {
        if (startButton.style.display !== 'none') {
          startButton.textContent = 'Need 💎15 to Play'
          startButton.style.opacity = '0.6'
          startButton.style.cursor = 'not-allowed'
        }
        if (restartButton.style.display !== 'none') {
          restartButton.textContent = 'Need 💎15 to Play'
          restartButton.style.opacity = '0.6'
          restartButton.style.cursor = 'not-allowed'
        }
      } else {
        if (startButton.style.display !== 'none') {
          startButton.textContent = 'START GAME (for 💎15)'
          startButton.style.opacity = '1'
          startButton.style.cursor = 'pointer'
        }
        if (restartButton.style.display !== 'none') {
          restartButton.textContent = 'RESTART (for 💎15)'
          restartButton.style.opacity = '1'
          restartButton.style.cursor = 'pointer'
        }
      }
    }
    
    // Initial update
    updateButtonStates()
    
    // Store reference for updates
    ;(tetrisScene as any).updateButtonStates = updateButtonStates
    
    startButton.addEventListener('click', () => {
      if (this.state.diamonds >= 15) {
        this.spendDiamonds(15)
        tetrisGame.startGame()
        updateButtonStates()
      } else {
        // Show insufficient diamonds message
        const currentText = startButton.textContent
        startButton.textContent = 'Need 💎15!'
        startButton.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a24)'
        setTimeout(() => {
          startButton.textContent = currentText
          startButton.style.background = 'linear-gradient(45deg, #2196f3, #1976d2)'
        }, 1500)
      }
    })
    
    restartButton.addEventListener('click', () => {
      if (this.state.diamonds >= 15) {
        this.spendDiamonds(15)
        tetrisGame.restartGame()
        updateButtonStates()
      } else {
        // Show insufficient diamonds message
        const currentText = restartButton.textContent
        restartButton.textContent = 'Need 💎15!'
        restartButton.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a24)'
        setTimeout(() => {
          restartButton.textContent = currentText
          restartButton.style.background = 'linear-gradient(45deg, #2196f3, #1976d2)'
        }, 1500)
      }
    })
    
    tetrisShopButton.addEventListener('click', () => {
      if (this.tetrisShop) {
        this.tetrisShop.openTetrisShop()
      }
    })

    backButton.addEventListener('click', () => {
      tetrisGame.pauseGame()
      this.closeTetrisGame()
    })
    
    tetrisScene.appendChild(contentWrapper)
    tetrisScene.appendChild(tetrisShopButton)
    tetrisScene.appendChild(backButton)
    
    app.appendChild(tetrisScene)
    this.tetrisGameScene = tetrisScene
    this.tetrisGame = tetrisGame
  }

  private createDegenDiamondsScene(): void {
    const app = document.querySelector<HTMLDivElement>('#app')!
    
    const degenScene = document.createElement('div')
    degenScene.className = 'degen-diamonds-container'
    degenScene.style.display = 'none'
    
    // Scene title
    const title = document.createElement('h2')
    title.className = 'degen-title'
    title.textContent = '💎 DEGEN DIAMONDS 💎'
    
    // Wager input section
    const wagerSection = document.createElement('div')
    wagerSection.className = 'wager-section'
    
    const wagerLabel = document.createElement('label')
    wagerLabel.className = 'wager-label'
    wagerLabel.textContent = 'Enter Wager Amount:'
    
    // Wager input container with $ symbol
    const wagerInputContainer = document.createElement('div')
    wagerInputContainer.className = 'wager-input-container'
    
    const dollarSymbol = document.createElement('span')
    dollarSymbol.className = 'wager-dollar-symbol'
    dollarSymbol.textContent = '$'
    
    const wagerInput = document.createElement('input')
    wagerInput.type = 'number'
    wagerInput.className = 'wager-input'
    wagerInput.placeholder = '0'
    wagerInput.min = '0'
    wagerInput.max = this.state.money.toString()
    
    // Start button (initially hidden)
    const startButton = document.createElement('button')
    startButton.className = 'wager-start-button'
    startButton.textContent = 'START'
    startButton.style.display = 'none'
    
    // Input validation and start button visibility
    wagerInput.addEventListener('input', () => {
      const wagerAmount = parseInt(wagerInput.value) || 0
      const playerMoney = this.state.money
      
      // Update max attribute to current money amount
      wagerInput.max = playerMoney.toString()
      
      // Validate wager amount
      if (wagerAmount > playerMoney) {
        wagerInput.value = playerMoney.toString()
        wagerInput.classList.add('invalid')
      } else {
        wagerInput.classList.remove('invalid')
      }
      
      // Update start button visibility based on both wagers (will be defined later)
      updateStartButtonVisibility()
    })
    
    // Start button click handler
    startButton.addEventListener('click', () => {
      const wagerAmount = parseInt(wagerInput.value) || 0
      const diamondWagerAmount = parseInt(diamondWagerInput.value) || 0
      const emeraldWagerAmount = parseInt(emeraldWagerInput.value) || 0
      const tilesWagerAmount = parseInt(tilesWagerInput.value) || 0
      this.currentWager = wagerAmount
      this.currentDiamondWager = diamondWagerAmount
      this.currentEmeraldWager = emeraldWagerAmount
      this.currentTileWager = tilesWagerAmount
      console.log(`Starting degen game with wager: $${wagerAmount} + 💎${diamondWagerAmount} + emeralds${emeraldWagerAmount} + 🟦${tilesWagerAmount}`)
      this.openDiamondGameScene()
    })
    
    wagerInputContainer.appendChild(dollarSymbol)
    wagerInputContainer.appendChild(wagerInput)
    
        wagerSection.appendChild(wagerLabel)
    wagerSection.appendChild(wagerInputContainer)

    // Special currency wager section (diamonds and emeralds side by side)
    const specialWagerContainer = document.createElement('div')
    specialWagerContainer.className = 'special-wager-container'
    
    // Diamond wager section
    const diamondWagerContainer = document.createElement('div')
    diamondWagerContainer.className = 'diamond-wager-container'
    
    const diamondWagerLabel = document.createElement('label')
    diamondWagerLabel.className = 'wager-label'
    diamondWagerLabel.textContent = 'Enter Diamond Wager:'
    
    // Diamond wager input container with 💎 symbol
    const diamondWagerInputContainer = document.createElement('div')
    diamondWagerInputContainer.className = 'wager-input-container'
    
    const diamondSymbol = document.createElement('span')
    diamondSymbol.className = 'wager-dollar-symbol'
    diamondSymbol.textContent = '💎'
    
    const diamondWagerInput = document.createElement('input')
    diamondWagerInput.type = 'number'
    diamondWagerInput.className = 'wager-input'
    diamondWagerInput.placeholder = '0'
    diamondWagerInput.min = '0'
    diamondWagerInput.max = this.state.diamonds.toString()
    
    diamondWagerInputContainer.appendChild(diamondSymbol)
    diamondWagerInputContainer.appendChild(diamondWagerInput)
    diamondWagerContainer.appendChild(diamondWagerLabel)
    diamondWagerContainer.appendChild(diamondWagerInputContainer)
    
    // Emerald wager section
    const emeraldWagerContainer = document.createElement('div')
    emeraldWagerContainer.className = 'emerald-wager-container'
    
    const emeraldWagerLabel = document.createElement('label')
    emeraldWagerLabel.className = 'wager-label'
    emeraldWagerLabel.textContent = 'Enter Emerald Wager:'
    
    // Emerald wager input container with emerald icon
    const emeraldWagerInputContainer = document.createElement('div')
    emeraldWagerInputContainer.className = 'wager-input-container'
    
    const emeraldSymbol = document.createElement('img')
    emeraldSymbol.src = '/assets/emerald.png'
    emeraldSymbol.className = 'wager-emerald-symbol'
    emeraldSymbol.style.width = '20px'
    emeraldSymbol.style.height = '20px'
    emeraldSymbol.style.marginRight = '5px'
    
    const emeraldWagerInput = document.createElement('input')
    emeraldWagerInput.type = 'number'
    emeraldWagerInput.className = 'wager-input'
    emeraldWagerInput.placeholder = '0'
    emeraldWagerInput.min = '0'
    emeraldWagerInput.max = this.state.emeralds.toString()
    
    emeraldWagerInputContainer.appendChild(emeraldSymbol)
    emeraldWagerInputContainer.appendChild(emeraldWagerInput)
    emeraldWagerContainer.appendChild(emeraldWagerLabel)
    emeraldWagerContainer.appendChild(emeraldWagerInputContainer)
    
    // Tiles wager section
    const tilesWagerContainer = document.createElement('div')
    tilesWagerContainer.className = 'tiles-wager-container'
    
    const tilesWagerLabel = document.createElement('label')
    tilesWagerLabel.className = 'wager-label'
    tilesWagerLabel.textContent = 'Enter Tiles Wager:'
    
    // Tiles wager input container with 🟦 symbol
    const tilesWagerInputContainer = document.createElement('div')
    tilesWagerInputContainer.className = 'wager-input-container'
    
    const tilesSymbol = document.createElement('span')
    tilesSymbol.className = 'wager-dollar-symbol'
    tilesSymbol.textContent = '🟦'
    
    const tilesWagerInput = document.createElement('input')
    tilesWagerInput.type = 'number'
    tilesWagerInput.className = 'wager-input'
    tilesWagerInput.placeholder = '0'
    tilesWagerInput.min = '0'
    tilesWagerInput.max = this.state.tiles.toString()
    
    tilesWagerInputContainer.appendChild(tilesSymbol)
    tilesWagerInputContainer.appendChild(tilesWagerInput)
    tilesWagerContainer.appendChild(tilesWagerLabel)
    tilesWagerContainer.appendChild(tilesWagerInputContainer)

    // Add all containers to special wager container
    specialWagerContainer.appendChild(diamondWagerContainer)
    specialWagerContainer.appendChild(emeraldWagerContainer)
    specialWagerContainer.appendChild(tilesWagerContainer)
    
    // Input validation for diamond wager
    diamondWagerInput.addEventListener('input', () => {
      const diamondWagerAmount = parseInt(diamondWagerInput.value) || 0
      const playerDiamonds = this.state.diamonds
      
      diamondWagerInput.max = playerDiamonds.toString()
      
      if (diamondWagerAmount > playerDiamonds) {
        diamondWagerInput.value = playerDiamonds.toString()
        diamondWagerInput.classList.add('invalid')
      } else {
        diamondWagerInput.classList.remove('invalid')
      }
      
      updateStartButtonVisibility()
    })
    
    // Input validation for emerald wager
    emeraldWagerInput.addEventListener('input', () => {
      const emeraldWagerAmount = parseInt(emeraldWagerInput.value) || 0
      const playerEmeralds = this.state.emeralds
      
      emeraldWagerInput.max = playerEmeralds.toString()
      
      if (emeraldWagerAmount > playerEmeralds) {
        emeraldWagerInput.value = playerEmeralds.toString()
        emeraldWagerInput.classList.add('invalid')
      } else {
        emeraldWagerInput.classList.remove('invalid')
      }
      
      updateStartButtonVisibility()
    })

    // Input validation for tiles wager
    tilesWagerInput.addEventListener('input', () => {
      const tilesWagerAmount = parseInt(tilesWagerInput.value) || 0
      const playerTiles = this.state.tiles
      
      tilesWagerInput.max = playerTiles.toString()
      
      if (tilesWagerAmount > playerTiles) {
        tilesWagerInput.value = playerTiles.toString()
        tilesWagerInput.classList.add('invalid')
      } else {
        tilesWagerInput.classList.remove('invalid')
      }
      
      updateStartButtonVisibility()
    })
    
    // Function to update start button visibility based on all wager inputs
    const updateStartButtonVisibility = () => {
      const moneyWager = parseInt(wagerInput.value) || 0
      const diamondWager = parseInt(diamondWagerInput.value) || 0
      const emeraldWager = parseInt(emeraldWagerInput.value) || 0
      const tilesWager = parseInt(tilesWagerInput.value) || 0
      
      const hasValidMoneyWager = moneyWager >= 0 && moneyWager <= this.state.money
      const hasValidDiamondWager = diamondWager >= 0 && diamondWager <= this.state.diamonds
      const hasValidEmeraldWager = emeraldWager >= 0 && emeraldWager <= this.state.emeralds
      const hasValidTilesWager = tilesWager >= 0 && tilesWager <= this.state.tiles
      
      // Check if at least one currency is wagered (> 0) and all wagers are valid
      const hasAnyCurrencyWagered = moneyWager > 0 || diamondWager > 0 || emeraldWager > 0 || tilesWager > 0
      const allWagersValid = hasValidMoneyWager && hasValidDiamondWager && hasValidEmeraldWager && hasValidTilesWager
      
      // Only show start button if at least one currency is wagered AND all wagers are valid
      if (hasAnyCurrencyWagered && allWagersValid) {
        startButton.style.display = 'block'
      } else {
        startButton.style.display = 'none'
      }
    }
    
    // Add special wager container to main wager section
    wagerSection.appendChild(specialWagerContainer)
    
    // Bomb Slider Section (only show if unlocked)
    const bombSliderContainer = document.createElement('div')
    bombSliderContainer.className = 'bomb-slider-container'
    bombSliderContainer.style.display = 'none'
    
    const bombSliderLabel = document.createElement('label')
    bombSliderLabel.className = 'bomb-slider-label'
    bombSliderLabel.textContent = '💣'
    
    const bombSliderWrapper = document.createElement('div')
    bombSliderWrapper.className = 'bomb-slider-wrapper'
    
    const bombSlider = document.createElement('input')
    bombSlider.type = 'range'
    bombSlider.className = 'bomb-slider'
    bombSlider.min = '1'
    bombSlider.max = '24'
    bombSlider.value = this.state.bombCount.toString()
    
    const bombSliderValue = document.createElement('span')
    bombSliderValue.className = 'bomb-slider-value'
    
    const diamondPercentageDisplay = document.createElement('div')
    diamondPercentageDisplay.className = 'diamond-percentage-display'
    
    const updateBombSliderDisplay = () => {
      const bombCount = parseInt(bombSlider.value)
      const bonusPercentage = this.getBonusPercentage(bombCount)
      bombSliderValue.textContent = `${bombCount} bombs`
      diamondPercentageDisplay.textContent = `${bonusPercentage}% bonus per diamond`
      this.state.bombCount = bombCount
    }
    
    bombSlider.addEventListener('input', updateBombSliderDisplay)
    updateBombSliderDisplay() // Initialize display
    
    bombSliderWrapper.appendChild(bombSlider)
    bombSliderWrapper.appendChild(bombSliderValue)
    bombSliderWrapper.appendChild(diamondPercentageDisplay)
    bombSliderContainer.appendChild(bombSliderLabel)
    bombSliderContainer.appendChild(bombSliderWrapper)
    
    wagerSection.appendChild(bombSliderContainer)
    
    // Store references for dynamic visibility and validation control
    ;(degenScene as any).diamondWagerContainer = diamondWagerContainer
    ;(degenScene as any).emeraldWagerContainer = emeraldWagerContainer
    ;(degenScene as any).tilesWagerContainer = tilesWagerContainer
    ;(degenScene as any).diamondWagerInput = diamondWagerInput
    ;(degenScene as any).emeraldWagerInput = emeraldWagerInput
    ;(degenScene as any).tilesWagerInput = tilesWagerInput
    ;(degenScene as any).moneyWagerInput = wagerInput
    ;(degenScene as any).bombSliderContainer = bombSliderContainer

    // Diamond Shop button
    const diamondShopButton = document.createElement('button')
    diamondShopButton.className = 'diamond-shop-button'
    diamondShopButton.textContent = 'DIAMOND SHOP'
    
    diamondShopButton.addEventListener('click', () => {
      this.diamondShop.openDiamondShop()
    })
    
    // Back button
    const backButton = document.createElement('button')
    backButton.className = 'back-button'
    backButton.textContent = 'BACK'
    
    backButton.addEventListener('click', () => {
      this.closeDegenDiamonds()
    })
    
    degenScene.appendChild(title)
    degenScene.appendChild(wagerSection)
    degenScene.appendChild(startButton)
    degenScene.appendChild(diamondShopButton)
    degenScene.appendChild(backButton)
    
    app.appendChild(degenScene)
    this.degenDiamondsScene = degenScene
  }

  private updateDiamondWagerVisibility(): void {
    if (this.degenDiamondsScene) {
      const diamondWagerContainer = (this.degenDiamondsScene as any).diamondWagerContainer
      const diamondWagerInput = (this.degenDiamondsScene as any).diamondWagerInput
      
      if (diamondWagerContainer && diamondWagerInput) {
        if (this.state.diamonds > 0) {
          diamondWagerContainer.style.display = 'block'
          // Update max value to current diamond count
          diamondWagerInput.max = this.state.diamonds.toString()
        } else {
          diamondWagerContainer.style.display = 'none'
        }
      }
    }
  }

  private updateEmeraldWagerVisibility(): void {
    if (this.degenDiamondsScene) {
      const emeraldWagerContainer = (this.degenDiamondsScene as any).emeraldWagerContainer
      const emeraldWagerInput = (this.degenDiamondsScene as any).emeraldWagerInput
      
      if (emeraldWagerContainer && emeraldWagerInput) {
        if (this.state.emeralds > 0) {
          emeraldWagerContainer.style.display = 'block'
          // Update max value to current emerald count
          emeraldWagerInput.max = this.state.emeralds.toString()
        } else {
          emeraldWagerContainer.style.display = 'none'
        }
      }
    }
  }

  private updateTilesWagerVisibility(): void {
    if (this.degenDiamondsScene) {
      const tilesWagerContainer = (this.degenDiamondsScene as any).tilesWagerContainer
      const tilesWagerInput = (this.degenDiamondsScene as any).tilesWagerInput
      
      if (tilesWagerContainer && tilesWagerInput) {
        if (this.state.tiles > 0) {
          tilesWagerContainer.style.display = 'block'
          // Update max value to current tiles count
          tilesWagerInput.max = this.state.tiles.toString()
        } else {
          tilesWagerContainer.style.display = 'none'
        }
      }
    }
  }

  private resetWagerInputs(): void {
    if (this.degenDiamondsScene) {
      // Get money wager input (stored as a reference on the scene)
      const moneyWagerInput = (this.degenDiamondsScene as any).moneyWagerInput
      const diamondWagerInput = (this.degenDiamondsScene as any).diamondWagerInput
      const emeraldWagerInput = (this.degenDiamondsScene as any).emeraldWagerInput
      const tilesWagerInput = (this.degenDiamondsScene as any).tilesWagerInput
      
      if (moneyWagerInput) {
        moneyWagerInput.value = '0'
        moneyWagerInput.max = this.state.money.toString()
        moneyWagerInput.classList.remove('invalid')
      }
      
      if (diamondWagerInput) {
        diamondWagerInput.value = '0'
        diamondWagerInput.max = this.state.diamonds.toString()
        diamondWagerInput.classList.remove('invalid')
      }
      
      if (emeraldWagerInput) {
        emeraldWagerInput.value = '0'
        emeraldWagerInput.max = this.state.emeralds.toString()
        emeraldWagerInput.classList.remove('invalid')
      }
      
      if (tilesWagerInput) {
        tilesWagerInput.value = '0'
        tilesWagerInput.max = this.state.tiles.toString()
        tilesWagerInput.classList.remove('invalid')
      }
      
      console.log(`Reset wager inputs - Max money: $${this.state.money}, Max diamonds: 💎${this.state.diamonds}, Max emeralds: ${this.state.emeralds}, Max tiles: 🟦${this.state.tiles}`)
    }
  }

  private updateBombSliderVisibility(): void {
    if (this.degenDiamondsScene) {
      const bombSliderContainer = (this.degenDiamondsScene as any).bombSliderContainer
      
      if (bombSliderContainer) {
        if (this.state.bombSliderUnlocked) {
          bombSliderContainer.style.display = 'block'
        } else {
          bombSliderContainer.style.display = 'none'
        }
      }
    }
  }

  public openDegenDiamonds(): void {
    if (!this.degenDiamondsScene) {
      this.createDegenDiamondsScene()
    }
    
    // Update diamond wager visibility based on current diamond count
    this.updateDiamondWagerVisibility()
    
    // Update emerald wager visibility based on current emerald count
    this.updateEmeraldWagerVisibility()
    
    // Update tiles wager visibility based on current tiles count
    this.updateTilesWagerVisibility()
    
    // Update bomb slider visibility based on unlock status
    this.updateBombSliderVisibility()
    
    // Reset wager inputs to current available amounts
    this.resetWagerInputs()
    
    // Refresh all currency displays to ensure they're visible on this screen
    this.refreshAllCurrencyDisplays()
    
    // Explicitly show and position all currency elements for this screen
    this.ensureCurrencyElementsVisible()
    
    const uiElements = this.ui.getElements()
    if (uiElements.gameView) {
      uiElements.gameView.style.display = 'none'
    }
    
    this.degenDiamondsScene!.style.display = 'block'
    this.state.isInDegenDiamonds = true
    console.log('Opened Degen Diamonds scene')
  }

  public closeDegenDiamonds(): void {
    if (this.degenDiamondsScene) {
      this.degenDiamondsScene.style.display = 'none'
    }
    
    this.restoreMainUI()
    this.state.isInDegenDiamonds = false
    console.log('Closed Degen Diamonds scene')
  }

  private createDiamondGameScene(): void {
    const app = document.querySelector<HTMLDivElement>('#app')!
    
    const gameScene = document.createElement('div')
    gameScene.className = 'diamond-game-container'
    gameScene.style.display = 'none'
    
    // Game title
    const title = document.createElement('h2')
    title.className = 'diamond-game-title'
    title.textContent = '💎 DEGEN DIAMONDS 💎'
    
    // Grid container
    const gridContainer = document.createElement('div')
    gridContainer.className = 'diamond-grid-container'
    
    // Create 5x5 grid
    const grid = document.createElement('div')
    grid.className = 'diamond-grid'
    
    // Generate random bomb positions based on bomb count
    const bombPositions = new Set<number>()
    while (bombPositions.size < this.state.bombCount) {
      bombPositions.add(Math.floor(Math.random() * 25))
    }
    
    // Calculate bonus percentage based on bomb count
    const bonusPercentage = this.getBonusPercentage(this.state.bombCount) / 100 // Convert percentage to decimal
    
    let currentPayout = this.currentWager // Payout starts at wager amount
    let currentMoneyBonus = 0 // Track fractional money bonus separately
    let currentDiamondPayout = this.currentDiamondWager // Start with wagered diamonds
    let currentDiamondBonus = 0 // Track fractional diamond bonus separately
    let currentEmeraldPayout = this.currentEmeraldWager // Start with wagered emeralds
    let currentEmeraldBonus = 0 // Track fractional emerald bonus separately
    let currentTilePayout = this.currentTileWager // Start with wagered tiles
    let currentTileBonus = 0 // Track fractional tile bonus separately
    let gameOver = false
    
    // Create 5x5 grid with rows
    for (let row = 0; row < 5; row++) {
      const rowElement = document.createElement('div')
      rowElement.className = 'diamond-grid-row'
      
      for (let col = 0; col < 5; col++) {
        const i = row * 5 + col
        const square = document.createElement('div')
        square.className = 'diamond-grid-square'
        square.textContent = '⬜' // Glass square emoji
        square.dataset.index = i.toString()
        square.dataset.isBomb = bombPositions.has(i).toString()
        
        square.addEventListener('click', () => {
          if (gameOver || square.classList.contains('revealed')) return
          
          square.classList.add('revealed')
          
          if (bombPositions.has(i)) {
            // Hit bomb - show explosion on clicked square immediately
            square.textContent = '💥'
            square.classList.add('explosion')
            
            // Start game over sequence
            gameOver = true
            currentPayout = 0
            currentMoneyBonus = 0
            currentDiamondPayout = 0 // Lose diamond wager too
            currentDiamondBonus = 0
            currentEmeraldPayout = 0 // Lose emerald wager too
            currentEmeraldBonus = 0
            currentTilePayout = 0 // Lose tile wager too
            currentTileBonus = 0
            this.updatePayout(currentPayout, currentDiamondPayout, currentEmeraldPayout, currentTilePayout)
            
            // Reveal all other squares
            this.revealAllSquares(grid, bombPositions, i)
            
            // Show "You Lost" message after a delay
            setTimeout(() => {
              this.showGameOverMessage(gridContainer)
            }, 1500) // 1.5 second delay to see all revealed squares
            
          } else {
            // Hit diamond
            square.textContent = '💎'
            square.classList.add('diamond')
            currentMoneyBonus += this.currentWager * bonusPercentage // Accumulate fractional money bonus
            currentDiamondBonus += this.currentDiamondWager * bonusPercentage + 1 // Accumulate fractional diamond bonus + 1 flat diamond
            // Only give emerald bonus if emeralds were actually wagered
            if (this.currentEmeraldWager > 0) {
              currentEmeraldBonus += this.currentEmeraldWager * bonusPercentage + 0.5 // Accumulate fractional emerald bonus + 0.5 flat emerald
            }
            // Only give tile bonus if tiles were actually wagered
            if (this.currentTileWager > 0) {
              currentTileBonus += this.currentTileWager * bonusPercentage + 0.25 // Accumulate fractional tile bonus + 0.25 flat tile
            }
            currentPayout = this.currentWager + currentMoneyBonus // Wager + bonus money (show decimals)
            currentDiamondPayout = this.currentDiamondWager + currentDiamondBonus // Wager + bonus diamonds (show decimals)
            currentEmeraldPayout = this.currentEmeraldWager + currentEmeraldBonus // Wager + bonus emeralds (show decimals)
            currentTilePayout = this.currentTileWager + currentTileBonus // Wager + bonus tiles (show decimals)
            this.updatePayout(currentPayout, currentDiamondPayout, currentEmeraldPayout, currentTilePayout)
          }
        })
        
        rowElement.appendChild(square)
      }
      
      grid.appendChild(rowElement)
    }
    
    gridContainer.appendChild(grid)
    
    // Payout display
    const payoutContainer = document.createElement('div')
    payoutContainer.className = 'payout-container'
    
    const payoutLabel = document.createElement('div')
    payoutLabel.className = 'payout-label'
    payoutLabel.textContent = 'Payout:'
    
    const payoutAmount = document.createElement('div')
    payoutAmount.className = 'payout-amount'
    let initialPayoutText = `$${currentPayout.toFixed(2)} + 💎${currentDiamondPayout.toFixed(2)}`
    
    if (this.currentEmeraldWager > 0) {
      initialPayoutText += ` + <img src="/assets/emerald.png" style="width: 16px; height: 16px; vertical-align: middle; margin: 0 2px;">${currentEmeraldPayout.toFixed(2)}`
    }
    
    if (this.currentTileWager > 0) {
      initialPayoutText += ` + 🟦${currentTilePayout.toFixed(2)}`
    }
    
    payoutAmount.innerHTML = initialPayoutText
    
    payoutContainer.appendChild(payoutLabel)
    payoutContainer.appendChild(payoutAmount)
    
    // Leave button
    const leaveButton = document.createElement('button')
    leaveButton.className = 'diamond-leave-button'
    leaveButton.textContent = 'LEAVE'
    
    leaveButton.addEventListener('click', () => {
      // Award payout - full amount if game not over, nothing if you hit a bomb
      if (!gameOver) {
        const finalPayout = this.currentWager + Math.round(currentMoneyBonus * 100) / 100 // Round to nearest cent
        this.state.money += Math.floor(finalPayout) // Award whole dollars only to the player's money
        this.ui.updateMoneyCounter(this.state.money)
        
        // Return diamond wager + any found diamonds (rounded down)
        const finalDiamondPayout = this.currentDiamondWager + Math.round(currentDiamondBonus * 100) / 100
        if (finalDiamondPayout > 0) {
          this.addDiamonds(Math.floor(finalDiamondPayout))
        }
        
        // Return emerald wager + any found emeralds (rounded down)
        const finalEmeraldPayout = this.currentEmeraldWager + Math.round(currentEmeraldBonus * 100) / 100
        if (finalEmeraldPayout > 0) {
          this.addEmeralds(Math.floor(finalEmeraldPayout))
        }
        
        // Return tile wager + any found tiles (rounded down)
        const finalTilePayout = this.currentTileWager + Math.round(currentTileBonus * 100) / 100
        if (finalTilePayout > 0) {
          this.addTiles(Math.floor(finalTilePayout))
        }
      }
      // If game over (hit bomb), lose everything including diamond, emerald, and tile wagers
      this.closeDiamondGameScene()
    })
    
    gameScene.appendChild(title)
    gameScene.appendChild(gridContainer)
    gameScene.appendChild(payoutContainer)
    gameScene.appendChild(leaveButton)
    
    app.appendChild(gameScene)
    this.diamondGameScene = gameScene
    
    // Store references for payout updates
    ;(gameScene as any).payoutAmount = payoutAmount
    ;(gameScene as any).currentPayout = currentPayout
    ;(gameScene as any).currentDiamondPayout = currentDiamondPayout
  }

  private revealAllSquares(grid: HTMLElement, bombPositions: Set<number>, clickedBombIndex: number): void {
    const squares = grid.querySelectorAll('.diamond-grid-square')
    
    squares.forEach((square, index) => {
      if (!square.classList.contains('revealed')) {
        square.classList.add('revealed')
        
        if (bombPositions.has(index)) {
          // This is a bomb
          if (index === clickedBombIndex) {
            // The bomb that was clicked - show explosion
            square.textContent = '💥'
            square.classList.add('explosion')
          } else {
            // Other bombs - show regular bomb
            square.textContent = '💣'
            square.classList.add('bomb')
          }
        } else {
          // This is a diamond
          square.textContent = '💎'
          square.classList.add('diamond')
        }
      }
    })
  }

  private showGameOverMessage(gridContainer: HTMLElement): void {
    gridContainer.innerHTML = ''
    const gameOverMessage = document.createElement('div')
    gameOverMessage.className = 'game-over-message'
    gameOverMessage.textContent = 'You Lost:('
    gridContainer.appendChild(gameOverMessage)
  }

  private updatePayout(moneyAmount: number, diamonds: number, emeralds?: number, tiles?: number): void {
    if (this.diamondGameScene) {
      const payoutElement = (this.diamondGameScene as any).payoutAmount
      if (payoutElement) {
        let payoutText = `$${moneyAmount.toFixed(2)} + 💎${diamonds.toFixed(2)}`
        
        if (emeralds !== undefined && emeralds > 0) {
          payoutText += ` + <img src="/assets/emerald.png" style="width: 16px; height: 16px; vertical-align: middle; margin: 0 2px;">${emeralds.toFixed(2)}`
        }
        
        if (tiles !== undefined && tiles > 0) {
          payoutText += ` + 🟦${tiles.toFixed(2)}`
        }
        
        payoutElement.innerHTML = payoutText
      }
    }
  }

  private openDiamondGameScene(): void {
    // Always deduct the wagers from player's money, diamonds, emeralds, and tiles when starting a new game
    console.log(`Deducting wager: $${this.currentWager} + 💎${this.currentDiamondWager} + emeralds${this.currentEmeraldWager} + 🟦${this.currentTileWager} from current money: $${this.state.money}, diamonds: ${this.state.diamonds}, emeralds: ${this.state.emeralds}, tiles: ${this.state.tiles}`)
    this.state.money -= this.currentWager
    this.state.diamonds -= this.currentDiamondWager
    this.state.emeralds -= this.currentEmeraldWager
    this.state.tiles -= this.currentTileWager
    this.refreshAllCurrencyDisplays()
    console.log(`After deduction - Money: $${this.state.money}, Diamonds: ${this.state.diamonds}, Emeralds: ${this.state.emeralds}, Tiles: ${this.state.tiles}`)
    
    // Always create a fresh scene to ensure clean game state
    if (this.diamondGameScene) {
      this.diamondGameScene.remove()
      this.diamondGameScene = null
    }
    this.createDiamondGameScene()
    
    if (this.degenDiamondsScene) {
      this.degenDiamondsScene.style.display = 'none'
    }
    
    this.diamondGameScene!.style.display = 'block'
    console.log('Opened Diamond Game Scene')
  }

  private closeDiamondGameScene(): void {
    if (this.diamondGameScene) {
      this.diamondGameScene.style.display = 'none'
      // Remove the scene to reset for next game
      this.diamondGameScene.remove()
      this.diamondGameScene = null
    }
    
    if (this.degenDiamondsScene) {
      this.degenDiamondsScene.style.display = 'block'
      // Update all wager visibility in case currency counts changed
      this.updateDiamondWagerVisibility()
      this.updateEmeraldWagerVisibility()
      this.updateTilesWagerVisibility()
      
      // Update all currency displays to reflect current state after game
      this.refreshAllCurrencyDisplays()
      
      // Reset wager input fields to prevent betting more than you have
      this.resetWagerInputs()
    }
    
    console.log('Closed Diamond Game Scene')
  }

  public openLetterGame(): void {
    console.log('🎮 Opening Letter Game scene...')
    try {
      if (!this.letterGameScene) {
        this.createLetterGameScene()
      }
      
      // Hide main UI
      const elements = this.ui.getElements()
      if (elements.gameView) {
        elements.gameView.style.display = 'none'
      }
      
      // Refresh all currency displays to ensure they're visible on this screen
      this.refreshAllCurrencyDisplays()
      
      // Explicitly show and position all currency elements for this screen
      this.ensureCurrencyElementsVisible()
      
      this.letterGameScene!.style.display = 'block'
      this.setLetterGameLaunchState(true)
      console.log('✅ Letter Game scene opened successfully')
    } catch (error) {
      console.error('❌ Error opening Letter Game scene:', error)
    }
  }

  private createLetterGameScene(): void {
    const app = document.querySelector<HTMLDivElement>('#app')!
    
    const letterScene = document.createElement('div')
    letterScene.className = 'letter-game-scene'
    letterScene.style.display = 'none'
    letterScene.style.position = 'absolute'
    letterScene.style.top = '0'
    letterScene.style.left = '0'
    letterScene.style.width = '100vw'
    letterScene.style.height = '100vh'
    letterScene.style.background = 'linear-gradient(135deg, #4a90e2 0%, #7b68ee 100%)'
    letterScene.style.zIndex = '200'
    letterScene.style.display = 'flex'
    letterScene.style.flexDirection = 'column'
    letterScene.style.alignItems = 'center'
    letterScene.style.justifyContent = 'center'
    letterScene.style.padding = '40px 20px'
    letterScene.style.overflowY = 'auto'
    
    // Scene title
    const title = document.createElement('h2')
    title.style.color = '#ffffff'
    title.style.fontSize = '3rem'
    title.style.fontWeight = 'bold'
    title.style.textShadow = '0 0 30px rgba(123, 104, 238, 0.8)'
    title.style.marginBottom = '3rem'
    title.style.letterSpacing = '0.1em'
    title.style.textAlign = 'center'
    title.textContent = '🎲 LETTER GAME 🎲'
    
    // Description
    const description = document.createElement('div')
    description.style.color = '#e1f5fe'
    description.style.fontSize = '1.2rem'
    description.style.textAlign = 'center'
    description.style.maxWidth = '600px'
    description.style.lineHeight = '1.6'
    description.style.marginBottom = '2rem'
    description.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.5)'
    description.innerHTML = `
      <p>Make words from letter tiles to earn the new <strong>Tiles</strong> currency!</p>
      <p>Each tile has a <span style="color: #1976d2">chip value</span> and a <span style="color: #d32f2f">multiplier</span>.</p>
      <p>Score = (Total Chip Value) × (Total Multiplier)</p>
    `
    
    // Start button
    const startButton = document.createElement('button')
    startButton.style.background = 'linear-gradient(45deg, #00ff88, #00cc6a)'
    startButton.style.color = '#001a00'
    startButton.style.border = 'none'
    startButton.style.padding = '15px 40px'
    startButton.style.borderRadius = '12px'
    startButton.style.fontSize = '1.2rem'
    startButton.style.fontWeight = 'bold'
    startButton.style.cursor = 'pointer'
    startButton.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.3)'
    startButton.style.boxShadow = '0 4px 20px rgba(0, 255, 136, 0.4)'
    startButton.style.transition = 'all 0.3s ease'
    startButton.style.marginBottom = '20px'
    startButton.textContent = 'START GAME'
    
    startButton.addEventListener('mouseenter', () => {
      startButton.style.transform = 'translateY(-2px)'
      startButton.style.boxShadow = '0 6px 25px rgba(0, 255, 136, 0.6)'
    })
    
    startButton.addEventListener('mouseleave', () => {
      startButton.style.transform = 'translateY(0)'
      startButton.style.boxShadow = '0 4px 20px rgba(0, 255, 136, 0.4)'
    })
    
    startButton.addEventListener('click', () => {
      this.openActualLetterGame()
    })
    
    // Back button
    const backButton = document.createElement('button')
    backButton.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a24)'
    backButton.style.color = 'white'
    backButton.style.border = 'none'
    backButton.style.padding = '12px 30px'
    backButton.style.borderRadius = '10px'
    backButton.style.fontSize = '1.1rem'
    backButton.style.fontWeight = 'bold'
    backButton.style.cursor = 'pointer'
    backButton.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.3)'
    backButton.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)'
    backButton.style.transition = 'all 0.3s ease'
    backButton.textContent = 'BACK'
    
    backButton.addEventListener('mouseenter', () => {
      backButton.style.transform = 'translateY(-2px)'
      backButton.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)'
    })
    
    backButton.addEventListener('mouseleave', () => {
      backButton.style.transform = 'translateY(0)'
      backButton.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)'
    })
    
    backButton.addEventListener('click', () => {
      this.closeLetterGame()
    })
    
    // Tile Shop button
    const tileShopButton = document.createElement('button')
    tileShopButton.style.position = 'absolute'
    tileShopButton.style.bottom = '20px'
    tileShopButton.style.left = '20px'
    tileShopButton.style.background = 'linear-gradient(45deg, #2196f3, #1976d2)'
    tileShopButton.style.color = 'white'
    tileShopButton.style.border = 'none'
    tileShopButton.style.padding = '15px 25px'
    tileShopButton.style.borderRadius = '10px'
    tileShopButton.style.fontSize = '1.1rem'
    tileShopButton.style.fontWeight = 'bold'
    tileShopButton.style.cursor = 'pointer'
    tileShopButton.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.3)'
    tileShopButton.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)'
    tileShopButton.style.transition = 'all 0.3s ease'
    tileShopButton.textContent = '🟦 TILE SHOP'
    
    tileShopButton.addEventListener('mouseenter', () => {
      tileShopButton.style.transform = 'translateY(-2px)'
      tileShopButton.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)'
      tileShopButton.style.background = 'linear-gradient(45deg, #42a5f5, #1e88e5)'
    })
    
    tileShopButton.addEventListener('mouseleave', () => {
      tileShopButton.style.transform = 'translateY(0)'
      tileShopButton.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)'
      tileShopButton.style.background = 'linear-gradient(45deg, #2196f3, #1976d2)'
    })
    
    tileShopButton.addEventListener('click', () => {
      this.tileShop.openTileShop()
    })
    
    letterScene.appendChild(title)
    letterScene.appendChild(description)
    letterScene.appendChild(startButton)
    letterScene.appendChild(tileShopButton)
    letterScene.appendChild(backButton)
    
    app.appendChild(letterScene)
    this.letterGameScene = letterScene
  }

  private openActualLetterGame(): void {
    console.log('🎮 Starting actual Letter Game...')
    try {
      // Hide the letter game scene
      this.letterGameScene!.style.display = 'none'
      this.setLetterGameLaunchState(false)
      
      // Open the actual letter game
      this.letterGame.openGame()
      this.setLetterGameState(true)
      console.log('✅ Actual Letter Game started successfully')
    } catch (error) {
      console.error('❌ Error starting actual Letter Game:', error)
    }
  }

  private closeLetterGame(): void {
    console.log('🔙 Closing Letter Game scene...')
    try {
      // Hide letter game scene
      if (this.letterGameScene) {
        this.letterGameScene.style.display = 'none'
      }
      
      // Reset states
      this.setLetterGameLaunchState(false)
      this.setLetterGameState(false)
      
      // Show main UI and restore all currency counters
      this.restoreMainUI()
      
      console.log('✅ Letter Game scene closed successfully')
    } catch (error) {
      console.error('❌ Error closing Letter Game scene:', error)
    }
  }

  private restoreMainUI(): void {
    const elements = this.ui.getElements()
    
    // Show main game view
    if (elements.gameView) {
      elements.gameView.style.display = 'block'
    }
    
    // Update and show all currency counters based on current state
    this.refreshAllCurrencyDisplays()
    
    // Show health bar
    if (elements.healthBarContainer) {
      elements.healthBarContainer.style.display = 'block'
    }
    
    // Show buttons that should be visible on main screen
    const allButtons = document.querySelectorAll<HTMLElement>('.shop-button, .degen-diamonds-button, .snake-button, .letter-game-button, .tile-shop-button')
    allButtons.forEach(button => {
      button.style.display = 'block'
    })
  }

  public returnToLetterGameLaunch(): void {
    console.log('🔙 Returning to Letter Game launch screen...')
    try {
      // Show the letter game launch scene
      if (this.letterGameScene) {
        this.letterGameScene.style.display = 'block'
        this.setLetterGameLaunchState(true)
      }
      
      // Refresh all currency displays to ensure they're visible on this screen
      this.refreshAllCurrencyDisplays()
      
      // Explicitly show and position all currency elements for this screen
      this.ensureCurrencyElementsVisible()
      
      console.log('✅ Returned to Letter Game launch screen successfully')
    } catch (error) {
      console.error('❌ Error returning to Letter Game launch screen:', error)
    }
  }

  public openSnakeGame(): void {
    if (!this.snakeGameScene) {
      this.createSnakeGameScene()
    }
    
    // Update button states with current diamond count
    if ((this.snakeGameScene as any).updateButtonStates) {
      ;(this.snakeGameScene as any).updateButtonStates()
    }
    
    // Update the snake game's lives if it already exists
    if (this.snakeGame) {
      this.snakeGame.extraLives = this.snakeShop.getUpgradeLevel('ghost-mode');
      this.snakeGame.livesLeft = 1 + this.snakeGame.extraLives;
      this.snakeGame.updateLivesDisplay();
      console.log('Updated snake lives on open - Extra lives:', this.snakeGame.extraLives, 'Total lives:', this.snakeGame.livesLeft);
    }
    
    const elements = this.ui.getElements()
    if (elements.gameView) {
      elements.gameView.style.display = 'none'
    }
    
    // Refresh all currency displays to ensure they're visible on this screen
    this.refreshAllCurrencyDisplays()
    
    // Explicitly show and position all currency elements for this screen
    this.ensureCurrencyElementsVisible()
    
    this.snakeGameScene!.style.display = 'block'
    this.state.isInSnakeGame = true
    console.log('Opened Snake Game')
  }

  private closeSnakeGame(): void {
    if (this.snakeGameScene) {
      this.snakeGameScene.style.display = 'none'
    }
    
    this.restoreMainUI()
    this.state.isInSnakeGame = false
    console.log('Closed Snake Game')
  }

  private createSnakeGameScene(): void {
    const app = document.querySelector<HTMLDivElement>('#app')!
    
    const snakeScene = document.createElement('div')
    snakeScene.className = 'snake-game-container'
    snakeScene.style.display = 'none'
    
    // Scene title
    const title = document.createElement('h2')
    title.className = 'snake-title'
    title.textContent = '🐍 SNAKE GAME 🐍'
    title.style.color = '#ffffff'
    title.style.fontSize = '2.2rem'
    title.style.fontWeight = 'bold'
    title.style.textShadow = '0 0 30px rgba(76, 175, 80, 0.8)'
    title.style.margin = '0 0 15px 0'
    title.style.letterSpacing = '0.1em'
    title.style.textAlign = 'center'
    title.style.animation = 'glow-green-snake 2s ease-in-out infinite alternate'
    
    // Game info section
    const gameInfo = document.createElement('div')
    gameInfo.className = 'snake-game-info'
    
    const scoreDisplay = document.createElement('div')
    scoreDisplay.className = 'snake-score'
    scoreDisplay.textContent = 'Score: 0'
    
    const healthDisplay = document.createElement('div')
    healthDisplay.className = 'snake-health-container'
    
    const healthLabel = document.createElement('div')
    healthLabel.className = 'snake-health-label'
    healthLabel.textContent = 'Health'
    
    const healthBarBackground = document.createElement('div')
    healthBarBackground.className = 'snake-health-bar-background'
    
    const healthBarFill = document.createElement('div')
    healthBarFill.className = 'snake-health-bar-fill'
    
    const healthBarText = document.createElement('div')
    healthBarText.className = 'snake-health-bar-text'
    healthBarText.textContent = '20/20'
    
    healthBarBackground.appendChild(healthBarFill)
    healthBarBackground.appendChild(healthBarText)
    healthDisplay.appendChild(healthLabel)
    healthDisplay.appendChild(healthBarBackground)
    
    const rewardDisplay = document.createElement('div')
    rewardDisplay.className = 'snake-reward'
    
    // Create reward display with emerald icon
    const rewardLabel = document.createElement('span')
    rewardLabel.textContent = 'Reward: '
    
    const emeraldIcon = document.createElement('img')
    emeraldIcon.src = '/assets/emerald.png'
    emeraldIcon.className = 'emerald-icon-small'
    emeraldIcon.style.width = '16px'
    emeraldIcon.style.height = '16px'
    emeraldIcon.style.marginRight = '3px'
    emeraldIcon.style.verticalAlign = 'middle'
    
    const rewardCount = document.createElement('span')
    rewardCount.textContent = '0'
    
    rewardDisplay.appendChild(rewardLabel)
    rewardDisplay.appendChild(emeraldIcon)
    rewardDisplay.appendChild(rewardCount)
    
    gameInfo.appendChild(scoreDisplay)
    gameInfo.appendChild(healthDisplay)
    gameInfo.appendChild(rewardDisplay)
    
    // Game canvas
    const gameCanvas = document.createElement('canvas')
    gameCanvas.className = 'snake-canvas'
    gameCanvas.width = 400
    gameCanvas.height = 400
    
    // Game controls info
    const controlsInfo = document.createElement('div')
    controlsInfo.className = 'snake-controls'
    controlsInfo.textContent = 'Use WASD or Arrow Keys to move'
    
    // Game buttons
    const buttonContainer = document.createElement('div')
    buttonContainer.className = 'snake-buttons'
    
    const startButton = document.createElement('button')
    startButton.className = 'snake-start-button'
    startButton.textContent = 'START GAME (for 💎10)'
    
    const restartButton = document.createElement('button')
    restartButton.className = 'snake-restart-button'
    restartButton.textContent = 'RESTART (for 💎10)'
    restartButton.style.display = 'none'
    
    const snakeShopButton = document.createElement('button')
    snakeShopButton.className = 'snake-shop-button'
    snakeShopButton.textContent = '🐍 SHOP'
    
    const backButton = document.createElement('button')
    backButton.className = 'snake-back-button'
    backButton.textContent = 'BACK'
    
    buttonContainer.appendChild(startButton)
    buttonContainer.appendChild(restartButton)
    
    // Initialize snake game logic
    const canvasWrapper = document.createElement('div');
    canvasWrapper.className = 'snake-canvas-wrapper';
    canvasWrapper.style.display = 'flex';
    canvasWrapper.style.flexDirection = 'column';
    canvasWrapper.style.alignItems = 'center';
    canvasWrapper.style.width = '100%';
    canvasWrapper.style.marginBottom = '10px';
    canvasWrapper.appendChild(gameCanvas);
    const snakeGame = new SnakeGame(gameCanvas, scoreDisplay, rewardDisplay, startButton, restartButton, this, healthDisplay, canvasWrapper);
    
    // Update button states based on diamond availability
    const updateButtonStates = () => {
      const canAfford = this.state.diamonds >= 10
      if (!canAfford) {
        if (startButton.style.display !== 'none') {
          startButton.textContent = 'Need 💎10 to Play'
          startButton.style.opacity = '0.6'
          startButton.style.cursor = 'not-allowed'
        }
        if (restartButton.style.display !== 'none') {
          restartButton.textContent = 'Need 💎10 to Play'
          restartButton.style.opacity = '0.6'
          restartButton.style.cursor = 'not-allowed'
        }
      } else {
        if (startButton.style.display !== 'none') {
          startButton.textContent = 'START GAME (for 💎10)'
          startButton.style.opacity = '1'
          startButton.style.cursor = 'pointer'
        }
        if (restartButton.style.display !== 'none') {
          restartButton.textContent = 'RESTART (for 💎10)'
          restartButton.style.opacity = '1'
          restartButton.style.cursor = 'pointer'
        }
      }
    }
    
    // Initial update
    updateButtonStates()
    
    // Store reference for updates
    ;(snakeScene as any).updateButtonStates = updateButtonStates
    
    startButton.addEventListener('click', () => {
      if (this.state.diamonds >= 10) {
        this.spendDiamonds(10)
        snakeGame.startGame()
      } else {
        // Show insufficient diamonds message
        const currentText = startButton.textContent
        startButton.textContent = 'Need 💎10!'
        startButton.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a24)'
        setTimeout(() => {
          startButton.textContent = currentText
          startButton.style.background = 'linear-gradient(45deg, #4caf50, #2e7d32)'
        }, 1500)
      }
    })
    
    restartButton.addEventListener('click', () => {
      if (this.state.diamonds >= 10) {
        this.spendDiamonds(10)
        snakeGame.restartGame()
      } else {
        // Show insufficient diamonds message
        const currentText = restartButton.textContent
        restartButton.textContent = 'Need 💎10!'
        restartButton.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a24)'
        setTimeout(() => {
          restartButton.textContent = currentText
          restartButton.style.background = 'linear-gradient(45deg, #4caf50, #2e7d32)'
        }, 1500)
      }
    })
    
    snakeShopButton.addEventListener('click', () => {
      this.snakeShop.openSnakeShop()
    })

    backButton.addEventListener('click', () => {
      snakeGame.pauseGame()
      this.closeSnakeGame()
    })
    
    // Create content wrapper for better centering
    const contentWrapper = document.createElement('div')
    contentWrapper.className = 'snake-game-content'
    
    contentWrapper.appendChild(title)
    contentWrapper.appendChild(canvasWrapper)
    contentWrapper.appendChild(gameInfo)
    contentWrapper.appendChild(controlsInfo)
    contentWrapper.appendChild(buttonContainer)
    
    snakeScene.appendChild(contentWrapper)
    snakeScene.appendChild(snakeShopButton)
    snakeScene.appendChild(backButton)
    
    app.appendChild(snakeScene)
    this.snakeGameScene = snakeScene

    // In createSnakeGameScene(), after creating the snakeGame instance:
    this.snakeGame = snakeGame;
  }

  // Temporary method for testing - give player tiles
  public giveTestTiles(amount: number = 100): void {
    this.addTiles(amount)
    console.log(`🧪 Test: Added ${amount} tiles for testing purposes`)
  }

  // Temporary method for testing - unlock discard zone immediately  
  public unlockDiscardZoneForTesting(): void {
    this.addTiles(100)
    this.tileShop.purchaseTileUpgrade('trash-bucket')
    console.log('🧪 Test: Unlocked discard zone by giving tiles and purchasing trash bucket')
  }

  public increaseSnakeMaxHealth(amount: number): void {
    // If the snake game is running, update its maxHealth and health
    if (this.snakeGameScene && this.snakeGameScene.style.display === 'block' && this.snakeGame) {
      this.snakeGame.maxHealth += amount;
      this.snakeGame.health = this.snakeGame.maxHealth;
      this.snakeGame.updateHealthDisplay();
      console.log(`Snake max health increased to ${this.snakeGame.maxHealth}`);
    } else {
      // Otherwise, update the default for the next game
      this.state.maxHealth += amount;
      this.state.health = this.state.maxHealth;
      this.ui.updateHealthBar(this.state.health, this.state.maxHealth);
      console.log(`Snake max health increased to ${this.state.maxHealth}`);
    }
  }

  /**
   * Refresh mobile hover fix for dynamically added elements
   * Call this when creating new interactive elements like shops
   */
  public refreshMobileHoverFix(): void {
    if (window.mobileHoverFix) {
      window.mobileHoverFix.refresh()
    }
  }

  /**
   * Check if current device is mobile/touch enabled
   */
  public isMobileDevice(): boolean {
    if (window.mobileHoverFix) {
      return window.mobileHoverFix.isTouchDevice()
    }
    return false
  }

  /**
   * Manual test method to force show the shop button and test functionality
   */
  public testShopButton(): void {
    console.log('🧪 Testing shop button...')
    console.log('🧪 hasReachedZeroHealth:', this.state.hasReachedZeroHealth)
    
    // Force show the shop button for testing
    this.ui.showShopButton()
    
    // Test direct shop opening
    console.log('🧪 Testing direct shop open...')
    try {
      this.shop.openShop()
      console.log('🧪 Shop opened successfully')
    } catch (error) {
      console.error('🧪 Error opening shop:', error)
    }
  }

  /**
   * Force trigger the shop button to appear (for testing)
   */
  public forceShowShop(): void {
    console.log('🧪 Force showing shop button...')
    this.state.hasReachedZeroHealth = true
    this.ui.showShopButton()
  }

  /**
   * Debug the current state of the shop button
   */
  public debugShopButton(): void {
    console.log('🔍 Shop Button Debug Information:')
    console.log('hasReachedZeroHealth:', this.state.hasReachedZeroHealth)
    
    const elements = this.ui.getElements()
    if (elements.shopButton) {
      console.log('Shop button element exists:', !!elements.shopButton)
      console.log('Shop button display:', elements.shopButton.style.display)
      console.log('Shop button position:', {
        bottom: elements.shopButton.style.bottom,
        right: elements.shopButton.style.right,
        zIndex: elements.shopButton.style.zIndex
      })
      console.log('Shop button in DOM:', document.body.contains(elements.shopButton))
      console.log('Shop button class:', elements.shopButton.className)
      console.log('Shop button text:', elements.shopButton.textContent)
    } else {
      console.log('❌ Shop button element does not exist!')
    }
    
    // Check for all buttons in the DOM
    const allShopButtons = document.querySelectorAll('.shop-button')
    console.log('Total .shop-button elements found:', allShopButtons.length)
    allShopButtons.forEach((btn, index) => {
      console.log(`Button ${index}:`, {
        display: (btn as HTMLElement).style.display,
        text: btn.textContent,
        visible: (btn as HTMLElement).offsetWidth > 0
      })
         })
   }

   /**
    * Force cube health to zero and trigger shop button (for testing)
    */
   public forceCubeToZero(): void {
     console.log('🧪 Forcing cube health to zero...')
     this.state.health = 0
     this.ui.updateHealthBar(this.state.health, this.state.maxHealth)
     console.log('🧪 Starting cooldown (should trigger shop button)...')
     this.startCooldown()
   }
 }
 
 // Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const game = new MikecrementalGame()
  // Expose game instance for debugging and testing
  ;(window as any).game = game
}) 