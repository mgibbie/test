export class WordValidator {
  private wordSet: Set<string> = new Set()
  private loaded: boolean = false
  private loading: Promise<void> | null = null

  constructor() {}

  async loadWordList(filePath: string = '/assets/word-lists/comprehensive-words.txt'): Promise<void> {
    if (this.loaded) return
    
    // If already loading, return the same promise
    if (this.loading) return this.loading

    this.loading = this.doLoad(filePath)
    await this.loading
    this.loading = null
  }

  private async doLoad(filePath: string): Promise<void> {
    try {
      console.log('📚 Loading word list from:', filePath)
      const response = await fetch(filePath)
      
      console.log('📥 Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        throw new Error(`Failed to load word list: ${response.status} ${response.statusText}`)
      }
      
      const text = await response.text()
      console.log('📄 Text loaded, length:', text.length)
      
      const words = text.split('\n')
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length > 0)
      
      console.log('🔤 Words processed:', words.length)
      
      this.wordSet = new Set(words)
      this.loaded = true
      
      console.log(`✅ Loaded ${this.wordSet.size} words into dictionary`)
      console.log('📝 Sample words:', words.slice(0, 10))
    } catch (error) {
      console.error('❌ Failed to load word list from', filePath, ':', error)
      throw error
    }
  }

  async isValidWord(word: string): Promise<boolean> {
    if (!this.loaded) {
      await this.loadWordList()
    }
    
    const normalizedWord = word.trim().toUpperCase()
    
    // Basic validation
    if (normalizedWord.length < 2) return false
    if (!/^[A-Z]+$/.test(normalizedWord)) return false
    
    return this.wordSet.has(normalizedWord)
  }

  async validateWords(words: string[]): Promise<Array<{word: string, valid: boolean}>> {
    if (!this.loaded) {
      await this.loadWordList()
    }

    return words.map(word => ({
      word: word,
      valid: this.isValidWordSync(word)
    }))
  }

  private isValidWordSync(word: string): boolean {
    const normalizedWord = word.trim().toUpperCase()
    
    if (normalizedWord.length < 2) return false
    if (!/^[A-Z]+$/.test(normalizedWord)) return false
    
    return this.wordSet.has(normalizedWord)
  }

  isReady(): boolean {
    return this.loaded
  }

  getStats(): {totalWords: number, loaded: boolean, sampleWords: string[]} {
    const sampleWords = this.loaded 
      ? Array.from(this.wordSet).slice(0, 10) 
      : []
    
    return {
      totalWords: this.wordSet.size,
      loaded: this.loaded,
      sampleWords
    }
  }

  // Method to check if a word is in a specific length range (useful for Scrabble)
  async getWordsOfLength(length: number): Promise<string[]> {
    if (!this.loaded) {
      await this.loadWordList()
    }
    
    return Array.from(this.wordSet).filter(word => word.length === length)
  }

  // Method to find words that can be made from given letters (useful for Scrabble)
  async findWordsFromLetters(availableLetters: string, minLength: number = 2): Promise<string[]> {
    if (!this.loaded) {
      await this.loadWordList()
    }

    const letterCounts = this.countLetters(availableLetters.toUpperCase())
    const validWords: string[] = []

    for (const word of this.wordSet) {
      if (word.length >= minLength && this.canMakeWord(word, letterCounts)) {
        validWords.push(word)
      }
    }

    return validWords.sort((a, b) => b.length - a.length) // Sort by length, longest first
  }

  private countLetters(letters: string): Map<string, number> {
    const counts = new Map<string, number>()
    for (const letter of letters) {
      counts.set(letter, (counts.get(letter) || 0) + 1)
    }
    return counts
  }

  private canMakeWord(word: string, availableLetters: Map<string, number>): boolean {
    const wordLetters = this.countLetters(word)
    
    for (const [letter, needed] of wordLetters) {
      const available = availableLetters.get(letter) || 0
      if (needed > available) {
        return false
      }
    }
    
    return true
  }
} 