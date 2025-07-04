interface TetrisPiece {
  shape: number[][]
  color: string
  x: number
  y: number
  type: string
}

interface TetrisPosition {
  x: number
  y: number
}

export class TetrisGame {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private scoreDisplay: HTMLElement
  private rewardDisplay: HTMLElement
  private startButton: HTMLElement
  private restartButton: HTMLElement
  private gameInstance: any
  private gameOverPopup: HTMLElement | null = null
  private pendingReward: number = 0
  
  private board: string[][] = []
  private currentPiece: TetrisPiece | null = null
  private nextPiece: TetrisPiece | null = null
  private score: number = 0
  private level: number = 1
  private lines: number = 0
  private isGameRunning: boolean = false
  private gameLoop: number | null = null
  private lastDropTime: number = 0
  private dropInterval: number = 1000 // Start at 1 second
  private sapphireImage: HTMLImageElement | null = null
  
  private readonly BOARD_WIDTH = 10
  private readonly BOARD_HEIGHT = 20
  private readonly CELL_SIZE = 20
  private readonly CANVAS_WIDTH = this.BOARD_WIDTH * this.CELL_SIZE
  private readonly CANVAS_HEIGHT = this.BOARD_HEIGHT * this.CELL_SIZE
  private wrapper: HTMLElement | null = null
  
  // Tetris pieces (tetrominoes)
  private pieces = {
    I: { shape: [[1,1,1,1]], color: '#00ffff' },
    O: { shape: [[1,1],[1,1]], color: '#ffff00' },
    T: { shape: [[0,1,0],[1,1,1]], color: '#800080' },
    S: { shape: [[0,1,1],[1,1,0]], color: '#00ff00' },
    Z: { shape: [[1,1,0],[0,1,1]], color: '#ff0000' },
    J: { shape: [[1,0,0],[1,1,1]], color: '#0000ff' },
    L: { shape: [[0,0,1],[1,1,1]], color: '#ffa500' }
  }

  constructor(canvas: HTMLCanvasElement, scoreDisplay: HTMLElement, rewardDisplay: HTMLElement, startButton: HTMLElement, restartButton: HTMLElement, gameInstance: any, wrapper: HTMLElement | null) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.scoreDisplay = scoreDisplay
    this.rewardDisplay = rewardDisplay
    this.startButton = startButton
    this.restartButton = restartButton
    this.gameInstance = gameInstance
    this.wrapper = wrapper
    
    this.canvas.width = this.CANVAS_WIDTH
    this.canvas.height = this.CANVAS_HEIGHT
    
