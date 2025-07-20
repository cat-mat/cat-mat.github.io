import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAppStore } from '../stores/appStore.js'
import { format } from 'date-fns'
import TrackingForm from './TrackingForm.jsx'
import LoadingSpinner from './LoadingSpinner.jsx'
import { clsx } from 'clsx'

const Dashboard = () => {
  const { auth, config, ui, trackingData, signOut, setCurrentView, addNotification } = useAppStore()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const { user } = auth
  const { currentView } = ui
  const { entries, isLoading } = trackingData

  // Get today's entries
  const today = format(new Date(), 'yyyy-MM-dd')
  const todaysEntries = entries.filter(entry => {
    // Ensure timestamp is a string before calling startsWith
    const timestamp = typeof entry.timestamp === 'string' 
      ? entry.timestamp 
      : entry.timestamp?.toISOString?.() || String(entry.timestamp || '')
    return timestamp.startsWith(today)
  })

  // Get current view entries
  const currentViewEntries = todaysEntries.filter(entry => entry.type === currentView)

  const handleSignOut = async () => {
    try {
      await signOut()
      addNotification({
        type: 'success',
        title: 'Signed out',
        message: 'You have been successfully signed out.'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Sign out failed',
        message: 'There was an error signing out. Please try again.'
      })
    }
  }

  const getViewTitle = () => {
    switch (currentView) {
      case 'morning':
        return 'Morning Report'
      case 'evening':
        return 'Evening Report'
      case 'quick':
        return 'Quick Track'
      default:
        return 'Tracking'
    }
  }

  const getViewIcon = () => {
    switch (currentView) {
      case 'morning':
        return '🌻'
      case 'evening':
        return '🌙'
      case 'quick':
        return '⚡'
      default:
        return '🌸'
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 shadow-wildflower">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and title */}
            <div className="flex items-center">
              <div className="text-3xl mr-3 animate-bloom">❤️‍🔥🐦‍🔥 </div>
              <h1 className="text-xl font-bold text-white wildflower-text-shadow">
                What Even With My Hot Self?!
              </h1>
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-cream-500 rounded-xl shadow-wildflower py-1 z-50 border border-cream-400">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-cream-300">
                    <div className="font-medium">{user?.name || 'User'}</div>
                    <div className="text-gray-500">{user?.email}</div>
                  </div>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-cream-400 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    🌸 Settings
                  </Link>
                  <Link
                    to="/insights"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-cream-400 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    📊 Insights
                  </Link>
                  <Link
                    to="/logs"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-cream-400 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    📝 Logs
                  </Link>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      handleSignOut()
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-cream-400 transition-colors duration-200"
                  >
                    🚪 Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* Date header */}
        <div className="mb-6 meadow-card">
          <h2 className="text-2xl font-bold text-gray-800 wildflower-text-shadow">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </h2>
          <p className="text-gray-600">
            {currentViewEntries.length > 0 
              ? `${currentViewEntries.length} entry${currentViewEntries.length !== 1 ? 's' : ''} today`
              : 'No entries yet today'
            }
          </p>
        </div>

        {/* View selector */}
        <div className="mb-8">
          <div className="flex space-x-3">
            {['morning', 'quick', 'evening'].map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={clsx(
                  'flex-1 py-4 px-4 rounded-xl border-2 transition-all duration-300 hover:shadow-medium',
                  currentView === view
                    ? 'border-primary-500 bg-gradient-to-br from-primary-100 to-primary-50 text-primary-700 shadow-medium'
                    : 'border-cream-400 bg-cream-500 text-gray-700 hover:border-primary-300 hover:bg-cream-400'
                )}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2 animate-bloom">
                    {view === 'morning' ? '🌻' : view === 'evening' ? '🌙' : '⚡'}
                  </div>
                  <div className="text-sm font-medium capitalize">{view}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Current view content */}
        <div className="mb-8">
          <div className="meadow-card">
            <div className="section-header">
              <div className="flex items-center">
                <span className="text-3xl mr-3 animate-bloom">{getViewIcon()}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {getViewTitle()}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {currentView === 'morning' && 'Start your day by tracking sleep and energy'}
                    {currentView === 'evening' && 'End your day with reflection and sentiment'}
                    {currentView === 'quick' && 'Add timestamped entries throughout the day'}
                  </p>
                </div>
              </div>
            </div>

            <div className="section-content">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="large" />
                </div>
              ) : (
                <TrackingForm key={currentView} viewType={currentView} />
              )}
            </div>
          </div>
        </div>

        {/* Today's summary */}
        {todaysEntries.length > 0 && (
          <div className="meadow-card">
            <div className="section-header">
              <h3 className="text-lg font-semibold text-gray-800">Today's Summary</h3>
            </div>
            <div className="section-content">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['morning', 'quick', 'evening'].map((view) => {
                  const viewEntries = todaysEntries.filter(entry => entry.type === view)
                  return (
                    <div key={view} className="text-center p-4 rounded-xl bg-gradient-to-br from-meadow-50 to-meadow-100 border border-meadow-200 transition-all duration-300">
                      <div className="text-3xl mb-2 animate-bloom">
                        {view === 'morning' ? '🌻' : view === 'evening' ? '🌙' : '⚡'}
                      </div>
                      <div className="text-sm font-medium text-gray-800 capitalize">{view}</div>
                      <div className="text-lg font-semibold text-primary-600">
                        {viewEntries.length}
                      </div>
                      <div className="text-xs text-gray-500">entries</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-cream-500 border-t border-cream-400 md:hidden z-50 shadow-wildflower">
        <div className="flex justify-around">
          <button
            onClick={() => setCurrentView('morning')}
            className={clsx(
              'flex-1 py-3 px-2 text-center transition-all duration-200',
              currentView === 'morning' ? 'text-primary-600' : 'text-gray-600'
            )}
          >
            <div className="text-xl mb-1 animate-bloom">🌻</div>
            <div className="text-xs">Morning</div>
          </button>
          <button
            onClick={() => setCurrentView('quick')}
            className={clsx(
              'flex-1 py-3 px-2 text-center transition-all duration-200',
              currentView === 'quick' ? 'text-primary-600' : 'text-gray-600'
            )}
          >
            <div className="text-xl mb-1 animate-bloom">⚡</div>
            <div className="text-xs">Quick</div>
          </button>
          <button
            onClick={() => setCurrentView('evening')}
            className={clsx(
              'flex-1 py-3 px-2 text-center transition-all duration-200',
              currentView === 'evening' ? 'text-primary-600' : 'text-gray-600'
            )}
          >
            <div className="text-xl mb-1 animate-bloom">🌙</div>
            <div className="text-xs">Evening</div>
          </button>
        </div>
      </nav>
    </div>
  )
}

export default Dashboard 