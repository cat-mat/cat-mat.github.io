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
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })

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
        console.error('Service Worker registration failed:', error)
        addNotification({
          type: 'error',
          title: 'PWA Setup Failed',
          message: 'Unable to enable offline functionality.'
        })
      }
    } else {
      console.log('Service Worker not supported')
    }
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
    console.log('[ServiceWorker] Registration:', swRegistration)
    console.log('[ServiceWorker] Waiting worker:', swRegistration?.waiting)
    
    if (swRegistration && swRegistration.waiting) {
      console.log('[ServiceWorker] Sending SKIP_WAITING message')
      // Send message to service worker to skip waiting
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
      
      // Reload the page when the new service worker takes over
      const handleControllerChange = () => {
        console.log('[ServiceWorker] Controller changed, reloading page')
        window.location.reload()
      }
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange, { once: true })
    } else {
      console.log('[ServiceWorker] No waiting worker, forcing reload')
      // Fallback: force reload if no waiting service worker
      window.location.reload()
    }
  }

  const handleBackgroundSync = () => {
    // This will be handled by the app store's sync functionality
    console.log('Background sync requested')
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        addNotification({
          type: 'success',
          title: 'Notifications Enabled',
          message: 'You\'ll receive gentle reminders to check in with yourself.'
        })
      }
    }
  }

  // Request notification permission on first visit
  useEffect(() => {
    if (localStorage.getItem('notification-permission-requested') !== 'true') {
      setTimeout(() => {
        requestNotificationPermission()
        localStorage.setItem('notification-permission-requested', 'true')
      }, 5000) // Wait 5 seconds before asking
    }
    // Listen for manual show event
    const handleShowNotification = () => {
      requestNotificationPermission()
      localStorage.setItem('notification-permission-requested', 'true')
    }
    window.addEventListener('show-notification-permission', handleShowNotification)
    return () => {
      window.removeEventListener('show-notification-permission', handleShowNotification)
    }
  }, [])

  // Provide banner context to children
  return (
    <BannerContext.Provider value={{ bannerHeight: bannerVisible ? BANNER_HEIGHT : 0, bannerVisible }}>
      {(isOffline || updateAvailable) && (
        <div
          className={
            'w-full relative z-50 text-white px-4 py-2 text-center text-sm flex items-center justify-center transition-all duration-300 ' +
            (isOffline ? 'bg-yellow-500' : 'bg-blue-500')
          }
          style={{ minHeight: BANNER_HEIGHT }}
        >
          {isOffline && (
            <>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              You're offline - Data will sync when connected
            </>
          )}
          {updateAvailable && !isOffline && (
            <>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Update available - 
              <button 
                onClick={() => updateApp()}
                className="ml-2 underline hover:no-underline"
              >
                Click to update
              </button>
            </>
          )}
        </div>
      )}
    </BannerContext.Provider>
  )
}

export const useBannerContext = () => useContext(BannerContext)

export default ServiceWorkerManager 