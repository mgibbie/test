export interface Currency {
  name: string
  symbol: string
  imagePath?: string
  amount: number
}

export class CurrencyManager {
  private currencies: Map<string, Currency> = new Map()
  private ui: any
  private gameInstance: any

  constructor(ui: any, gameInstance: any) {
    this.ui = ui
    this.gameInstance = gameInstance
    this.initializeCurrencies()
  }

  private initializeCurrencies(): void {
    this.currencies.set('money', {
      name: 'Money',
      symbol: '$',
      amount: 0
    })

    this.currencies.set('diamonds', {
      name: 'Diamonds',
      symbol: '💎',
      amount: 0
    })

    this.currencies.set('emeralds', {
      name: 'Emeralds',
      symbol: '',
      imagePath: '/assets/emerald.png',
      amount: 0
    })

    this.currencies.set('sapphires', {
      name: 'Sapphires',
      symbol: '',
      imagePath: '/assets/sapphire.png',
      amount: 0
    })

    this.currencies.set('tiles', {
      name: 'Tiles',
      symbol: '🟦',
      amount: 0
    })
  }

  public getCurrency(currencyType: string): number {
    return this.currencies.get(currencyType)?.amount || 0
  }

  public addCurrency(currencyType: string, amount: number): void {
    const currency = this.currencies.get(currencyType)
    if (currency) {
      currency.amount += amount
      this.refreshDisplay(currencyType)
    }
  }

  public spendCurrency(currencyType: string, amount: number): boolean {
    const currency = this.currencies.get(currencyType)
    if (currency && currency.amount >= amount) {
      currency.amount -= amount
      this.refreshDisplay(currencyType)
      return true
    }
    return false
  }

  public getAllCurrencies(): Map<string, Currency> {
    return this.currencies
  }

  public setCurrency(currencyType: string, amount: number): void {
    const currency = this.currencies.get(currencyType)
    if (currency) {
      currency.amount = amount
      this.refreshDisplay(currencyType)
    }
  }

  private refreshDisplay(currencyType: string): void {
    const elements = this.ui.getElements()
    const currency = this.currencies.get(currencyType)
    if (!currency) return

    let element: HTMLElement | null = null
    
    switch (currencyType) {
      case 'money':
        element = elements.moneyCounter
        break
      case 'diamonds':
        element = elements.diamondsCounter
        break
      case 'emeralds':
        element = elements.emeraldsCounter
        break
      case 'sapphires':
        element = elements.sapphiresCounter
        break
      case 'tiles':
        element = elements.tilesCounter
        break
    }

    if (element) {
      if (currency.imagePath) {
        const img = element.querySelector('img')
        const span = element.querySelector('span')
        if (img && span) {
          span.textContent = currency.amount.toString()
        }
      } else {
        element.textContent = `${currency.symbol}${currency.amount}`
      }

      // Show element if currency > 0
      if (currency.amount > 0) {
        element.style.display = 'block'
      }
    }
  }

  public refreshAllDisplays(): void {
    this.currencies.forEach((_, currencyType) => {
      this.refreshDisplay(currencyType)
    })
  }

  public getDisplayData(currencyType: string): { symbol: string, imagePath?: string } | null {
    const currency = this.currencies.get(currencyType)
    if (!currency) return null
    
    return {
      symbol: currency.symbol,
      imagePath: currency.imagePath
    }
  }
}