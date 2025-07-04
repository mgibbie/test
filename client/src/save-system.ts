export interface GameSaveData {
  version: string
  currencies: {
    money: number
    diamonds: number
    emeralds: number
    sapphires: number
    tiles: number
  }
  upgrades: {
    mainShop: Record<string, { purchased: boolean, purchaseCount: number, maxed: boolean }>
    diamondShop: Record<string, { purchased: boolean, purchaseCount: number, maxed: boolean }>
    snakeShop: Record<string, { purchased: boolean, purchaseCount: number, maxed: boolean }>
    tetrisShop: Record<string, { purchased: boolean, purchaseCount: number, maxed: boolean }>
    tileShop: Record<string, { purchased: boolean, purchaseCount: number, maxed: boolean }>
  }
  gameState: {
    health: number
    maxHealth: number
    clickValue: number
    bombSliderUnlocked: boolean
    bombCount: number
    borderPortalsUnlocked: boolean
    discardZoneUnlocked: boolean
    letterGameUnlocked: boolean
  }
  statistics: {
    totalClicks: number
    totalGamesPlayed: number
    snakeGamesPlayed: number
    tetrisGamesPlayed: number
    letterGamesPlayed: number
    degenDiamondsPlayed: number
    lastPlayTime: number
    firstPlayTime: number
  }
}

export class SaveSystem {
  private static readonly SAVE_KEY = 'mikecremental_save_v2'
  private static readonly CURRENT_VERSION = '2.0.0'
  private static readonly AUTO_SAVE_INTERVAL = 10000 // 10 seconds
  
  private gameInstance: any
  private autoSaveInterval: number | null = null
  private saveData: GameSaveData
  
  constructor(gameInstance: any) {
    this.gameInstance = gameInstance
    this.saveData = this.getDefaultSaveData()
    this.startAutoSave()
  }

  private getDefaultSaveData(): GameSaveData {
    return {
      version: SaveSystem.CURRENT_VERSION,
      currencies: {
        money: 0,
        diamonds: 0,
        emeralds: 0,
        sapphires: 0,
        tiles: 0
      },
      upgrades: {
        mainShop: {},
        diamondShop: {},
        snakeShop: {},
        tetrisShop: {},
        tileShop: {}
      },
      gameState: {
        health: 20,
        maxHealth: 20,
        clickValue: 1,
        bombSliderUnlocked: false,
        bombCount: 1,
        borderPortalsUnlocked: false,
        discardZoneUnlocked: false,
        letterGameUnlocked: false
      },
      statistics: {
        totalClicks: 0,
        totalGamesPlayed: 0,
        snakeGamesPlayed: 0,
        tetrisGamesPlayed: 0,
        letterGamesPlayed: 0,
        degenDiamondsPlayed: 0,
        lastPlayTime: Date.now(),
        firstPlayTime: Date.now()
      }
    }
  }

  public load(): boolean {
    try {
      const savedDataStr = localStorage.getItem(SaveSystem.SAVE_KEY)
      if (!savedDataStr) {
        console.log('💾 No save data found, starting fresh')
        return false
      }

      const savedData = JSON.parse(savedDataStr) as GameSaveData
      
      // Check version compatibility
      if (savedData.version !== SaveSystem.CURRENT_VERSION) {
        console.log('💾 Save version mismatch, migrating save data...')
        this.migrateSaveData(savedData)
      }

      this.saveData = savedData
      this.applySaveData()
      console.log('💾 Game loaded successfully!')
      return true
    } catch (error) {
      console.error('💾 Error loading save data:', error)
      return false
    }
  }

