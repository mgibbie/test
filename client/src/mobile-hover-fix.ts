/**
 * Mobile Hover Fix Utility
 * Prevents hover states from getting stuck on mobile devices
 */

class MobileHoverFix {
  private touchDevice: boolean = false
  private elementsWithHover: Set<Element> = new Set()

  constructor() {
    this.detectTouchDevice()
    this.init()
  }

  private detectTouchDevice(): void {
    this.touchDevice = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - Some browsers don't have this property
      navigator.msMaxTouchPoints > 0
    )
  }

  private init(): void {
    if (!this.touchDevice) return

    // Add touch event listeners to body
    document.body.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true })
    document.body.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true })
    document.body.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: true })

    // Add event listeners for upgrade nodes and interactive elements
    this.addHoverListeners()
  }

  private addHoverListeners(): void {
    const selectors = [
      '.upgrade-node',
      '.snake-upgrade-node', 
      '.shop-button',
      '.back-button',
      '.snake-shop-back-button',
      '.start-button',
      '.money-counter',
      '.diamonds-counter',
      '.emeralds-counter',
      '.tiles-counter',
      '.sapphires-counter',
      '.diamond-shop-button',
      '.snake-start-button',
      '.snake-restart-button',
      '.diamond-leave-button',
      '.reroll-button',
      '.submit-button',
      '.hint-button',
      '.new-hand-button',
      '.clear-button',
      '.letter-back-button',
      '.wager-start-button'
    ]

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(element => {
        this.addElementListeners(element)
      })
    })
  }

  private addElementListeners(element: Element): void {
    element.addEventListener('touchstart', (e) => {
      this.clearAllHoverStates()
      element.classList.add('touch-active')
    }, { passive: true })

    element.addEventListener('touchend', (e) => {
      setTimeout(() => {
        element.classList.remove('touch-active')
        this.clearAllHoverStates()
      }, 50)
    }, { passive: true })

    element.addEventListener('touchcancel', (e) => {
      element.classList.remove('touch-active')
      this.clearAllHoverStates()
    }, { passive: true })
  }

  private handleTouchStart(e: TouchEvent): void {
    this.clearAllHoverStates()
  }

  private handleTouchEnd(e: TouchEvent): void {
    // Small delay to ensure all hover states are cleared
    setTimeout(() => {
      this.clearAllHoverStates()
    }, 100)
  }

  private clearAllHoverStates(): void {
    // Remove any artificial hover classes
    document.querySelectorAll('.hover, [data-hover="true"]').forEach(element => {
      element.classList.remove('hover')
      element.removeAttribute('data-hover')
    })

    // Force reflow to clear any stuck CSS hover states
    document.querySelectorAll('*:hover').forEach(element => {
      if (element.parentNode) {
        const temp = element.nextSibling
        const parent = element.parentNode
        parent.removeChild(element)
        parent.insertBefore(element, temp)
      }
    })
  }

  /**
   * Manually refresh hover listeners for dynamically added elements
   */
  public refresh(): void {
    this.addHoverListeners()
  }

  /**
   * Add hover prevention to specific element
   */
  public addElement(element: Element): void {
    if (this.touchDevice) {
      this.addElementListeners(element)
    }
  }

  /**
   * Check if device is touch-enabled
   */
  public isTouchDevice(): boolean {
    return this.touchDevice
  }
}

// Create global instance
const mobileHoverFix = new MobileHoverFix()

// Export for use in other modules
export default mobileHoverFix

// Add to window for global access
declare global {
  interface Window {
    mobileHoverFix: MobileHoverFix
  }
}

window.mobileHoverFix = mobileHoverFix