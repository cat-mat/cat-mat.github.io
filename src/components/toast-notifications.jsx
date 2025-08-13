import React from 'react'
import { useAppStore } from '../stores/app-store.js'
import { clsx } from 'clsx'

const ToastNotifications = () => {
  const { ui, removeNotification } = useAppStore()
  const { notifications = [] } = ui

  if (!notifications || notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-40 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={clsx(
            'toast',
            notification.type && `toast.${notification.type}`,
            'animate-slide-up'
          )}
        >
          <div className="flex items-start">
            <div className="flex-1">
              {notification.title && (
                <h4 className="font-medium mb-1">{notification.title}</h4>
              )}
              <p className="text-sm opacity-90">{notification.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-3 text-white opacity-70 hover:opacity-100 transition-opacity"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ToastNotifications 