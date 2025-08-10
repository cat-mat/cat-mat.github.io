import React, { useState, useEffect } from 'react'
import { useAppStore } from '../stores/app-store.js'

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const { addNotification } = useAppStore()

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      setIsInstalled(true)
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      addNotification({
        type: 'success',
        title: 'App Installed!',
        message: 'Your tracker is now installed and ready to use.'
      })
    }

    // Listen for manual show event
    const handleShowPrompt = () => {
      if (deferredPrompt) setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('show-pwa-install-prompt', handleShowPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('show-pwa-install-prompt', handleShowPrompt)
    }
  }, [addNotification, deferredPrompt])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDeferredPrompt(null)
    // Remember that user dismissed the prompt
    localStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  // Don't show if already installed or user dismissed
  if (isInstalled || !showPrompt || localStorage.getItem('pwa-prompt-dismissed') === 'true') {
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[60] md:bottom-4">
      <div className="meadow-card p-4 shadow-lg border-2 border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📱</div>
            <div>
              <h3 className="font-semibold text-gray-900">Install Hot Self Tracker</h3>
              <p className="text-sm text-gray-600">Add to home screen for quick access</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-700 text-sm px-3 py-1"
            >
              Later
            </button>
            <button
              onClick={handleInstall}
              className="btn-primary text-sm px-4 py-2"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PWAInstallPrompt 