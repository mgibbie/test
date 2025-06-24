import { LetterTile, LetterGameState } from './types'
import { WordValidator } from './word-validator'
import { UIManager } from './ui'

export class LetterGame {
  private wordValidator: WordValidator
  private ui: UIManager
  private gameState: LetterGameState
  private gameElement: HTMLElement | null = null
  private gameInstance: any
  private reservedSlots: Set<number> = new Set() // Track slots with pending animations

  // Letter values based on Scrabble
  private letterValues: Map<string, number> = new Map([
    ['A', 1], ['E', 1], ['I', 1], ['O', 1], ['U', 1], ['L', 1], ['N', 1], ['R', 1], ['S', 1], ['T', 1],
    ['D', 2], ['G', 2],
    ['B', 3], ['C', 3], ['M', 3], ['P', 3],
    ['F', 4], ['H', 4], ['V', 4], ['W', 4], ['Y', 4],
    ['K', 5],
    ['J', 8], ['X', 8],
    ['Q', 10], ['Z', 10]
  ])

  // Simple multiplier system - can be adjusted
  private letterMultipliers: Map<string, number> = new Map([
    // All letters have multiplier of 1
    ['A', 1], ['E', 1], ['I', 1], ['O', 1], ['U', 1],
    ['L', 1], ['N', 1], ['R', 1], ['S', 1], ['T', 1],
    ['D', 1], ['G', 1], ['B', 1], ['C', 1], ['M', 1], ['P', 1],
    ['F', 1], ['H', 1], ['V', 1], ['W', 1], ['Y', 1],
    ['K', 1], ['J', 1], ['X', 1], ['Q', 1], ['Z', 1]
  ])

  constructor(ui: UIManager, gameInstance: any) {
    this.ui = ui
    this.gameInstance = gameInstance
    this.wordValidator = new WordValidator()
    this.gameState = {
      currentHand: [],
      deck: [],
      tilesEarned: 0,
      gamesPlayed: 0
    }
  }

  async initialize(): Promise<void> {
    try {
      console.log('🎮 Initializing Letter Game...')
      await this.wordValidator.loadWordList()
      this.initializeDeck()
      this.drawNewHand()
      console.log('✅ Letter Game initialized!')
    } catch (error) {
      console.error('❌ Failed to initialize Letter Game:', error)
      throw error
    }
  }

  private initializeDeck(): void {
    this.gameState.deck = []
    let tileId = 0

    // 2 of each vowel
    const vowels = ['A', 'E', 'I', 'O', 'U']
    for (const vowel of vowels) {
      for (let i = 0; i < 2; i++) {
        this.gameState.deck.push(this.createLetterTile(vowel, tileId++))
      }
    }

    // 1 of each consonant
    const consonants = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z']
    for (const consonant of consonants) {
      this.gameState.deck.push(this.createLetterTile(consonant, tileId++))
    }

    this.shuffleDeck()
  }

  private createLetterTile(letter: string, id: number): LetterTile {
    return {
      letter,
      chipValue: this.letterValues.get(letter) || 1,
      multiplier: this.letterMultipliers.get(letter) || 1,
      id: `tile-${id}`
    }
  }

  private shuffleDeck(): void {
    for (let i = this.gameState.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.gameState.deck[i], this.gameState.deck[j]] = [this.gameState.deck[j], this.gameState.deck[i]]
    }
  }

  private drawNewHand(): void {
    this.gameState.currentHand = []
    
    // If deck has fewer than 7 cards, reshuffle
    if (this.gameState.deck.length < 7) {
      this.initializeDeck()
    }

    // Draw 7 tiles
    for (let i = 0; i < 7; i++) {
      const tile = this.gameState.deck.pop()
      if (tile) {
        this.gameState.currentHand.push(tile)
      }
    }
    
    // Clear all slot reservations when drawing new hand
    this.reservedSlots.clear()
  }

  async submitWord(word: string): Promise<{success: boolean, message: string, score?: number, tiles?: number}> {
    try {
      // Validate the word
      const isValid = await this.wordValidator.isValidWord(word)
      if (!isValid) {
        return {
          success: false,
          message: `"${word}" is not a valid word.`
        }
      }

      // Check if player can make the word with current hand
      const wordLetters = word.toUpperCase().split('')
      const availableLetters = [...this.gameState.currentHand]
      const usedTiles: LetterTile[] = []

      for (const letter of wordLetters) {
        const tileIndex = availableLetters.findIndex(tile => tile.letter === letter)
        if (tileIndex === -1) {
          return {
            success: false,
            message: `You don't have the letter "${letter}" in your hand.`
          }
        }
        usedTiles.push(availableLetters[tileIndex])
        availableLetters.splice(tileIndex, 1)
      }

      // Calculate score: total multiplier × total chip value
      const totalChipValue = usedTiles.reduce((sum, tile) => sum + tile.chipValue, 0)
      const totalMultiplier = usedTiles.reduce((sum, tile) => sum + tile.multiplier, 0)
      const tilesEarned = totalChipValue * totalMultiplier

      // Update game state
      this.gameState.tilesEarned += tilesEarned
      this.gameState.gamesPlayed++
      
      // Give tiles to the main game
      this.gameInstance.addTiles(tilesEarned)

      return {
        success: true,
        message: `"${word}" scored ${totalChipValue} chips × ${totalMultiplier} multiplier = ${tilesEarned} Tiles!`,
        score: tilesEarned,
        tiles: tilesEarned
      }

    } catch (error) {
      console.error('Error submitting word:', error)
      return {
        success: false,
        message: 'An error occurred while submitting the word.'
      }
    }
  }

  createGameUI(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'letter-game-container'
    container.style.display = 'none'

    // Game header
    const header = document.createElement('div')
    header.className = 'letter-game-header'
    header.innerHTML = `
      <div style="text-align: center;">
        <h2>Letter Tile Game</h2>
      </div>
      <div class="game-stats">
        <div class="tiles-earned">Tiles: <span id="tiles-earned">${this.gameState.tilesEarned}</span></div>
        <div class="games-played">Games: <span id="games-played">${this.gameState.gamesPlayed}</span></div>
      </div>
    `

    // Instructions
    const instructions = document.createElement('div')
    instructions.className = 'game-instructions'
    instructions.innerHTML = `
      <p>Drag tiles to slots, click tiles to place them, or just type letters on your keyboard! Make 3-letter words to score points!</p>
      <p>Press <strong>Enter</strong> to submit word, <strong>Backspace</strong> to remove last tile</p>
      <p>Score = (Total Chip Value) × (Total Multiplier) = Tiles earned</p>
    `

    // Word building area
    const buildArea = document.createElement('div')
    buildArea.className = 'word-build-area'
    buildArea.innerHTML = `
      <h3>Build Your Word:</h3>
      <div class="word-slots">
        <div class="letter-slot" data-slot="0"></div>
        <div class="letter-slot" data-slot="1"></div>
        <div class="letter-slot" data-slot="2"></div>
      </div>
      <div class="word-controls">
        <button id="clear-word" class="clear-button">Clear</button>
        <button id="submit-letter-word" class="submit-button">Submit Word</button>
      </div>
      <div id="letter-word-feedback" class="word-feedback"></div>
    `

    // Main game area with discard zone and hand side by side
    const gameArea = document.createElement('div')
    gameArea.className = 'game-area'
    gameArea.style.display = 'flex'
    gameArea.style.gap = '30px'
    gameArea.style.justifyContent = 'center'
    gameArea.style.alignItems = 'flex-start'
    gameArea.style.padding = '20px'

    // Current hand display (takes full width if discard zone not unlocked)
    const handArea = document.createElement('div')
    handArea.className = 'current-hand'
    handArea.innerHTML = `
      <h3>Your Hand:</h3>
      <div id="hand-tiles" class="hand-tiles"></div>
    `

    // Conditionally add discard zone if unlocked
    if (this.gameInstance.getState().discardZoneUnlocked) {
      // Discard zone (left side)
      const discardArea = document.createElement('div')
      discardArea.className = 'discard-area'
      discardArea.innerHTML = `
        <h3>Discard Zone</h3>
        <div id="discard-zone" class="discard-zone">
          <div class="discard-slots">
            <div class="discard-slot" data-slot="0" style="display: block;"></div>
            <div class="discard-slot" data-slot="1" style="display: none;"></div>
            <div class="discard-slot" data-slot="2" style="display: none;"></div>
            <div class="discard-slot" data-slot="3" style="display: none;"></div>
            <div class="discard-slot" data-slot="4" style="display: none;"></div>
          </div>
          <button id="reroll-tiles" class="reroll-button" style="display: none;">🗑️</button>
        </div>
      `
      
      gameArea.appendChild(discardArea)
      gameArea.appendChild(handArea)
    } else {
      // Just show the hand area centered
      gameArea.appendChild(handArea)
    }

    // New hand button
    const newHandArea = document.createElement('div')
    newHandArea.className = 'new-hand-area'
    newHandArea.innerHTML = `
      <button id="draw-new-hand" class="new-hand-button">Draw New Hand</button>
      <p class="new-hand-note">(This will shuffle and draw 7 new tiles)</p>
    `

    // Currency indicators - match main screen exactly
    const currencyContainer = document.createElement('div')
    currencyContainer.className = 'letter-game-currency'

    // Money counter
    const moneyCounter = document.createElement('div')
    moneyCounter.className = 'money-counter'
    moneyCounter.id = 'letter-money-counter'
    moneyCounter.textContent = '$0'

    // Diamonds counter
    const diamondsCounter = document.createElement('div')
    diamondsCounter.className = 'diamonds-counter'
    diamondsCounter.id = 'letter-diamonds-counter'
    diamondsCounter.textContent = '💎 0'

    // Emeralds counter
    const emeraldsCounter = document.createElement('div')
    emeraldsCounter.className = 'emeralds-counter'
    emeraldsCounter.id = 'letter-emeralds-counter'
    emeraldsCounter.innerHTML = '<img src="/assets/emerald.png" class="emerald-icon-small" style="width: 20px; height: 20px; vertical-align: middle; margin-right: 8px;"> <span>0</span>'

    // Tiles counter
    const tilesCounter = document.createElement('div')
    tilesCounter.className = 'tiles-counter'
    tilesCounter.id = 'letter-tiles-counter'
    tilesCounter.textContent = '🟦 0'

    currencyContainer.appendChild(moneyCounter)
    currencyContainer.appendChild(diamondsCounter)
    currencyContainer.appendChild(emeraldsCounter)
    currencyContainer.appendChild(tilesCounter)

    // Back button positioned at bottom right
    const backButton = document.createElement('button')
    backButton.id = 'letter-back-button'
    backButton.className = 'letter-back-button'
    backButton.textContent = 'BACK'

    container.appendChild(currencyContainer)
    container.appendChild(header)
    container.appendChild(instructions)
    container.appendChild(buildArea)
    container.appendChild(gameArea)
    container.appendChild(newHandArea)
    container.appendChild(backButton)

    // Add event listeners
    this.setupEventListeners(container)

    // Update the hand display
    this.updateHandDisplay(container)

    // Setup discard zone functionality only if unlocked
    if (this.gameInstance.getState().discardZoneUnlocked) {
      this.setupDiscardZone(container)
    }

    // Initial currency display update
    this.updateCurrencyDisplays(container)

    this.gameElement = container
    return container
  }

  private setupEventListeners(container: HTMLElement): void {
    const submitButton = container.querySelector('#submit-letter-word') as HTMLButtonElement
    const clearButton = container.querySelector('#clear-word') as HTMLButtonElement
    const backButton = container.querySelector('#letter-back-button') as HTMLButtonElement
    const newHandButton = container.querySelector('#draw-new-hand') as HTMLButtonElement
    const feedback = container.querySelector('#letter-word-feedback') as HTMLElement
    const slots = container.querySelectorAll('.letter-slot') as NodeListOf<HTMLElement>

    const submitWord = async () => {
      const word = this.getWordFromSlots(container)
      if (!word) return

      feedback.textContent = 'Checking word...'
      feedback.className = 'word-feedback checking'

      const result = await this.submitWord(word)
      
      feedback.textContent = result.message
      feedback.className = `word-feedback ${result.success ? 'success' : 'error'}`

      if (result.success) {
        // Clear slots first, then draw new hand, then update display
        this.clearSlots(container)
        this.drawNewHand()
        this.updateStatsDisplay(container)
        this.updateHandDisplay(container)
      }
    }

    const clearWord = () => {
      this.clearSlots(container)
      this.updateHandDisplay(container)
      feedback.textContent = 'Word cleared!'
      feedback.className = 'word-feedback success'
    }

    submitButton.addEventListener('click', submitWord)
    clearButton.addEventListener('click', clearWord)

    backButton.addEventListener('click', () => {
      this.closeGame()
    })

    newHandButton.addEventListener('click', () => {
      this.drawNewHand()
      this.updateHandDisplay(container)
      this.clearSlots(container)
      feedback.textContent = 'New hand drawn!'
      feedback.className = 'word-feedback success'
    })

    // Setup drag and drop for slots
    this.setupSlotListeners(container)

    // Setup keyboard listener for typing letters
    this.setupKeyboardListener(container)
  }

  private updateStatsDisplay(container: HTMLElement): void {
    const tilesElement = container.querySelector('#tiles-earned')
    const gamesElement = container.querySelector('#games-played')
    
    if (tilesElement) tilesElement.textContent = this.gameState.tilesEarned.toString()
    if (gamesElement) gamesElement.textContent = this.gameState.gamesPlayed.toString()
    
    // Update currency displays
    this.updateCurrencyDisplays(container)
  }

  private updateCurrencyDisplays(container: HTMLElement): void {
    const gameState = this.gameInstance.getState()
    
    // Update money counter - always visible, match main screen format
    const moneyElement = container.querySelector('#letter-money-counter') as HTMLElement
    if (moneyElement) {
      moneyElement.textContent = `$${gameState.money}`
      moneyElement.style.display = 'block'
    }
    
    // Update diamonds counter - only show if player has diamonds
    const diamondsElement = container.querySelector('#letter-diamonds-counter') as HTMLElement
    if (diamondsElement) {
      diamondsElement.textContent = `💎 ${gameState.diamonds}`
      diamondsElement.style.display = gameState.diamonds > 0 ? 'block' : 'none'
    }
    
    // Update emeralds counter - only show if player has emeralds
    const emeraldsElement = container.querySelector('#letter-emeralds-counter') as HTMLElement
    if (emeraldsElement) {
      const countSpan = emeraldsElement.querySelector('span') as HTMLElement
      if (countSpan) {
        countSpan.textContent = gameState.emeralds.toString()
      }
      emeraldsElement.style.display = gameState.emeralds > 0 ? 'block' : 'none'
    }
    
    // Update tiles counter - only show if player has tiles
    const tilesElement = container.querySelector('#letter-tiles-counter') as HTMLElement
    if (tilesElement) {
      tilesElement.textContent = `🟦 ${gameState.tiles}`
      tilesElement.style.display = gameState.tiles > 0 ? 'block' : 'none'
    }
  }

  private updateHandDisplay(container: HTMLElement): void {
    const handTiles = container.querySelector('#hand-tiles')
    if (handTiles) {
      // Get list of tiles currently placed in slots
      const placedTileIds = new Set<string>()
      const slots = container.querySelectorAll('.letter-slot')
      slots.forEach(slot => {
        const placedTile = slot.querySelector('.letter-tile')
        if (placedTile) {
          const tileId = placedTile.getAttribute('data-tile-id')
          if (tileId) placedTileIds.add(tileId)
        }
      })

      // Get list of tiles currently in discard slots
      const discardedTileIds = new Set<string>()
      const discardSlots = container.querySelectorAll('.discard-slot')
      discardSlots.forEach(slot => {
        const discardedTile = slot.querySelector('.letter-tile')
        if (discardedTile) {
          const tileId = discardedTile.getAttribute('data-tile-id')
          if (tileId) discardedTileIds.add(tileId)
        }
      })
      
      // Only show tiles that aren't currently placed in slots or discard zone
      const availableTiles = this.gameState.currentHand.filter(tile => 
        !placedTileIds.has(tile.id) && !discardedTileIds.has(tile.id)
      )
      
      // Clear existing tiles and show only available ones
      handTiles.innerHTML = availableTiles
        .map(tile => this.createTileHTML(tile))
        .join('')
      
      // Add event listeners to hand tiles
      const tileElements = handTiles.querySelectorAll('.letter-tile') as NodeListOf<HTMLElement>
      
      tileElements.forEach(tileElement => {
        // Make tiles draggable
        tileElement.draggable = true
        
        // Add drag start listener
        tileElement.addEventListener('dragstart', (e) => {
          const tileData = {
            id: tileElement.getAttribute('data-tile-id'),
            letter: tileElement.getAttribute('data-letter'),
            chipValue: tileElement.getAttribute('data-chip'),
            multiplier: tileElement.getAttribute('data-multiplier'),
            source: 'hand' // Indicate this drag originated from hand
          }
          e.dataTransfer?.setData('text/plain', JSON.stringify(tileData))
          tileElement.classList.add('dragging')
        })
        
        // Add drag end listener to clean up
        tileElement.addEventListener('dragend', () => {
          tileElement.classList.remove('dragging')
        })
        
        // Store reference for drop zone creation
        tileElement.setAttribute('data-index', availableTiles.findIndex(tile => tile.id === tileElement.getAttribute('data-tile-id')).toString())
        
        // Add click listener for quick placement
        tileElement.addEventListener('click', () => {
          const nextSlot = this.getNextAvailableSlot(container)
          if (nextSlot) {
            const tileData = {
              id: tileElement.getAttribute('data-tile-id'),
              letter: tileElement.getAttribute('data-letter'),
              chipValue: tileElement.getAttribute('data-chip'),
              multiplier: tileElement.getAttribute('data-multiplier')
            }
            this.placeTileInSlot(nextSlot, tileData, container)
          }
        })
      })
      
      // Create drop zones between tiles for insertion-based reordering
      this.createHandDropZones(container)
    }
    
    // Update reroll button state
    this.updateRerollButtonState(container)
  }

  private createHandDropZones(container: HTMLElement): void {
    const handTiles = container.querySelector('#hand-tiles')
    if (!handTiles) return

    // Remove existing drop zones
    handTiles.querySelectorAll('.tile-drop-zone').forEach(zone => (zone as HTMLElement).remove())

    const tiles = handTiles.querySelectorAll('.letter-tile') as NodeListOf<HTMLElement>
    
    // Create drop zone before first tile
    this.createDropZone(handTiles as HTMLElement, 0, true, container)
    
    // Create drop zones between tiles and after last tile
    tiles.forEach((tile, index) => {
      // Insert drop zone after this tile
      this.createDropZone(handTiles as HTMLElement, index + 1, false, container)
    })
  }

  private createDropZone(handTiles: HTMLElement, insertIndex: number, isFirst: boolean, container: HTMLElement): void {
    const dropZone = document.createElement('div')
    dropZone.className = 'tile-drop-zone'
    dropZone.setAttribute('data-insert-index', insertIndex.toString())
    
    // Position the drop zone
    if (isFirst) {
      handTiles.insertBefore(dropZone, handTiles.firstChild as Node)
    } else {
      const tiles = handTiles.querySelectorAll('.letter-tile')
      const targetTile = tiles[insertIndex - 1] as HTMLElement
      if (targetTile && targetTile.nextSibling) {
        handTiles.insertBefore(dropZone, targetTile.nextSibling as Node)
      } else {
        handTiles.appendChild(dropZone)
      }
    }

    // Add drag event listeners
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault()
      // Check if we have drag data types indicating a hand tile
      if (e.dataTransfer?.types.includes('text/plain')) {
        dropZone.classList.add('drop-zone-active')
        this.showInsertionIndicator(dropZone, true)
      }
    })

    dropZone.addEventListener('dragenter', (e) => {
      e.preventDefault()
    })

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drop-zone-active')
      this.showInsertionIndicator(dropZone, false)
    })

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault()
      dropZone.classList.remove('drop-zone-active')
      this.showInsertionIndicator(dropZone, false)
      
      const dragData = e.dataTransfer?.getData('text/plain')
      if (dragData) {
        const data = JSON.parse(dragData)
        if (data.source === 'hand') {
          const insertIndex = parseInt(dropZone.getAttribute('data-insert-index') || '0')
          this.insertTileAtIndex(data.id, insertIndex, container)
        }
      }
    })
  }

  private showInsertionIndicator(dropZone: HTMLElement, show: boolean): void {
    if (show) {
      dropZone.style.backgroundColor = 'rgba(0, 255, 136, 0.3)'
      dropZone.style.borderLeft = '3px solid #00ff88'
      dropZone.style.borderRight = '3px solid #00ff88'
    } else {
      dropZone.style.backgroundColor = ''
      dropZone.style.borderLeft = ''
      dropZone.style.borderRight = ''
    }
  }

  private insertTileAtIndex(draggedTileId: string, insertIndex: number, container: HTMLElement): void {
    // Find the dragged tile in the current hand
    const draggedIndex = this.gameState.currentHand.findIndex(tile => tile.id === draggedTileId)
    if (draggedIndex === -1) return
    
    // Capture positions before reordering
    const handTiles = container.querySelector('#hand-tiles')
    if (!handTiles) return
    
    const currentTiles = handTiles.querySelectorAll('.letter-tile') as NodeListOf<HTMLElement>
    const oldPositions = new Map<string, DOMRect>()
    
    currentTiles.forEach(tile => {
      const tileId = tile.getAttribute('data-tile-id')
      if (tileId) {
        oldPositions.set(tileId, tile.getBoundingClientRect())
      }
    })
    
    // Remove the dragged tile
    const [draggedTile] = this.gameState.currentHand.splice(draggedIndex, 1)
    
    // Adjust insert index if we're inserting after the removed tile's original position
    let adjustedIndex = insertIndex
    if (insertIndex > draggedIndex) {
      adjustedIndex = insertIndex - 1
    }
    
    // Insert at the new position
    this.gameState.currentHand.splice(adjustedIndex, 0, draggedTile)
    
    // Animate the reordering
    this.animateHandReorder(oldPositions, container)
  }

  // No longer needed - updateHandDisplay now handles filtering placed tiles

  private reorderHandTiles(draggedTileId: string | null, targetTileId: string | null, container: HTMLElement): void {
    if (!draggedTileId || !targetTileId || draggedTileId === targetTileId) return
    
    // Find the indices of the dragged and target tiles
    const draggedIndex = this.gameState.currentHand.findIndex(tile => tile.id === draggedTileId)
    const targetIndex = this.gameState.currentHand.findIndex(tile => tile.id === targetTileId)
    
    if (draggedIndex === -1 || targetIndex === -1) return
    
    // Capture current positions before reordering
    const handTiles = container.querySelector('#hand-tiles')
    if (!handTiles) return
    
    const currentTiles = handTiles.querySelectorAll('.letter-tile') as NodeListOf<HTMLElement>
    const oldPositions = new Map<string, DOMRect>()
    
    currentTiles.forEach(tile => {
      const tileId = tile.getAttribute('data-tile-id')
      if (tileId) {
        oldPositions.set(tileId, tile.getBoundingClientRect())
      }
    })
    
    // Remove the dragged tile and insert it at the target position
    const [draggedTile] = this.gameState.currentHand.splice(draggedIndex, 1)
    this.gameState.currentHand.splice(targetIndex, 0, draggedTile)
    
    // Animate tiles to their new positions BEFORE updating display
    this.animateHandReorder(oldPositions, container)
  }

  private animateHandReorder(oldPositions: Map<string, DOMRect>, container: HTMLElement): void {
    const handTiles = container.querySelector('#hand-tiles')
    if (!handTiles) return
    
    // Create a mapping of old positions to new positions based on tile order
    const currentTiles = Array.from(handTiles.querySelectorAll('.letter-tile')) as HTMLElement[]
    const tileOrderMap = new Map<string, number>()
    
    // Map each tile ID to its new index in the reordered hand
    this.gameState.currentHand.forEach((tile, newIndex) => {
      tileOrderMap.set(tile.id, newIndex)
    })
    
    // Group tiles by their movement direction/distance for smoother animation
    const tilesToAnimate: Array<{element: HTMLElement, oldIndex: number, newIndex: number}> = []
    
    currentTiles.forEach((tileElement, currentDOMIndex) => {
      const tileId = tileElement.getAttribute('data-tile-id')
      if (!tileId) return
      
      const newIndex = tileOrderMap.get(tileId)
      if (newIndex === undefined) return
      
      // Only animate tiles that actually changed position
      if (currentDOMIndex !== newIndex) {
        tilesToAnimate.push({
          element: tileElement,
          oldIndex: currentDOMIndex,
          newIndex: newIndex
        })
      }
    })
    
    if (tilesToAnimate.length === 0) {
      // No animation needed, just update display
      this.updateHandDisplay(container)
      return
    }
    
    // Calculate how far each tile needs to move
    const tileWidth = 80
    const gap = 15
    
    // Animate tiles to their new positions
    const animations: Promise<void>[] = []
    
    tilesToAnimate.forEach(({element, oldIndex, newIndex}) => {
      const moveDistance = (newIndex - oldIndex) * (tileWidth + gap)
      
      const animation = new Promise<void>((resolve) => {
        // Apply the animation
        element.style.transition = 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)'
        element.style.transform = `translateX(${moveDistance}px)`
        element.classList.add('hand-reorder-animating')
        
        // Clean up after animation with a small delay to prevent jerk
        setTimeout(() => {
          // Fade out slightly during cleanup
          element.style.opacity = '0.8'
          element.style.transition = 'opacity 50ms ease-out'
          
          setTimeout(() => {
            // Reset all styles
            element.style.transition = ''
            element.style.transform = ''
            element.style.opacity = ''
            element.classList.remove('hand-reorder-animating')
            resolve()
          }, 50)
        }, 400)
      })
      
      animations.push(animation)
    })
    
    // After all animations complete, rebuild the hand smoothly
    Promise.all(animations).then(() => {
      // Small delay before rebuilding to ensure all cleanup is done
      setTimeout(() => {
        this.updateHandDisplay(container)
      }, 20)
    })
  }

  private createTileHTML(tile: LetterTile): string {
    return `
      <div class="letter-tile" data-tile-id="${tile.id}" data-letter="${tile.letter}" data-chip="${tile.chipValue}" data-multiplier="${tile.multiplier}">
        <div class="tile-letter">${tile.letter}</div>
        <div class="tile-multiplier">${tile.multiplier}</div>
        <div class="tile-chip-value">${tile.chipValue}</div>
      </div>
    `
  }

  private getWordFromSlots(container: HTMLElement): string {
    const slots = container.querySelectorAll('.letter-slot')
    let word = ''
    
    slots.forEach(slot => {
      const tileElement = slot.querySelector('.letter-tile')
      if (tileElement) {
        const letter = tileElement.getAttribute('data-letter') || ''
        word += letter
      }
    })
    
    return word.trim()
  }

  private clearSlots(container: HTMLElement): void {
    const slots = container.querySelectorAll('.letter-slot')
    
    slots.forEach(slot => {
      const tileElement = slot.querySelector('.letter-tile')
      if (tileElement) {
        // Return tile to hand by removing it from slot
        slot.removeChild(tileElement)
      }
    })
    
    // Clear all slot reservations
    this.reservedSlots.clear()
    
    // Update hand display to show returned tiles
    this.updateHandDisplay(container)
  }

  private setupSlotListeners(container: HTMLElement): void {
    const slots = container.querySelectorAll('.letter-slot') as NodeListOf<HTMLElement>
    const handTiles = container.querySelector('#hand-tiles') as HTMLElement

    // Setup drag and drop for slots
    slots.forEach(slot => {
      slot.addEventListener('dragover', (e) => {
        e.preventDefault()
        slot.classList.add('drag-over')
      })

      slot.addEventListener('dragleave', () => {
        slot.classList.remove('drag-over')
      })

      slot.addEventListener('drop', (e) => {
        e.preventDefault()
        slot.classList.remove('drag-over')
        
        const tileData = e.dataTransfer?.getData('text/plain')
        if (tileData && !slot.querySelector('.letter-tile')) {
          const tileInfo = JSON.parse(tileData)
          this.placeTileInSlot(slot, tileInfo, container)
        }
      })

      // Click to remove tile from slot
      slot.addEventListener('click', () => {
        const tileElement = slot.querySelector('.letter-tile')
        if (tileElement) {
          slot.removeChild(tileElement)
          this.updateHandDisplay(container)
        }
      })
    })

    // Setup hand tile interactions
    this.setupHandTileListeners(container)
  }

  private setupHandTileListeners(container: HTMLElement): void {
    const handTiles = container.querySelector('#hand-tiles') as HTMLElement
    
    // We'll update this in updateHandDisplay to add listeners to new tiles
  }

  private setupKeyboardListener(container: HTMLElement): void {
    // Remove any existing keyboard listeners to avoid duplicates
    document.removeEventListener('keydown', this.handleKeyDown)
    
    // Add new keyboard listener
    this.handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if the Letter Game is currently open
      if (!this.gameElement || this.gameElement.style.display === 'none') {
        return
      }

      // Ignore if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      const pressedKey = event.key.toUpperCase()
      
      // Handle Enter key to submit word
      if (event.key === 'Enter') {
        event.preventDefault()
        const submitButton = container.querySelector('#submit-letter-word') as HTMLButtonElement
        if (submitButton) {
          submitButton.click()
        }
        return
      }
      
      // Handle Backspace key to remove last placed tile
      if (event.key === 'Backspace') {
        event.preventDefault()
        this.removeLastTile(container)
        return
      }
      
      // Check if it's a letter
      if (pressedKey.length === 1 && pressedKey >= 'A' && pressedKey <= 'Z') {
        event.preventDefault() // Prevent default browser behavior
        
        // Find the first available tile with this letter in the hand
        const handTiles = container.querySelectorAll('#hand-tiles .letter-tile') as NodeListOf<HTMLElement>
        
        for (const tile of handTiles) {
          const tileLetter = tile.getAttribute('data-letter')
          
          if (tileLetter === pressedKey) {
            // Place this tile in the next available slot
            const nextSlot = this.getNextAvailableSlot(container)
            if (nextSlot) {
              const tileData = {
                id: tile.getAttribute('data-tile-id'),
                letter: tile.getAttribute('data-letter'),
                chipValue: tile.getAttribute('data-chip'),
                multiplier: tile.getAttribute('data-multiplier')
              }
              this.placeTileInSlot(nextSlot, tileData, container)
              break // Only place one tile per keypress
            }
            break
          }
        }
      }
    }
    
    document.addEventListener('keydown', this.handleKeyDown)
  }

  private handleKeyDown: (event: KeyboardEvent) => void = () => {}

  private placeTileInSlot(slot: HTMLElement, tileInfo: any, container: HTMLElement): void {
    if (slot.querySelector('.letter-tile')) return // Slot already occupied

    // Get slot index and reserve it
    const slots = container.querySelectorAll('.letter-slot')
    const slotIndex = Array.from(slots).indexOf(slot)
    if (slotIndex !== -1) {
      this.reservedSlots.add(slotIndex)
    }

    // Find the source tile in the hand
    const sourceTile = container.querySelector(`#hand-tiles [data-tile-id="${tileInfo.id}"]`) as HTMLElement
    if (!sourceTile) {
      // Fallback to immediate placement if source tile not found
      this.placeTileImmediately(slot, tileInfo, container)
      if (slotIndex !== -1) {
        this.reservedSlots.delete(slotIndex) // Release reservation
      }
      return
    }

    // Create an animated clone of the tile
    const animatedTile = sourceTile.cloneNode(true) as HTMLElement
    animatedTile.className = 'letter-tile letter-tile-sliding'
    
    // Get positions for animation
    const sourceRect = sourceTile.getBoundingClientRect()
    const targetRect = slot.getBoundingClientRect()
    
    // Position the animated tile at the source location
    animatedTile.style.left = `${sourceRect.left}px`
    animatedTile.style.top = `${sourceRect.top}px`
    animatedTile.style.width = `${sourceRect.width}px`
    animatedTile.style.height = `${sourceRect.height}px`
    
    // Hide the source tile immediately
    sourceTile.style.opacity = '0'
    sourceTile.style.pointerEvents = 'none'
    
    // Add to document body for animation
    document.body.appendChild(animatedTile)
    
    // Start animation on next frame
    requestAnimationFrame(() => {
      animatedTile.style.left = `${targetRect.left}px`
      animatedTile.style.top = `${targetRect.top}px`
      animatedTile.style.width = `${targetRect.width}px`
      animatedTile.style.height = `${targetRect.height}px`
      animatedTile.classList.add('slide-complete')
    })
    
    // When animation completes, place the actual tile and clean up
    setTimeout(() => {
      this.placeTileImmediately(slot, tileInfo, container)
      document.body.removeChild(animatedTile)
      this.updateHandDisplay(container)
      
      // Release slot reservation
      if (slotIndex !== -1) {
        this.reservedSlots.delete(slotIndex)
      }
    }, 400) // Match the CSS transition duration
  }

  private placeTileImmediately(slot: HTMLElement, tileInfo: any, container: HTMLElement): void {
    // Create tile element for slot
    const tileElement = document.createElement('div')
    tileElement.className = 'letter-tile placed-tile'
    tileElement.setAttribute('data-tile-id', tileInfo.id)
    tileElement.setAttribute('data-letter', tileInfo.letter)
    tileElement.setAttribute('data-chip', tileInfo.chipValue)
    tileElement.setAttribute('data-multiplier', tileInfo.multiplier)
    tileElement.innerHTML = `
      <div class="tile-letter">${tileInfo.letter}</div>
      <div class="tile-multiplier">${tileInfo.multiplier}</div>
      <div class="tile-chip-value">${tileInfo.chipValue}</div>
    `

    slot.appendChild(tileElement)
  }

  private getNextAvailableSlot(container: HTMLElement): HTMLElement | null {
    const slots = container.querySelectorAll('.letter-slot')
    
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i] as HTMLElement
      // Check if slot is both empty AND not reserved for an incoming animation
      if (!slot.querySelector('.letter-tile') && !this.reservedSlots.has(i)) {
        return slot
      }
    }
    
    return null
  }

  private removeLastTile(container: HTMLElement): void {
    const slots = container.querySelectorAll('.letter-slot')
    
    // Find the last filled slot (rightmost slot with a tile)
    for (let i = slots.length - 1; i >= 0; i--) {
      const slot = slots[i] as HTMLElement
      const tileElement = slot.querySelector('.letter-tile')
      
      if (tileElement) {
        // Animate the tile back to hand
        this.animateTileToHand(tileElement as HTMLElement, slot, container)
        return // Only remove one tile per backspace
      }
    }
  }

  private animateTileToHand(tileElement: HTMLElement, slot: HTMLElement, container: HTMLElement): void {
    // Get slot index and clear any reservation
    const slots = container.querySelectorAll('.letter-slot')
    const slotIndex = Array.from(slots).indexOf(slot)
    if (slotIndex !== -1) {
      this.reservedSlots.delete(slotIndex)
    }

    // Create an animated clone of the tile
    const animatedTile = tileElement.cloneNode(true) as HTMLElement
    animatedTile.className = 'letter-tile letter-tile-sliding'
    
    // Get source position (current slot position)
    const sourceRect = tileElement.getBoundingClientRect()
    
    // Remove the original tile from slot immediately
    slot.removeChild(tileElement)
    
    // Update hand display to calculate where the tile should go
    this.updateHandDisplay(container)
    
    // Find where this tile appears in the updated hand
    const tileId = animatedTile.getAttribute('data-tile-id')
    const targetTile = container.querySelector(`#hand-tiles [data-tile-id="${tileId}"]`) as HTMLElement
    
    let targetRect: DOMRect
    if (targetTile) {
      targetRect = targetTile.getBoundingClientRect()
      // Hide the target tile temporarily
      targetTile.style.opacity = '0'
    } else {
      // Fallback: slide to the end of the hand area
      const handTiles = container.querySelector('#hand-tiles') as HTMLElement
      const handRect = handTiles.getBoundingClientRect()
      targetRect = new DOMRect(
        handRect.right - 80, // Approximate tile width
        handRect.top,
        80,
        80
      )
    }
    
    // Position the animated tile at the source location
    animatedTile.style.left = `${sourceRect.left}px`
    animatedTile.style.top = `${sourceRect.top}px`
    animatedTile.style.width = `${sourceRect.width}px`
    animatedTile.style.height = `${sourceRect.height}px`
    
    // Add to document body for animation
    document.body.appendChild(animatedTile)
    
    // Start animation on next frame
    requestAnimationFrame(() => {
      animatedTile.style.left = `${targetRect.left}px`
      animatedTile.style.top = `${targetRect.top}px`
      animatedTile.style.width = `${targetRect.width}px`
      animatedTile.style.height = `${targetRect.height}px`
      animatedTile.classList.add('slide-complete')
    })
    
    // When animation completes, clean up and show the actual tile
    setTimeout(() => {
      if (targetTile) {
        targetTile.style.opacity = '1'
      }
      document.body.removeChild(animatedTile)
      
      // Show feedback
      const feedback = container.querySelector('#letter-word-feedback') as HTMLElement
      if (feedback) {
        feedback.textContent = 'Last tile removed!'
        feedback.className = 'word-feedback success'
      }
    }, 400) // Match the CSS transition duration
  }

  openGame(): void {
    console.log('🎯 Letter Game openGame() called')
    console.log('📱 Game element exists:', !!this.gameElement)
    
    if (this.gameElement) {
      const elements = this.ui.getElements()
      console.log('🎮 UI elements:', elements)
      
      // Hide ALL main UI elements
      if (elements.gameView) {
        elements.gameView.style.display = 'none'
        console.log('👁️ Main game view hidden')
      }
      
      // Hide individual UI elements that might still be visible
      if (elements.moneyCounter) elements.moneyCounter.style.display = 'none'
      if (elements.diamondsCounter) elements.diamondsCounter.style.display = 'none'
      if (elements.emeraldsCounter) elements.emeraldsCounter.style.display = 'none'
      if (elements.healthBarContainer) elements.healthBarContainer.style.display = 'none'
      
      // Hide any other floating UI elements
      const allButtons = document.querySelectorAll<HTMLElement>('.shop-button, .degen-diamonds-button, .snake-button, .letter-game-button, .tile-shop-button')
      allButtons.forEach(button => {
        button.style.display = 'none'
      })
      
      // Make the game take up the full screen
      this.gameElement.style.display = 'block'
      this.gameElement.style.position = 'fixed'
      this.gameElement.style.top = '0'
      this.gameElement.style.left = '0'
      this.gameElement.style.width = '100vw'
      this.gameElement.style.height = '100vh'
      this.gameElement.style.zIndex = '1000'
      this.gameElement.style.backgroundColor = '#1a1a2e'
      this.gameElement.style.overflow = 'auto'
      this.gameElement.style.padding = '20px'
      this.gameElement.style.boxSizing = 'border-box'
      this.gameElement.style.margin = '0'
      
      // Re-setup keyboard listeners when reopening the game
      this.setupKeyboardListener(this.gameElement)
      
      console.log('🎲 Letter game element shown')
      console.log('📏 Game element dimensions:', {
        width: this.gameElement.offsetWidth,
        height: this.gameElement.offsetHeight,
        display: this.gameElement.style.display
      })
    } else {
      console.error('❌ Game element is null! Letter game UI was not created properly.')
    }
  }

  closeGame(): void {
    if (this.gameElement) {
      this.gameElement.style.display = 'none'
      
      // Remove keyboard listener
      document.removeEventListener('keydown', this.handleKeyDown)
      
      // Reset game state
      this.gameInstance.setLetterGameState(false)
      
      // Hide the letter game's duplicate currency counters
      const letterMoneyCounter = document.querySelector('#letter-money-counter') as HTMLElement
      const letterDiamondsCounter = document.querySelector('#letter-diamonds-counter') as HTMLElement
      const letterEmeraldsCounter = document.querySelector('#letter-emeralds-counter') as HTMLElement
      const letterTilesCounter = document.querySelector('#letter-tiles-counter') as HTMLElement
      
      if (letterMoneyCounter) letterMoneyCounter.style.display = 'none'
      if (letterDiamondsCounter) letterDiamondsCounter.style.display = 'none' 
      if (letterEmeraldsCounter) letterEmeraldsCounter.style.display = 'none'
      if (letterTilesCounter) letterTilesCounter.style.display = 'none'
      
      // Restore the main UI elements that were hidden when opening the game
      const elements = this.ui.getElements()
      
      // Show main game view
      if (elements.gameView) {
        elements.gameView.style.display = 'block'
      }
      
      // Restore all main UI elements that were hidden
      if (elements.moneyCounter) elements.moneyCounter.style.display = 'block'
      if (elements.diamondsCounter) elements.diamondsCounter.style.display = 'block'
      if (elements.emeraldsCounter) elements.emeraldsCounter.style.display = 'block'
      if (elements.healthBarContainer) elements.healthBarContainer.style.display = 'block'
      
      // Show buttons that should be visible on main screen
      const allButtons = document.querySelectorAll<HTMLElement>('.shop-button, .degen-diamonds-button, .snake-button, .letter-game-button, .tile-shop-button')
      allButtons.forEach(button => {
        button.style.display = 'block'
      })
      
      // Reset letter game element styles
      this.gameElement.style.position = 'static'
      this.gameElement.style.top = 'auto'
      this.gameElement.style.left = 'auto'
      this.gameElement.style.width = 'auto'
      this.gameElement.style.height = 'auto'
      this.gameElement.style.zIndex = 'auto'
      this.gameElement.style.backgroundColor = 'transparent'
      this.gameElement.style.overflow = 'visible'
      this.gameElement.style.padding = '0'
      this.gameElement.style.boxSizing = 'content-box'
      this.gameElement.style.margin = 'auto'
      
      // Update all currency displays to reflect current state
      this.gameInstance.refreshAllCurrencyDisplays()
      
      // Return to letter game launch screen instead of main game
      this.gameInstance.returnToLetterGameLaunch()
    }
  }

  getTilesEarned(): number {
    return this.gameState.tilesEarned
  }

  getGameState(): LetterGameState {
    return { ...this.gameState }
  }

  refreshGameUI(): void {
    if (this.gameElement) {
      // Store current state
      const wasVisible = this.gameElement.style.display !== 'none'
      
      // Remove old game element
      this.gameElement.remove()
      
      // Create new game element
      this.gameElement = this.createGameUI()
      
      // Add to DOM
      const app = document.querySelector<HTMLDivElement>('#app')!
      app.appendChild(this.gameElement)
      
      // Restore visibility if it was visible before
      if (wasVisible) {
        this.openGame()
      }
      
      console.log('🔄 Letter Game UI refreshed - Discard zone:', this.gameInstance.getState().discardZoneUnlocked ? 'unlocked' : 'locked')
    }
  }

  private setupDiscardZone(container: HTMLElement): void {
    const discardSlots = container.querySelectorAll('.discard-slot')
    const rerollButton = container.querySelector('#reroll-tiles') as HTMLElement

    // Setup drag and drop for discard slots
    discardSlots.forEach(slot => {
      const slotElement = slot as HTMLElement
      
      slotElement.addEventListener('dragover', (e) => {
        e.preventDefault()
        slotElement.classList.add('drag-over')
      })

      slotElement.addEventListener('dragenter', (e) => {
        e.preventDefault()
      })

      slotElement.addEventListener('dragleave', () => {
        slotElement.classList.remove('drag-over')
      })

      slotElement.addEventListener('drop', (e) => {
        e.preventDefault()
        slotElement.classList.remove('drag-over')
        
        const dragData = e.dataTransfer?.getData('text/plain')
        if (dragData) {
          const data = JSON.parse(dragData)
          if (data.source === 'hand' && slotElement.children.length === 0) {
            this.moveTileToDiscardSlot(data.id, slotElement, container)
          }
        }
      })
    })

    // Setup reroll button
    if (rerollButton) {
      rerollButton.addEventListener('click', () => {
        this.rerollDiscardedTiles(container)
      })
    }
    
    // Initial button state and slot visibility update
    this.updateRerollButtonState(container)
  }

  private moveTileToDiscardSlot(tileId: string, discardSlot: HTMLElement, container: HTMLElement): void {
    // Find the tile in the current hand
    const tileIndex = this.gameState.currentHand.findIndex(tile => tile.id === tileId)
    if (tileIndex === -1) return

    const tile = this.gameState.currentHand[tileIndex]
    
    // Create tile element for discard slot using the same HTML structure as hand tiles
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = this.createTileHTML(tile)
    const tileElement = tempDiv.firstElementChild as HTMLElement
    
    // Add click handler to move back to hand
    tileElement.addEventListener('click', () => {
      this.moveDiscardedTileBackToHand(tile.id, container)
    })

    discardSlot.appendChild(tileElement)
    
    // Update displays and slot visibility
    this.updateHandDisplay(container)
    this.updateRerollButtonState(container)
  }

  private moveDiscardedTileBackToHand(tileId: string, container: HTMLElement): void {
    // Find and remove the tile from discard slot
    const discardSlots = container.querySelectorAll('.discard-slot')
    discardSlots.forEach(slot => {
      const tileElement = slot.querySelector(`[data-tile-id="${tileId}"]`)
      if (tileElement) {
        slot.removeChild(tileElement)
      }
    })
    
    // Update displays and slot visibility
    this.updateHandDisplay(container)
    this.updateRerollButtonState(container)
  }

  private rerollDiscardedTiles(container: HTMLElement): void {
    const discardSlots = container.querySelectorAll('.discard-slot')
    const discardedTileIds: string[] = []
    
    // Collect all discarded tile IDs
    discardSlots.forEach(slot => {
      const tileElement = slot.querySelector('.letter-tile')
      if (tileElement) {
        const tileId = tileElement.getAttribute('data-tile-id')
        if (tileId) {
          discardedTileIds.push(tileId)
        }
      }
    })

    if (discardedTileIds.length === 0) return

    // Remove discarded tiles from hand
    discardedTileIds.forEach(tileId => {
      const tileIndex = this.gameState.currentHand.findIndex(tile => tile.id === tileId)
      if (tileIndex !== -1) {
        this.gameState.currentHand.splice(tileIndex, 1)
      }
    })

    // Add new tiles to replace the discarded ones
    for (let i = 0; i < discardedTileIds.length; i++) {
      if (this.gameState.deck.length > 0) {
        const newTile = this.gameState.deck.pop()!
        this.gameState.currentHand.push(newTile)
      }
    }

    // Clear discard slots
    discardSlots.forEach(slot => {
      slot.innerHTML = ''
    })

    // Update displays and slot visibility
    this.updateHandDisplay(container)
    this.updateRerollButtonState(container)
    
    console.log(`Rerolled ${discardedTileIds.length} tiles!`)
  }

  private updateDiscardSlotVisibility(container: HTMLElement): void {
    const discardSlots = container.querySelectorAll('.discard-slot') as NodeListOf<HTMLElement>
    
    // Count how many slots are filled
    let filledSlots = 0
    discardSlots.forEach((slot) => {
      if (slot.children.length > 0) {
        filledSlots++
      }
    })
    
    // Show slots progressively: always show at least one slot, plus one more if any slots are filled
    const slotsToShow = Math.min(filledSlots + 1, 5)
    
    discardSlots.forEach((slot, index) => {
      if (index < slotsToShow) {
        slot.style.display = 'block'
      } else {
        slot.style.display = 'none'
      }
    })
  }

  private updateRerollButtonState(container: HTMLElement): void {
    // Only update if discard zone is unlocked
    if (!this.gameInstance.getState().discardZoneUnlocked) {
      return
    }

    const rerollButton = container.querySelector('#reroll-tiles') as HTMLElement
    const discardSlots = container.querySelectorAll('.discard-slot')
    
    if (!rerollButton) return

    // Show button only if there are tiles in discard slots
    let hasDiscardedTiles = false
    discardSlots.forEach(slot => {
      if (slot.children.length > 0) {
        hasDiscardedTiles = true
      }
    })

    if (hasDiscardedTiles) {
      rerollButton.style.display = 'block'
      rerollButton.removeAttribute('disabled')
    } else {
      rerollButton.style.display = 'none'
    }
    
    // Update slot visibility
    this.updateDiscardSlotVisibility(container)
  }
} 