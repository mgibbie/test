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

    // Global touch handlers for immediate clearing
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true })
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true })
    document.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: true })

    // Add element-specific listeners for better control
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
      // Add touch feedback and clear hover states
      element.classList.add('touch-active')
      // Force the element out of hover state specifically
      this.clearElementHover(element)
    }, { passive: true })

    element.addEventListener('touchend', (e) => {
      element.classList.remove('touch-active')
      // Additional clearing after touch ends
      setTimeout(() => {
        this.clearElementHover(element)
      }, 10)
    }, { passive: true })

    element.addEventListener('touchcancel', (e) => {
      element.classList.remove('touch-active')
      this.clearElementHover(element)
    }, { passive: true })
  }

  private clearElementHover(element: Element): void {
    // Force element out of hover by temporarily disabling pointer events
    const originalPointerEvents = (element as HTMLElement).style.pointerEvents
    ;(element as HTMLElement).style.pointerEvents = 'none'
    
    // Restore pointer events on next frame
    requestAnimationFrame(() => {
      ;(element as HTMLElement).style.pointerEvents = originalPointerEvents
    })
  }

  private handleTouchStart(e: TouchEvent): void {
    // Immediately clear any stuck hover states
    this.clearAllHoverStates()
  }

  private handleTouchEnd(e: TouchEvent): void {
    // Clear any remaining hover states after touch ends
    if (this.clearTimeout) {
      clearTimeout(this.clearTimeout)
    }
    
    this.clearTimeout = window.setTimeout(() => {
      this.clearAllHoverStates()
    }, 50)
  }

  private clearAllHoverStates(): void {
    // Remove any artificial hover classes
    document.querySelectorAll('.hover, [data-hover="true"]').forEach(element => {
      element.classList.remove('hover')
      element.removeAttribute('data-hover')
    })

    // More effective approach: temporarily disable pointer events on hovered elements
    const hoveredElements = document.querySelectorAll(':hover')
    const originalStyles: Array<{element: HTMLElement, pointerEvents: string}> = []
    
    hoveredElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        originalStyles.push({
          element,
          pointerEvents: element.style.pointerEvents
        })
        element.style.pointerEvents = 'none'
      }
    })

    // Restore pointer events on next frame to prevent white flash
    if (originalStyles.length > 0) {
      requestAnimationFrame(() => {
        originalStyles.forEach(({element, pointerEvents}) => {
          element.style.pointerEvents = pointerEvents
        })
      })
    }
  }

  /**
   * Manually refresh hover listeners for dynamically added elements
   */
  public refresh(): void {
    if (this.touchDevice) {
      this.addHoverListeners()
      // Clear any existing hover states when refreshing
      this.clearAllHoverStates()
    }
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