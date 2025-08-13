/**
 * Keyboard Navigation Utilities
 * Provides keyboard shortcuts and navigation support
 */

class KeyboardNavigation {
  constructor() {
    this.shortcuts = new Map()
    this.isEnabled = true
    this.listeners = []
  }

  /**
   * Register a keyboard shortcut
   */
  registerShortcut(key, callback, description = '') {
    this.shortcuts.set(key, { callback, description })
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregisterShortcut(key) {
    this.shortcuts.delete(key)
  }

  /**
   * Handle keydown events
   */
  handleKeyDown = (event) => {
    if (!this.isEnabled) return

    // Don't trigger shortcuts when typing in input fields
    if (event.target.tagName === 'INPUT' || 
        event.target.tagName === 'TEXTAREA' || 
        event.target.contentEditable === 'true') {
      return
    }

    const key = this.getKeyString(event)
    const shortcut = this.shortcuts.get(key)

    if (shortcut) {
      event.preventDefault()
      shortcut.callback(event)
    }
  }

  /**
   * Convert keydown event to shortcut string
   */
  getKeyString(event) {
    const modifiers = []
    
    if (event.ctrlKey || event.metaKey) modifiers.push('Ctrl')
    if (event.altKey) modifiers.push('Alt')
    if (event.shiftKey) modifiers.push('Shift')
    
    let key = event.key.toLowerCase()
    
    // Handle special keys
    const specialKeys = {
      ' ': 'Space',
      'escape': 'Escape',
      'enter': 'Enter',
      'tab': 'Tab',
      'backspace': 'Backspace',
      'delete': 'Delete',
      'arrowup': 'ArrowUp',
      'arrowdown': 'ArrowDown',
      'arrowleft': 'ArrowLeft',
      'arrowright': 'ArrowRight',
      'home': 'Home',
      'end': 'End',
      'pageup': 'PageUp',
      'pagedown': 'PageDown'
    }
    
    if (specialKeys[key]) {
      key = specialKeys[key]
    } else if (key.length === 1) {
      key = key.toUpperCase()
    }
    
    return [...modifiers, key].join('+')
  }

  /**
   * Enable keyboard navigation
   */
  enable() {
    this.isEnabled = true
  }

  /**
   * Disable keyboard navigation
   */
  disable() {
    this.isEnabled = false
  }

  /**
   * Start listening for keyboard events
   */
  start() {
    document.addEventListener('keydown', this.handleKeyDown)
  }

  /**
   * Stop listening for keyboard events
   */
  stop() {
    document.removeEventListener('keydown', this.handleKeyDown)
  }

  /**
   * Get all registered shortcuts
   */
  getShortcuts() {
    return Array.from(this.shortcuts.entries()).map(([key, { description }]) => ({
      key,
      description
    }))
  }

  /**
   * Focus management utilities
   */
  focusNextElement() {
    const focusableElements = this.getFocusableElements()
    const currentIndex = focusableElements.indexOf(document.activeElement)
    const nextIndex = (currentIndex + 1) % focusableElements.length
    focusableElements[nextIndex]?.focus()
  }

  focusPreviousElement() {
    const focusableElements = this.getFocusableElements()
    const currentIndex = focusableElements.indexOf(document.activeElement)
    const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1
    focusableElements[prevIndex]?.focus()
  }

  getFocusableElements() {
    return Array.from(document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.disabled && el.offsetParent !== null)
  }

  /**
   * Trap focus within a container
   */
  trapFocus(container) {
    const focusableElements = Array.from(container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.disabled)

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTab = (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    container.addEventListener('keydown', handleTab)
    
    // Return cleanup function
    return () => container.removeEventListener('keydown', handleTab)
  }
}

// Create singleton instance
export const keyboardNavigation = new KeyboardNavigation()

// Register default shortcuts
export const registerDefaultShortcuts = (appStore) => {
  const { setCurrentView, addNotification } = appStore

  // View switching shortcuts
  keyboardNavigation.registerShortcut('Ctrl+1', () => {
    setCurrentView('morning')
    addNotification({
      type: 'info',
      title: 'Switched to Morning View',
      message: 'Use Ctrl+2 for Evening, Ctrl+3 for Quick Track'
    })
  }, 'Switch to Morning View')

  keyboardNavigation.registerShortcut('Ctrl+2', () => {
    setCurrentView('evening')
    addNotification({
      type: 'info',
      title: 'Switched to Evening View',
      message: 'Use Ctrl+1 for Morning, Ctrl+3 for Quick Track'
    })
  }, 'Switch to Evening View')

  keyboardNavigation.registerShortcut('Ctrl+3', () => {
    setCurrentView('quick')
    addNotification({
      type: 'info',
      title: 'Switched to Quick Track',
      message: 'Use Ctrl+1 for Morning, Ctrl+2 for Evening'
    })
  }, 'Switch to Quick Track')

  // Navigation shortcuts
  keyboardNavigation.registerShortcut('Ctrl+S', () => {
    addNotification({
      type: 'info',
      title: 'Save',
      message: 'Auto-save is enabled. Your data is automatically saved.'
    })
  }, 'Save (Auto-save is enabled)')

  keyboardNavigation.registerShortcut('Ctrl+R', () => {
    addNotification({
      type: 'info',
      title: 'Reset',
      message: 'Go to Settings to reset your configuration'
    })
  }, 'Reset Configuration')

  keyboardNavigation.registerShortcut('Ctrl+E', () => {
    addNotification({
      type: 'info',
      title: 'Edit Mode',
      message: 'Use the Settings page to customize your tracking items'
    })
  }, 'Edit Mode')

  // Escape key to close modals
  keyboardNavigation.registerShortcut('Escape', () => {
    // This will be handled by individual components
    const event = new CustomEvent('escapeKeyPressed')
    document.dispatchEvent(event)
  }, 'Close modal or cancel action')

  // Tab navigation
  keyboardNavigation.registerShortcut('Tab', () => {
    // Default tab behavior is handled by the browser
  }, 'Navigate between elements')

  // Enter/Space for selections
  keyboardNavigation.registerShortcut('Enter', () => {
    // Default enter behavior is handled by the browser
  }, 'Activate selected element')

  keyboardNavigation.registerShortcut('Space', () => {
    // Default space behavior is handled by the browser
  }, 'Activate selected element')
}

// Start keyboard navigation
keyboardNavigation.start() 