    this.loadSapphireImage()
    this.setupControls()
    this.resetGame()
  }

  private loadSapphireImage(): void {
    this.sapphireImage = new Image()
    this.sapphireImage.src = '/assets/sapphire.png'
    this.sapphireImage.onload = () => {
      if (!this.isGameRunning) {
        this.draw()
      }
    }
  }

  private setupControls(): void {
    document.addEventListener('keydown', (e) => {
      if (!this.isGameRunning || !this.currentPiece) return
      
      switch (e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
          this.movePiece(-1, 0)
          break
        case 'd':
        case 'arrowright':
          this.movePiece(1, 0)
          break
        case 's':
        case 'arrowdown':
          this.movePiece(0, 1)
          break
        case 'w':
        case 'arrowup':
        case ' ':
          this.rotatePiece()
          break
        case 'q':
          this.hardDrop()
          break
      }
    })
  }

  private resetGame(): void {
    this.board = Array.from({ length: this.BOARD_HEIGHT }, () => 
      Array.from({ length: this.BOARD_WIDTH }, () => '')
    )
    this.currentPiece = null
    this.nextPiece = null
    this.score = 0
    this.level = 1
    this.lines = 0
    this.dropInterval = 1000
    this.lastDropTime = 0
    
    this.spawnPiece()
    this.generateNextPiece()
    this.updateDisplay()
    this.draw()
  }

  private spawnPiece(): void {
    if (this.nextPiece) {
      this.currentPiece = this.nextPiece
    } else {
      this.currentPiece = this.createRandomPiece()
    }
    
    // Position at top center
    this.currentPiece.x = Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.currentPiece.shape[0].length / 2)
    this.currentPiece.y = 0
    
    // Check for game over
    if (this.checkCollision(this.currentPiece, 0, 0)) {
      this.gameOver()
      return
    }
    
    this.generateNextPiece()
  }

  private generateNextPiece(): void {
    this.nextPiece = this.createRandomPiece()
  }

  private createRandomPiece(): TetrisPiece {
    const types = Object.keys(this.pieces)
    const type = types[Math.floor(Math.random() * types.length)]
    const piece = this.pieces[type as keyof typeof this.pieces]
    
    return {
      shape: piece.shape.map(row => [...row]),
      color: piece.color,
      x: 0,
      y: 0,
      type
    }
  }

  private movePiece(dx: number, dy: number): boolean {
    if (!this.currentPiece) return false
    
    if (!this.checkCollision(this.currentPiece, dx, dy)) {
      this.currentPiece.x += dx
      this.currentPiece.y += dy
      this.draw()
      return true
    }
    return false
  }

  private rotatePiece(): void {
    if (!this.currentPiece) return
    
    const rotated = this.rotateMatrix(this.currentPiece.shape)
    const originalShape = this.currentPiece.shape
    this.currentPiece.shape = rotated
    
    // Check if rotation is valid, try wall kicks
    if (this.checkCollision(this.currentPiece, 0, 0)) {
      // Try wall kicks
      const kicks = [[-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0]]
      let kickSuccessful = false
      
      for (const [kickX, kickY] of kicks) {
        if (!this.checkCollision(this.currentPiece, kickX, kickY)) {
          this.currentPiece.x += kickX
          this.currentPiece.y += kickY
          kickSuccessful = true
          break
        }
      }
      
      if (!kickSuccessful) {
        this.currentPiece.shape = originalShape
      }
    }
    
    this.draw()
  }

  private rotateMatrix(matrix: number[][]): number[][] {
    const rows = matrix.length
    const cols = matrix[0].length
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0))
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        rotated[j][rows - 1 - i] = matrix[i][j]
      }
    }
    
    return rotated
  }

  private hardDrop(): void {
    if (!this.currentPiece) return
    
    while (this.movePiece(0, 1)) {
      this.score += 2 // Bonus points for hard drop
    }
    this.lockPiece()
  }

  private checkCollision(piece: TetrisPiece, dx: number, dy: number): boolean {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x + dx
          const newY = piece.y + y + dy
          
          // Check boundaries
          if (newX < 0 || newX >= this.BOARD_WIDTH || 
              newY >= this.BOARD_HEIGHT || 
              (newY >= 0 && this.board[newY][newX])) {
            return true
          }
        }
      }
    }
    return false
  }

  private lockPiece(): void {
    if (!this.currentPiece) return
    
    // Place piece on board
    for (let y = 0; y < this.currentPiece.shape.length; y++) {
      for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
        if (this.currentPiece.shape[y][x]) {
          const boardX = this.currentPiece.x + x
          const boardY = this.currentPiece.y + y
          if (boardY >= 0) {
            this.board[boardY][boardX] = this.currentPiece.color
          }
        }
      }
    }
    
    // Check for completed lines
    this.clearLines()
    
    // Spawn next piece
    this.spawnPiece()
  }

  private clearLines(): void {
    let linesCleared = 0
    
    for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
      if (this.board[y].every(cell => cell !== '')) {
        this.board.splice(y, 1)
        this.board.unshift(Array(this.BOARD_WIDTH).fill(''))
        linesCleared++
        y++ // Check same line again
      }
    }
    
    if (linesCleared > 0) {
      this.lines += linesCleared
      
      // Calculate score based on lines cleared
      const lineScores = [0, 100, 300, 500, 800]
      this.score += lineScores[linesCleared] * this.level
      
      // Level progression
      const newLevel = Math.floor(this.lines / 10) + 1
      if (newLevel > this.level) {
        this.level = newLevel
        this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50)
      }
      
      this.updateDisplay()
    }
  }

  private draw(): void {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e'
    this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)
    
    // Draw grid
    this.ctx.strokeStyle = '#333'
    this.ctx.lineWidth = 1
    for (let x = 0; x <= this.BOARD_WIDTH; x++) {
      this.ctx.beginPath()
      this.ctx.moveTo(x * this.CELL_SIZE, 0)
      this.ctx.lineTo(x * this.CELL_SIZE, this.CANVAS_HEIGHT)
      this.ctx.stroke()
    }
    for (let y = 0; y <= this.BOARD_HEIGHT; y++) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y * this.CELL_SIZE)
      this.ctx.lineTo(this.CANVAS_WIDTH, y * this.CELL_SIZE)
      this.ctx.stroke()
    }
    
    // Draw placed pieces
    for (let y = 0; y < this.BOARD_HEIGHT; y++) {
      for (let x = 0; x < this.BOARD_WIDTH; x++) {
        if (this.board[y][x]) {
          this.ctx.fillStyle = this.board[y][x]
          this.ctx.fillRect(
            x * this.CELL_SIZE + 1,
            y * this.CELL_SIZE + 1,
            this.CELL_SIZE - 2,
            this.CELL_SIZE - 2
          )
        }
      }
    }
    
    // Draw current piece
    if (this.currentPiece) {
      this.ctx.fillStyle = this.currentPiece.color
      for (let y = 0; y < this.currentPiece.shape.length; y++) {
        for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
          if (this.currentPiece.shape[y][x]) {
            const drawX = (this.currentPiece.x + x) * this.CELL_SIZE
            const drawY = (this.currentPiece.y + y) * this.CELL_SIZE
            this.ctx.fillRect(drawX + 1, drawY + 1, this.CELL_SIZE - 2, this.CELL_SIZE - 2)
          }
        }
      }
    }
    
    // Draw ghost piece
    if (this.currentPiece) {
      this.drawGhostPiece()
    }
  }

  private drawGhostPiece(): void {
    if (!this.currentPiece) return
    
    let ghostY = this.currentPiece.y
    while (!this.checkCollision(this.currentPiece, 0, ghostY - this.currentPiece.y + 1)) {
      ghostY++
    }
    
    this.ctx.fillStyle = this.currentPiece.color + '40' // Semi-transparent
    for (let y = 0; y < this.currentPiece.shape.length; y++) {
      for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
        if (this.currentPiece.shape[y][x]) {
          const drawX = (this.currentPiece.x + x) * this.CELL_SIZE
          const drawY = (ghostY + y) * this.CELL_SIZE
          this.ctx.fillRect(drawX + 1, drawY + 1, this.CELL_SIZE - 2, this.CELL_SIZE - 2)
        }
      }
    }
  }

  private update(): void {
    if (!this.isGameRunning) return
    
    const now = Date.now()
    if (now - this.lastDropTime > this.dropInterval) {
      if (!this.movePiece(0, 1)) {
        this.lockPiece()
      }
      this.lastDropTime = now
    }
  }

  private updateDisplay(): void {
    this.scoreDisplay.textContent = `Score: ${this.score} | Level: ${this.level} | Lines: ${this.lines}`
    
    const baseReward = Math.floor(this.score / 100) // 1 sapphire per 100 points
    const levelBonus = this.gameInstance.getTetrisLevelBonus ? this.gameInstance.getTetrisLevelBonus() : 0
    const totalReward = baseReward + Math.floor(baseReward * levelBonus)
    
    const rewardCount = this.rewardDisplay.querySelector('span:last-child')
    if (rewardCount) {
      rewardCount.textContent = totalReward.toString()
    }
  }

  private gameOver(): void {
    this.isGameRunning = false
    if (this.gameLoop) {
      clearInterval(this.gameLoop)
      this.gameLoop = null
    }

    const finalScore = this.score
    const baseReward = Math.floor(finalScore / 100)
    const levelBonus = this.gameInstance.getTetrisLevelBonus ? this.gameInstance.getTetrisLevelBonus() : 0
    const totalReward = baseReward + Math.floor(baseReward * levelBonus)
    
    this.pendingReward = totalReward

    this.startButton.style.display = 'none'
    this.restartButton.style.display = 'block'

    // Draw game over overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)

    this.createGameOverPopup(finalScore, totalReward)
  }

  private createGameOverPopup(finalScore: number, totalReward: number): void {
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
    this.gameOverPopup.style.border = '2px solid #4444ff'
    this.gameOverPopup.style.boxShadow = '0 0 20px rgba(68, 68, 255, 0.5)'
    this.gameOverPopup.style.zIndex = '10000'
    this.gameOverPopup.style.textAlign = 'center'
    this.gameOverPopup.style.color = '#ffffff'
    this.gameOverPopup.style.minWidth = '300px'

    const gameOverText = document.createElement('h2')
    gameOverText.textContent = 'GAME OVER'
    gameOverText.style.color = '#4444ff'
    gameOverText.style.marginBottom = '20px'
    gameOverText.style.fontSize = '24px'

    const scoreText = document.createElement('p')
    scoreText.textContent = `Final Score: ${finalScore} | Level: ${this.level} | Lines: ${this.lines}`
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

    const sapphireIcon = document.createElement('img')
    sapphireIcon.src = '/assets/sapphire.png'
    sapphireIcon.style.width = '20px'
    sapphireIcon.style.height = '20px'
    sapphireIcon.style.marginRight = '5px'

    const rewardAmount = document.createElement('span')
    rewardAmount.textContent = totalReward.toString()

    rewardText.appendChild(rewardLabel)
    rewardText.appendChild(sapphireIcon)
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

    tryAgainButton.addEventListener('mouseover', () => {
      tryAgainButton.style.backgroundColor = '#3333dd'
      tryAgainButton.style.transform = 'scale(1.05)'
    })

    tryAgainButton.addEventListener('mouseout', () => {
      tryAgainButton.style.backgroundColor = '#4444ff'
      tryAgainButton.style.transform = 'scale(1)'
    })

    tryAgainButton.addEventListener('click', () => {
      if (this.pendingReward > 0) {
        this.gameInstance.addSapphires(this.pendingReward)
        this.pendingReward = 0
        
        this.gameInstance.refreshAllCurrencyDisplays()
        this.gameInstance.ensureCurrencyElementsVisible()
      }
      this.gameOverPopup?.remove()
      this.gameOverPopup = null
      this.resetGame()
      this.draw()
      
      this.startButton.style.display = 'block'
      this.restartButton.style.display = 'none'
    })

    this.gameOverPopup.appendChild(gameOverText)
    this.gameOverPopup.appendChild(scoreText)
    this.gameOverPopup.appendChild(rewardText)
    this.gameOverPopup.appendChild(tryAgainButton)

    document.body.appendChild(this.gameOverPopup)
  }

  public startGame(): void {
    this.isGameRunning = true
    this.lastDropTime = Date.now()
    this.gameLoop = window.setInterval(() => {
      this.update()
      this.draw()
    }, 16) // ~60 FPS
    
    this.startButton.style.display = 'none'
    this.restartButton.style.display = 'block'
  }

  public restartGame(): void {
    this.isGameRunning = false
    if (this.gameLoop) {
      clearInterval(this.gameLoop)
      this.gameLoop = null
    }
    this.resetGame()
    this.startGame()
  }

  public pauseGame(): void {
    this.isGameRunning = !this.isGameRunning
  }
}