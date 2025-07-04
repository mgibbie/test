/**
 * Mobile Hover Fix Utility
 * Prevents hover states from getting stuck on mobile devices
 */

class MobileHoverFix {
  private touchDevice: boolean = false
  private clearTimeout: number | null = null

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

    // Simple global touch handler
    document.addEventListener('touchstart', this.handleTouch.bind(this), { passive: true })

    // Add event listeners for interactive elements
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
      element.classList.add('touch-active')
    }, { passive: true })

    element.addEventListener('touchend', (e) => {
      element.classList.remove('touch-active')
    }, { passive: true })

    element.addEventListener('touchcancel', (e) => {
      element.classList.remove('touch-active')
    }, { passive: true })
  }

  private handleTouch(e: TouchEvent): void {
    // Clear any existing timeout
    if (this.clearTimeout) {
      clearTimeout(this.clearTimeout)
    }

    // Debounced hover state clearing
    this.clearTimeout = window.setTimeout(() => {
      if (document.querySelectorAll(':hover').length > 0) {
        this.clearAllHoverStates()
      }
    }, 100)
  }

  private clearAllHoverStates(): void {
    // Remove any artificial hover classes
    document.querySelectorAll('.hover, [data-hover="true"]').forEach(element => {
      element.classList.remove('hover')
      element.removeAttribute('data-hover')
    })

    // Gentle approach: just add a temporary class to force CSS recalculation
    document.body.classList.add('mobile-touch-clear')
    // Remove it on next frame to trigger reflow without visual disruption
    requestAnimationFrame(() => {
      document.body.classList.remove('mobile-touch-clear')
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