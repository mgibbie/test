import { WordValidator } from './word-validator'
import { UIManager } from './ui'

export interface ScrabbleTile {
  letter: string
  value: number
  id: string
}

export interface GameBoard {
  tiles: (ScrabbleTile | null)[][]
  size: number
}

export interface PlayerRack {
  tiles: ScrabbleTile[]
  maxTiles: number
}

export interface WordPlacement {
  word: string
  tiles: ScrabbleTile[]
  startRow: number
  startCol: number
  direction: 'horizontal' | 'vertical'
  score: number
}

export class ScrabbleGame {
  private wordValidator: WordValidator
  private ui: UIManager
  private board: GameBoard
  private playerRack: PlayerRack
  private currentScore: number = 0
  private gameActive: boolean = false
  private gameElement: HTMLElement | null = null

  // Letter distribution and values based on standard Scrabble
  private letterValues: Map<string, number> = new Map([
    ['A', 1], ['E', 1], ['I', 1], ['O', 1], ['U', 1], ['L', 1], ['N', 1], ['R', 1], ['S', 1], ['T', 1],
    ['D', 2], ['G', 2],
    ['B', 3], ['C', 3], ['M', 3], ['P', 3],
    ['F', 4], ['H', 4], ['V', 4], ['W', 4], ['Y', 4],
    ['K', 5],
    ['J', 8], ['X', 8],
    ['Q', 10], ['Z', 10]
  ])

  private letterDistribution: Map<string, number> = new Map([
    ['A', 9], ['B', 2], ['C', 2], ['D', 4], ['E', 12], ['F', 2], ['G', 3], ['H', 2], ['I', 9], ['J', 1],
    ['K', 1], ['L', 4], ['M', 2], ['N', 6], ['O', 8], ['P', 2], ['Q', 1], ['R', 6], ['S', 4], ['T', 6],
    ['U', 4], ['V', 2], ['W', 2], ['X', 1], ['Y', 2], ['Z', 1]
  ])

  private tileBag: ScrabbleTile[] = []

  constructor(ui: UIManager) {
    this.ui = ui
    this.wordValidator = new WordValidator()
    this.board = this.createBoard(15) // Standard Scrabble board is 15x15
    this.playerRack = { tiles: [], maxTiles: 7 }
    this.initializeTileBag()
  }

  async initialize(): Promise<void> {
    try {
      console.log('🎮 Initializing Scrabble game...')
      await this.wordValidator.loadWordList()
      
      const stats = this.wordValidator.getStats()
      console.log(`📚 Dictionary loaded: ${stats.totalWords} words`)
      console.log(`📝 Sample words: ${stats.sampleWords.join(', ')}`)
      
      this.fillPlayerRack()
      console.log('✅ Scrabble game initialized!')
    } catch (error) {
      console.error('❌ Failed to initialize Scrabble game:', error)
      throw error
    }
  }

  private createBoard(size: number): GameBoard {
    const tiles: (ScrabbleTile | null)[][] = []
    for (let row = 0; row < size; row++) {
      tiles[row] = new Array(size).fill(null)
    }
    return { tiles, size }
  }

  private initializeTileBag(): void {
    let tileId = 0
    
    for (const [letter, count] of this.letterDistribution) {
      for (let i = 0; i < count; i++) {
        this.tileBag.push({
          letter,
          value: this.letterValues.get(letter) || 0,
          id: `tile-${tileId++}`
        })
      }
    }
    
    // Add blank tiles
    for (let i = 0; i < 2; i++) {
      this.tileBag.push({
        letter: '',
        value: 0,
        id: `tile-${tileId++}`
      })
    }
    
    this.shuffleTileBag()
  }

  private shuffleTileBag(): void {
    for (let i = this.tileBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tileBag[i], this.tileBag[j]] = [this.tileBag[j], this.tileBag[i]]
    }
  }

  private fillPlayerRack(): void {
    while (this.playerRack.tiles.length < this.playerRack.maxTiles && this.tileBag.length > 0) {
      const tile = this.tileBag.pop()
      if (tile) {
        this.playerRack.tiles.push(tile)
      }
    }
  }

  async validateWord(word: string): Promise<boolean> {
    if (!word || word.length < 2) {
      return false
    }
    
    return await this.wordValidator.isValidWord(word)
  }

  async findPossibleWords(letters?: string): Promise<string[]> {
    const availableLetters = letters || this.playerRack.tiles.map(tile => tile.letter).join('')
    return await this.wordValidator.findWordsFromLetters(availableLetters, 2)
  }

  calculateWordScore(placement: WordPlacement): number {
    // Basic scoring - can be enhanced with multipliers
    let score = 0
    for (const tile of placement.tiles) {
      score += this.letterValues.get(tile.letter) || 0
    }
    
    // Bonus for using all 7 tiles
    if (placement.tiles.length === 7) {
      score += 50
    }
    
    return score
  }

  async submitWord(word: string, startRow: number, startCol: number, direction: 'horizontal' | 'vertical'): Promise<{success: boolean, message: string, score?: number}> {
    try {
      // Validate the word
      const isValid = await this.validateWord(word)
      if (!isValid) {
        return {
          success: false,
          message: `"${word}" is not a valid word.`
        }
      }

      // Check if player has the necessary tiles
      const requiredLetters = word.split('')
      const availableLetters = [...this.playerRack.tiles.map(t => t.letter)]
      
      for (const letter of requiredLetters) {
        const index = availableLetters.indexOf(letter.toUpperCase())
        if (index === -1) {
          return {
            success: false,
            message: `You don't have the letter "${letter}".`
          }
        }
        availableLetters.splice(index, 1)
      }

      // Create placement object
      const tiles: ScrabbleTile[] = []
      for (const letter of requiredLetters) {
        const tileIndex = this.playerRack.tiles.findIndex(t => t.letter === letter.toUpperCase())
        if (tileIndex !== -1) {
          tiles.push(this.playerRack.tiles[tileIndex])
          this.playerRack.tiles.splice(tileIndex, 1)
        }
      }

      const placement: WordPlacement = {
        word: word.toUpperCase(),
        tiles,
        startRow,
        startCol,
        direction,
        score: 0
      }

      placement.score = this.calculateWordScore(placement)
      
      // Place tiles on board
      this.placeWordOnBoard(placement)
      
      // Update score
      this.currentScore += placement.score
      
      // Refill rack
      this.fillPlayerRack()

      return {
        success: true,
        message: `"${word}" placed for ${placement.score} points!`,
        score: placement.score
      }

    } catch (error) {
      console.error('Error submitting word:', error)
      return {
        success: false,
        message: 'An error occurred while submitting the word.'
      }
    }
  }

  private placeWordOnBoard(placement: WordPlacement): void {
    const { word, startRow, startCol, direction } = placement
    
    for (let i = 0; i < word.length; i++) {
      const row = direction === 'horizontal' ? startRow : startRow + i
      const col = direction === 'horizontal' ? startCol + i : startCol
      
      if (row < this.board.size && col < this.board.size) {
        this.board.tiles[row][col] = placement.tiles[i]
      }
    }
  }

  createGameUI(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'scrabble-game-container'
    container.style.display = 'none'

    // Game header
    const header = document.createElement('div')
    header.className = 'scrabble-header'
    header.innerHTML = `
      <h2>Scrabble Word Game</h2>
      <div class="score">Score: <span id="scrabble-score">${this.currentScore}</span></div>
      <button id="hint-button" class="hint-button">Get Hint</button>
      <button id="back-to-main" class="back-button">Back</button>
    `

    // Word input area
    const inputArea = document.createElement('div')
    inputArea.className = 'word-input-area'
    inputArea.innerHTML = `
      <div class="input-group">
        <input type="text" id="word-input" placeholder="Enter your word..." maxlength="15">
        <button id="submit-word" class="submit-button">Submit Word</button>
      </div>
      <div id="word-feedback" class="word-feedback"></div>
    `

    // Player rack
    const rackArea = document.createElement('div')
    rackArea.className = 'player-rack'
    rackArea.innerHTML = `
      <h3>Your Tiles:</h3>
      <div id="rack-tiles" class="rack-tiles"></div>
    `

    // Possible words hint area
    const hintsArea = document.createElement('div')
    hintsArea.className = 'hints-area'
    hintsArea.innerHTML = `
      <div id="hints-content" class="hints-content" style="display: none;">
        <h4>Possible Words:</h4>
        <div id="possible-words" class="possible-words"></div>
      </div>
    `

    container.appendChild(header)
    container.appendChild(inputArea)
    container.appendChild(rackArea)
    container.appendChild(hintsArea)

    // Add event listeners
    this.setupEventListeners(container)

    // Update the rack display
    this.updateRackDisplay(container)

    this.gameElement = container
    return container
  }

  private setupEventListeners(container: HTMLElement): void {
    const wordInput = container.querySelector('#word-input') as HTMLInputElement
    const submitButton = container.querySelector('#submit-word') as HTMLButtonElement
    const hintButton = container.querySelector('#hint-button') as HTMLButtonElement
    const backButton = container.querySelector('#back-to-main') as HTMLButtonElement
    const feedback = container.querySelector('#word-feedback') as HTMLElement

    const submitWord = async () => {
      const word = wordInput.value.trim()
      if (!word) return

      feedback.textContent = 'Checking word...'
      feedback.className = 'word-feedback checking'

      const result = await this.submitWord(word, 7, 7, 'horizontal') // Center of board
      
      feedback.textContent = result.message
      feedback.className = `word-feedback ${result.success ? 'success' : 'error'}`

      if (result.success) {
        wordInput.value = ''
        this.updateScoreDisplay(container)
        this.updateRackDisplay(container)
      }
    }

    submitButton.addEventListener('click', submitWord)
    
    wordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        submitWord()
      }
    })

    hintButton.addEventListener('click', async () => {
      const hintsContent = container.querySelector('#hints-content') as HTMLElement
      const possibleWordsDiv = container.querySelector('#possible-words') as HTMLElement
      
      if (hintsContent.style.display === 'none') {
        possibleWordsDiv.textContent = 'Finding possible words...'
        hintsContent.style.display = 'block'
        
        const words = await this.findPossibleWords()
        const topWords = words.slice(0, 20) // Show top 20 words
        
        possibleWordsDiv.innerHTML = topWords.length > 0 
          ? topWords.map(word => `<span class="possible-word">${word}</span>`).join('')
          : '<span class="no-words">No words found with current tiles</span>'
      } else {
        hintsContent.style.display = 'none'
      }
    })

    backButton.addEventListener('click', () => {
      this.closeGame()
    })
  }

  private updateScoreDisplay(container: HTMLElement): void {
    const scoreElement = container.querySelector('#scrabble-score')
    if (scoreElement) {
      scoreElement.textContent = this.currentScore.toString()
    }
  }

  private updateRackDisplay(container: HTMLElement): void {
    const rackTiles = container.querySelector('#rack-tiles')
    if (rackTiles) {
      rackTiles.innerHTML = this.playerRack.tiles
        .map(tile => `<div class="tile">${tile.letter}<sub>${tile.value}</sub></div>`)
        .join('')
    }
  }

  openGame(): void {
    if (this.gameElement) {
      const elements = this.ui.getElements()
      if (elements.gameView) {
        elements.gameView.style.display = 'none'
      }
      this.gameElement.style.display = 'block'
      this.gameActive = true
    }
  }

  closeGame(): void {
    if (this.gameElement) {
      this.gameElement.style.display = 'none'
      const elements = this.ui.getElements()
      if (elements.gameView) {
        elements.gameView.style.display = 'block'
      }
      this.gameActive = false
    }
  }

  getScore(): number {
    return this.currentScore
  }

  getPlayerRack(): PlayerRack {
    return { ...this.playerRack }
  }

  isGameActive(): boolean {
    return this.gameActive
  }
} 