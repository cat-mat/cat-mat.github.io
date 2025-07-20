import React from 'react'
import { useAppStore } from '../stores/appStore.js'

const Onboarding = () => {
  const { updateConfig, addNotification } = useAppStore()

  const completeOnboarding = async () => {
    try {
      await updateConfig({
        onboarding: {
          completed: true,
          completed_at: new Date().toISOString(),
          tour_completed: true
        }
      })
      
      addNotification({
        type: 'success',
        title: 'Welcome!',
        message: 'You\'re all set up and ready to start tracking.'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Setup failed',
        message: 'There was an error completing setup. Please try again.'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Your Journey!
          </h1>
          <p className="text-lg text-gray-600">
            Let's get you set up to track your perimenopause journey
          </p>
        </div>

        <div className="card p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Quick Setup
            </h2>
            <p className="text-gray-600 mb-6">
              We'll use default settings to get you started quickly. You can customize everything later in Settings.
            </p>
            
            <button
              onClick={completeOnboarding}
              className="btn-primary w-full py-3"
            >
              Start Tracking Now
            </button>
            
            <p className="text-sm text-gray-500 mt-4">
              You can always change settings later
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Onboarding 