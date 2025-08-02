import React, { useEffect, useState, createContext, useContext } from 'react'
import { useAppStore } from '../stores/appStore.js'

export const BannerContext = createContext({ bannerHeight: 0, bannerVisible: false })

const BANNER_HEIGHT = 44 // px

const ServiceWorkerManager = () => {
  const [swRegistration, setSwRegistration] = useState(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const { addNotification, setOnlineStatus } = useAppStore()
  const [bannerVisible, setBannerVisible] = useState(false)

  useEffect(() => {
    registerServiceWorker()
    setupNetworkListeners()
  }, [])

  const registerServiceWorker = async () => {
    // Skip service worker registration in certain environments
    if (import.meta.env.DEV && import.meta.env.VITE_MOCK_GOOGLE_DRIVE === 'true') {
      console.log('[SW] Skipping service worker registration in mock mode')
      return
    }
    
    if ('serviceWorker' in navigator) {
      try {
        // Try multiple paths for service worker registration
        const basePath = window.location.pathname.replace(/\/$/, '')
        const possiblePaths = [
          '/sw.js',
          `${basePath}/sw.js`,
          '/cat-mat.github.io-1/sw.js'
        ]
        
        const registration = await tryRegisterServiceWorker(possiblePaths)

        setSwRegistration(registration)
        console.log('Service Worker registered successfully:', registration)

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          console.log('Service Worker update found')

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true)
              addNotification({
                type: 'info',
                title: 'App Update Available',
                message: 'A new version is ready. Click to update.',
                action: {
                  label: 'Update Now',
                  onClick: () => updateApp()
                }
              })
            }
          })
        })

        // Handle service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'SYNC_DATA') {
            console.log('Background sync triggered:', event.data)
            // Trigger data sync in the app
            handleBackgroundSync()
          }
          if (event.data.version) {
            console.log('[SW] Active version:', event.data.version)
          }
        })

        // Check if there's already an update waiting
        if (registration.waiting) {
          setUpdateAvailable(true)
        } else {
          setUpdateAvailable(false)
        }

      } catch (error) {
        console.warn('Service Worker registration failed:', error.message)
        
        // Only show notification for actual errors, not 404s or network issues
        if (!error.message.includes('404') && 
            !error.message.includes('Failed to fetch') && 
            !error.message.includes('NetworkError')) {
          addNotification({
            type: 'warning',
            title: 'Offline Features Limited',
            message: 'Some offline features may not be available.'
          })
        }
      }
    } else {
      console.log('Service Worker not supported')
    }
  }

  // Helper function to determine the correct service worker path
  const getServiceWorkerPath = () => {
    // Check if we're in development
    if (import.meta.env.DEV) {
      return '/sw.js'
    }
    
    // For production, try different paths based on deployment
    const basePath = window.location.pathname.replace(/\/$/, '')
    
    // Return the most likely path based on current location
    if (window.location.hostname === 'cat-mat.github.io') {
      return '/cat-mat.github.io-1/sw.js'
    }
    
    // For other deployments, try the base path
    if (basePath && basePath !== '/') {
      return `${basePath}/sw.js`
    }
    
    return '/sw.js'
  }

  // Try to register service worker with fallback paths
  const tryRegisterServiceWorker = async (paths) => {
    for (const path of paths) {
      try {
        console.log(`[SW] Trying to register service worker at: ${path}`)
        const registration = await navigator.serviceWorker.register(path, {
          scope: '/'
        })
        console.log(`[SW] Successfully registered at: ${path}`)
        return registration
      } catch (error) {
        console.warn(`[SW] Failed to register at ${path}:`, error.message)
        // Continue to next path
      }
    }
    throw new Error('Service worker registration failed for all attempted paths')
  }

  const setupNetworkListeners = () => {
    const handleOnline = () => {
      setIsOffline(false)
      setOnlineStatus(true)
      addNotification({
        type: 'success',
        title: 'Back Online',
        message: 'Connection restored. Syncing your data...'
      })
      
      // Trigger sync when back online
      if (swRegistration && swRegistration.sync) {
        swRegistration.sync.register('sync-tracking-data')
      }
    }

    const handleOffline = () => {
      setIsOffline(true)
      setOnlineStatus(false)
      addNotification({
        type: 'warning',
        title: 'You\'re Offline',
        message: 'Your data will sync when you reconnect.'
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  const updateApp = () => {
    console.log('[ServiceWorker] Update requested')
    
    if (swRegistration && swRegistration.waiting) {
      // Send message to waiting service worker to skip waiting
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
      
      // Listen for the controller change
      const handleControllerChange = () => {
        window.location.reload()
      }
      
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
      
      // Cleanup listener after reload
      setTimeout(() => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      }, 1000)
    }
  }

  const handleBackgroundSync = () => {
    // Trigger data sync in the app store
    const { syncOfflineEntries } = useAppStore.getState()
    if (syncOfflineEntries) {
      syncOfflineEntries()
    }
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this browser')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      console.warn('Notification permission denied')
      addNotification({
        type: 'warning',
        title: 'Notifications Disabled',
        message: 'Please enable notifications in your browser settings.'
      })
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        addNotification({
          type: 'success',
          title: 'Notifications Enabled',
          message: 'You\'ll now receive helpful reminders and insights.'
        })
        return true
      } else {
        console.warn('Notification permission denied')
        return false
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  const showNotification = async (title, options = {}) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.warn('Notifications not enabled')
      return false
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: 'tracking-app',
        requireInteraction: false,
        ...options
      })

      // Handle notification click
      notification.onclick = () => {
        window.focus()
        notification.close()
      }

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

  // Banner context value
  const bannerContextValue = {
    bannerHeight: bannerVisible ? BANNER_HEIGHT : 0,
    bannerVisible
  }

  return (
    <BannerContext.Provider value={bannerContextValue}>
      {/* Banner for offline/update messages */}
      {bannerVisible && (
        <div 
          className="fixed top-0 left-0 right-0 bg-yellow-100 border-b border-yellow-300 px-4 py-2 text-sm text-yellow-800 z-50"
          style={{ height: BANNER_HEIGHT }}
        >
          <div className="flex items-center justify-between">
            <span>⚠️ You're offline. Changes will sync when you reconnect.</span>
            <button 
              onClick={() => setBannerVisible(false)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </BannerContext.Provider>
  )
}

export default ServiceWorkerManager 