  private migrateSaveData(oldData: any): void {
    // Handle migration between save versions
    // For now, just merge with defaults for missing properties
    this.saveData = this.deepMerge(this.getDefaultSaveData(), oldData)
    this.saveData.version = SaveSystem.CURRENT_VERSION
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target }
    
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }
    
    return result
  }

  private applySaveData(): void {
    // Apply currencies
    const currencyManager = this.gameInstance.currencyManager
    if (currencyManager) {
      Object.entries(this.saveData.currencies).forEach(([currency, amount]: [string, number]) => {
        currencyManager.setCurrency(currency, amount)
      })
    }

    // Apply game state
    const state = this.gameInstance.getState()
    Object.assign(state, this.saveData.gameState)

    // Apply upgrades
    if (this.gameInstance.shop) {
      this.applyUpgrades(this.gameInstance.shop, this.saveData.upgrades.mainShop)
    }
    if (this.gameInstance.diamondShop) {
      this.applyUpgrades(this.gameInstance.diamondShop, this.saveData.upgrades.diamondShop)
    }
    if (this.gameInstance.snakeShop) {
      this.applyUpgrades(this.gameInstance.snakeShop, this.saveData.upgrades.snakeShop)
    }
    if (this.gameInstance.tetrisShop) {
      this.applyUpgrades(this.gameInstance.tetrisShop, this.saveData.upgrades.tetrisShop)
    }
    if (this.gameInstance.tileShop) {
      this.applyUpgrades(this.gameInstance.tileShop, this.saveData.upgrades.tileShop)
    }

    // Refresh UI
    this.gameInstance.refreshAllCurrencyDisplays()
  }

  private applyUpgrades(shop: any, upgradeData: Record<string, any>): void {
    const upgrades = shop.getUpgrades()
    Object.entries(upgradeData).forEach(([upgradeId, data]: [string, any]) => {
      if (upgrades.has(upgradeId)) {
        upgrades.set(upgradeId, data)
      }
    })
  }

  public save(): void {
    try {
      this.updateSaveData()
      localStorage.setItem(SaveSystem.SAVE_KEY, JSON.stringify(this.saveData))
      console.log('💾 Game saved successfully!')
    } catch (error) {
      console.error('💾 Error saving game:', error)
    }
  }

  private updateSaveData(): void {
    // Update currencies
    const currencyManager = this.gameInstance.currencyManager
    if (currencyManager) {
      const currencies = currencyManager.getAllCurrencies()
      currencies.forEach((currency, type) => {
        if (this.saveData.currencies.hasOwnProperty(type)) {
          (this.saveData.currencies as any)[type] = currency.amount
        }
      })
    }

    // Update game state
    const state = this.gameInstance.getState()
    this.saveData.gameState = {
      health: state.health,
      maxHealth: state.maxHealth,
      clickValue: state.clickValue,
      bombSliderUnlocked: state.bombSliderUnlocked,
      bombCount: state.bombCount,
      borderPortalsUnlocked: state.borderPortalsUnlocked,
      discardZoneUnlocked: state.discardZoneUnlocked,
      letterGameUnlocked: state.letterGameUnlocked
    }

    // Update upgrades
    if (this.gameInstance.shop) {
      this.saveData.upgrades.mainShop = this.serializeUpgrades(this.gameInstance.shop)
    }
    if (this.gameInstance.diamondShop) {
      this.saveData.upgrades.diamondShop = this.serializeUpgrades(this.gameInstance.diamondShop)
    }
    if (this.gameInstance.snakeShop) {
      this.saveData.upgrades.snakeShop = this.serializeUpgrades(this.gameInstance.snakeShop)
    }
    if (this.gameInstance.tetrisShop) {
      this.saveData.upgrades.tetrisShop = this.serializeUpgrades(this.gameInstance.tetrisShop)
    }
    if (this.gameInstance.tileShop) {
      this.saveData.upgrades.tileShop = this.serializeUpgrades(this.gameInstance.tileShop)
    }

    // Update statistics
    this.saveData.statistics.lastPlayTime = Date.now()
  }

  private serializeUpgrades(shop: any): Record<string, any> {
    const result: Record<string, any> = {}
    const upgrades = shop.getUpgrades()
    upgrades.forEach((data, upgradeId) => {
      result[upgradeId] = {
        purchased: data.purchased,
        purchaseCount: data.purchaseCount,
        maxed: data.maxed
      }
    })
    return result
  }

  public incrementStatistic(stat: keyof GameSaveData['statistics'], amount: number = 1): void {
    if (stat === 'lastPlayTime' || stat === 'firstPlayTime') {
      (this.saveData.statistics as any)[stat] = Date.now()
    } else {
      (this.saveData.statistics as any)[stat] += amount
    }
  }

  public getStatistics(): GameSaveData['statistics'] {
    return { ...this.saveData.statistics }
  }

  public startAutoSave(): void {
    this.stopAutoSave()
    this.autoSaveInterval = window.setInterval(() => {
      this.save()
    }, SaveSystem.AUTO_SAVE_INTERVAL)
    console.log('💾 Auto-save started (every 10 seconds)')
  }

  public stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
      console.log('💾 Auto-save stopped')
    }
  }

  public exportSave(): string {
    this.updateSaveData()
    return JSON.stringify(this.saveData, null, 2)
  }

  public importSave(saveString: string): boolean {
    try {
      const importedData = JSON.parse(saveString) as GameSaveData
      
      // Validate save data structure
      if (!this.validateSaveData(importedData)) {
        console.error('💾 Invalid save data format')
        return false
      }

      this.saveData = importedData
      this.applySaveData()
      this.save()
      console.log('💾 Save imported successfully!')
      return true
    } catch (error) {
      console.error('💾 Error importing save:', error)
      return false
    }
  }

  private validateSaveData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      data.version &&
      data.currencies &&
      data.upgrades &&
      data.gameState &&
      data.statistics
    )
  }

  public resetSave(): void {
    localStorage.removeItem(SaveSystem.SAVE_KEY)
    this.saveData = this.getDefaultSaveData()
    console.log('💾 Save data reset')
  }

  public destroy(): void {
    this.stopAutoSave()
  }
}