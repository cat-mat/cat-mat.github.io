import React from 'react'
import { useAppStore } from '../stores/app-store.js'
import { i18n } from '../utils/i18n.js'

const OfflineIndicator = () => {
  const { sync } = useAppStore()
  const { isOnline, isSyncing, syncErrors } = sync

  if (isOnline && !isSyncing && syncErrors.length === 0) {
    return null
  }

  return (
    <div className="offline-indicator">
      {!isOnline && (
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{i18n.t('offline.indicator.text')}</span>
        </div>
      )}
      
      {isSyncing && (
        <div className="flex items-center">
          <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
          <span>{i18n.t('sync.syncing')}</span>
        </div>
      )}
      
      {syncErrors.length > 0 && (
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{i18n.t('sync.errors')}</span>
        </div>
      )}
    </div>
  )
}

export default OfflineIndicator 