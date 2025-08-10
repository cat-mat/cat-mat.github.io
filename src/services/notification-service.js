/**
 * Notification Service for PWA
 * Handles push notifications and local notifications
 */

class NotificationService {
  constructor() {
    this.isSupported = 'Notification' in window
    this.permission = this.isSupported ? Notification.permission : 'denied'
    this.isServiceWorkerSupported = 'serviceWorker' in navigator
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    if (!this.isSupported) {
      console.warn('Notifications not supported in this browser')
      return false
    }

    if (this.permission === 'granted') {
      return true
    }

    if (this.permission === 'denied') {
      console.warn('Notification permission denied')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      this.permission = permission
      return permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled() {
    return this.isSupported && this.permission === 'granted'
  }

  /**
   * Show a local notification
   */
  async showNotification(title, options = {}) {
    if (!this.isEnabled()) {
      console.warn('Notifications not enabled')
      return false
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: 'hot-self-notification',
        requireInteraction: false,
        silent: false,
        ...options
      })

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      return true
    } catch (error) {
      console.error('Error showing notification:', error)
      return false
    }
  }

  /**
   * Show insight notification
   */
  async showInsightNotification(insight) {
    const title = 'New Insight Available! 🔍'
    const body = insight.summary || 'Check out your latest health insights'
    
    return this.showNotification(title, {
      body,
      data: {
        type: 'insight',
        insightId: insight.id,
        timestamp: new Date().toISOString()
      },
      actions: [
        {
          action: 'view',
          title: 'View Insights'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    })
  }

  /**
   * Show reminder notification
   */
  async showReminderNotification(viewType) {
    const titles = {
      morning: 'Good Morning! 🌅',
      evening: 'Evening Check-in 🌙',
      quick: 'Quick Check-in ⚡'
    }

    const bodies = {
      morning: 'Time for your morning health check-in',
      evening: 'How was your day? Time to reflect',
      quick: 'Quick symptom or mood check-in'
    }

    const title = titles[viewType] || 'Health Check-in'
    const body = bodies[viewType] || 'Time for your health check-in'

    return this.showNotification(title, {
      body,
      data: {
        type: 'reminder',
        viewType,
        timestamp: new Date().toISOString()
      },
      actions: [
        {
          action: 'track',
          title: 'Track Now'
        },
        {
          action: 'dismiss',
          title: 'Later'
        }
      ]
    })
  }

  /**
   * Show sync notification
   */
  async showSyncNotification(status, message) {
    const titles = {
      success: 'Sync Complete ✅',
      error: 'Sync Failed ❌',
      pending: 'Syncing... ⏳'
    }

    const title = titles[status] || 'Sync Update'
    
    return this.showNotification(title, {
      body: message,
      data: {
        type: 'sync',
        status,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Schedule a reminder notification
   */
  async scheduleReminder(viewType, time) {
    if (!this.isEnabled()) {
      return false
    }

    // For now, we'll use setTimeout for local reminders
    // In a real PWA, you'd use the Background Sync API
    const now = new Date()
    const reminderTime = new Date(time)
    const delay = reminderTime.getTime() - now.getTime()

    if (delay > 0) {
      setTimeout(() => {
        this.showReminderNotification(viewType)
      }, delay)
      return true
    }

    return false
  }

  /**
   * Handle notification click
   */
  handleNotificationClick(notification) {
    const data = notification.data

    if (!data) {
      return
    }

    switch (data.type) {
      case 'insight':
        // Navigate to insights page
        window.location.href = '/#insights'
        break
      case 'reminder':
        // Navigate to tracking form
        window.location.href = `/?view=${data.viewType}`
        break
      case 'sync':
        // Refresh the page to show sync status
        window.location.reload()
        break
    }

    notification.close()
  }

  /**
   * Initialize notification service
   */
  async initialize() {
    if (!this.isSupported) {
      console.warn('Notifications not supported')
      return false
    }

    // Request permission on first use
    const granted = await this.requestPermission()
    
    if (granted) {
      // Set up notification click handler
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
            this.handleNotificationClick(event.data.notification)
          }
        })
      }
    }

    return granted
  }

  /**
   * Get notification settings
   */
  getSettings() {
    return {
      isSupported: this.isSupported,
      permission: this.permission,
      isEnabled: this.isEnabled()
    }
  }
}

// Create singleton instance
export const notificationService = new NotificationService() 