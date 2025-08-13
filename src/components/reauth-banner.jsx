import React from 'react'
import { useAppStore } from '../stores/app-store.js'
import { i18n } from '../utils/i18n.js'

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
          <h3 className="text-base font-semibold mb-1">{banner.title || i18n.t('reauth.title')}</h3>
          <p className="text-sm opacity-90">
            {banner.message || i18n.t('reauth.message')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reauthenticate}
            className="btn-primary px-3 py-2 text-sm"
          >
            {i18n.t('reauth.cta')}
          </button>
          <button
            onClick={dismissReauthBanner}
            className="btn-secondary px-3 py-2 text-sm"
            title={i18n.t('reauth.dismiss.title')}
          >
            {i18n.t('reauth.dismiss.label')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReauthBanner


