import React from 'react'
import { Link } from 'react-router-dom'
import LoadingSpinner from './LoadingSpinner.jsx'

const AuthScreen = ({ onSignIn, isLoading, error, onReset }) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 wildflower-bg">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bloom">🐦‍🔥 ❤️‍🔥</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 wildflower-text-shadow">
            What Even With My Hot Self?!
          </h1>
          <p className="text-sm text-gray-600">
            Tracking the perimenopausal journey (and beyond) with humor
          </p>
        </div>

        {/* Main card */}
        <div className="meadow-card p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Connect to Google Drive
            </h2>
            <p className="text-gray-600">
              Your data is stored securely in your personal Google Drive
            </p>
          </div>

          {/* Privacy info */}
          <div className="bg-gradient-to-r from-info-50 to-info-100 border border-info-200 rounded-xl p-4 mb-6">
            <h3 className="font-medium text-info-900 mb-2">🔒 Your Privacy Matters</h3>
            <ul className="text-sm text-info-800 space-y-1">
              <li>• Your data stays in your Google Drive</li>
              <li>• We can't access your personal files</li>
              <li>• No data is shared with third parties</li>
              <li>• You can disconnect anytime</li>
            </ul>
          </div>

          {/* Sign in button */}
          <button
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full sunset-button py-3 text-base font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner size="small" className="mr-2" />
                Connecting...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Connect with Google Drive
              </div>
            )}
          </button>
          
          {isLoading && (
            <p className="text-sm text-gray-600 mt-2 text-center">
              This may take a few minutes. Please complete the Google sign-in process in the popup window.
            </p>
          )}

          {/* Reset buttons when stuck */}
          {isLoading && (
            <div className="mt-3 space-y-2">
              <button
                onClick={() => {
                  console.log('Soft reset clicked')
                  onReset && onReset()
                }}
                className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors border border-yellow-300"
              >
                🔄 Soft Reset
              </button>
              <button
                onClick={() => {
                  console.log('Hard reset clicked - clearing cache and forcing refresh')
                  // Clear all caches and force refresh
                  if ('caches' in window) {
                    caches.keys().then(names => {
                      names.forEach(name => caches.delete(name))
                    })
                  }
                  localStorage.clear()
                  sessionStorage.clear()
                  window.location.href = window.location.href + '?t=' + Date.now()
                }}
                className="w-full bg-red-100 hover:bg-red-200 text-red-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors border border-red-300"
              >
                🔄 Force Refresh (Clear Cache)
              </button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-sm text-danger-800">{error}</p>
            </div>
          )}

          {/* Additional info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              By connecting, you agree to our{' '}
              <Link to="/privacy" className="cornflower-link">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>

        {/* Features preview */}
        <div className="mt-8 grid grid-cols-1 gap-4">
          {/* <div className="meadow-card p-4 hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <div className="text-2xl mr-3 animate-bloom">📱</div>
              <div>
                <h3 className="font-medium text-gray-800">Mobile-First Design</h3>
                <p className="text-sm text-gray-600">Works great on your phone</p>
              </div>
            </div>
          </div> */}

          <div className="meadow-card p-4 hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <div className="text-2xl mr-3 animate-bloom">⚡</div>
              <div>
                <h3 className="font-medium text-gray-800">Quick Tracking</h3>
                <p className="text-sm text-gray-600">Fast entry throughout the day</p>
              </div>
            </div>
          </div>

          <div className="meadow-card p-4 hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <div className="text-2xl mr-3 animate-bloom">📊</div>
              <div>
                <h3 className="font-medium text-gray-800">Smart Insights</h3>
                <p className="text-sm text-gray-600">Discover patterns in your data</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthScreen 