import React from 'react'
import { useAppStore } from '../stores/app-store.js'

const ReauthBanner = () => {
  const { ui, reauthenticate, dismissReauthBanner } = useAppStore()
  const banner = ui?.reauthBanner

  if (!banner?.visible) return null

  const severityClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    success: 'bg-green-50 border-green-200 text-green-900'
  }

  return (
    <div className={`meadow-card mb-4 border ${severityClasses[banner.severity || 'warning']}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-4">
          <h3 className="text-base font-semibold mb-1">{banner.title || 'Please sign in again'}</h3>
          <p className="text-sm opacity-90">
            {banner.message || 'To keep your Google Drive connection active, sign in again. Your data is safe and offline entries will sync after re-auth.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reauthenticate}
            className="btn-primary px-3 py-2 text-sm"
          >
            Sign in again
          </button>
          <button
            onClick={dismissReauthBanner}
            className="btn-secondary px-3 py-2 text-sm"
            title="Hide this message for now"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReauthBanner


