import React, { useEffect, useRef } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './stores/appStore.js'
import { format } from 'date-fns'
import { DEFAULT_VIEW_TIMES } from './constants/trackingItems.js'

// Components
import AuthScreen from './components/AuthScreen.jsx'
import Onboarding from './components/Onboarding.jsx'
import Dashboard from './components/Dashboard.jsx'
import Settings from './components/Settings.jsx'
import Insights from './components/Insights.jsx'
import Logs from './components/Logs.jsx'
import LoadingSpinner from './components/LoadingSpinner.jsx'
import OfflineIndicator from './components/OfflineIndicator.jsx'
import ToastNotifications from './components/ToastNotifications.jsx'
import ServiceWorkerManager from './components/ServiceWorkerManager.jsx'
import PWAInstallPrompt from './components/PWAInstallPrompt.jsx'
import PrivacyPolicy from './components/PrivacyPolicy.jsx'

// Initialize Google API
const initializeGoogleAPI = () => {
  return new Promise((resolve) => {
    if (typeof gapi === 'undefined') {
      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.onload = () => {
        gapi.load('client:auth2', resolve)
      }
      document.head.appendChild(script)
    } else {
      gapi.load('client:auth2', resolve)
    }
  })
}

function App() {
  const {
    auth,
    config,
    configLoading,
    ui,
    signIn,
    loadConfig,
    setCurrentView,
    setOnlineStatus,
    addNotification
  } = useAppStore()

  const sessionExpiredNotified = useRef(false)

  // Initialize Google API on mount
  useEffect(() => {
    initializeGoogleAPI()
  }, [])

  // Set up network status listeners
  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true)
    const handleOffline = () => setOnlineStatus(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnlineStatus])

  // Auto-switch view based on time of day (only on initial load)
  useEffect(() => {
    if (!config) return

    const updateView = () => {
      const now = new Date()
      const currentTime = format(now, 'HH:mm')
      const { morning_end, evening_start } = config.display_options.view_times

      let suggestedView = 'quick'
      
      if (currentTime < morning_end) {
        suggestedView = 'morning'
      } else if (currentTime >= evening_start) {
        suggestedView = 'evening'
      }

      // Only auto-switch if the current view doesn't match the suggested view
      // and we haven't manually set a view yet
      if (ui.currentView !== suggestedView) {
        console.log('Auto-switching view from', ui.currentView, 'to', suggestedView, 'based on time:', currentTime)
        setCurrentView(suggestedView)
      }
    }

    // Only update once on initial load, not continuously
    updateView()
  }, [config]) // Removed ui.currentView and setCurrentView from dependencies

  // Show loading spinner while initializing
  if (configLoading) {
    return (
      <div className="min-h-screen wildflower-bg flex items-center justify-center">
        <div className="meadow-card">
          <LoadingSpinner size="large" />
          <p className="text-center mt-4 text-gray-600">Loading your wildflower garden...</p>
        </div>
      </div>
    )
  }

  // Main app layout with conditional routing
  return (
    <div className="min-h-screen wildflower-bg">
      <ServiceWorkerManager />
      <OfflineIndicator />
      <ToastNotifications />
      <PWAInstallPrompt />
      
      <Routes>
        {/* Public routes - accessible without authentication */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        
        {/* Protected routes - require authentication */}
        <Route path="/" element={
          !auth.isAuthenticated ? (
            <div className="min-h-screen wildflower-bg">
              {!sessionExpiredNotified.current && addNotification && (
                (() => {
                  addNotification({
                    type: 'warning',
                    title: 'Session expired',
                    message: 'Please log in again.'
                  })
                  sessionExpiredNotified.current = true
                  return null
                })()
              )}
              <AuthScreen onSignIn={signIn} isLoading={auth.isLoading} error={auth.error} />
            </div>
          ) : config && !config.onboarding.completed ? (
            <div className="min-h-screen wildflower-bg">
              <Onboarding />
            </div>
          ) : (
            <Dashboard />
          )
        } />
        <Route path="/settings" element={
          !auth.isAuthenticated ? (
            <Navigate to="/" replace />
          ) : config && !config.onboarding.completed ? (
            <Navigate to="/" replace />
          ) : (
            <Settings />
          )
        } />
        <Route path="/insights" element={
          !auth.isAuthenticated ? (
            <Navigate to="/" replace />
          ) : config && !config.onboarding.completed ? (
            <Navigate to="/" replace />
          ) : (
            <Insights />
          )
        } />
        <Route path="/logs" element={
          !auth.isAuthenticated ? (
            <Navigate to="/" replace />
          ) : config && !config.onboarding.completed ? (
            <Navigate to="/" replace />
          ) : (
            <Logs />
          )
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App 