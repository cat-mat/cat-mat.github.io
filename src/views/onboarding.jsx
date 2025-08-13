import React, { useState } from 'react'
import { useAppStore } from '../stores/app-store.js'
import { TRACKING_ITEMS, getValueLabels } from '../constants/tracking-items.js'

const Onboarding = () => {
  const { updateConfig, updateConfigLocal, completeOnboardingLocal, saveConfig, addNotification, config } = useAppStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [displayType, setDisplayType] = useState('face')
  const getDefaultSelectedByView = (view) => {
    return Object.values(TRACKING_ITEMS)
      .filter(item => !!item[view])
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(item => item.id)
  }
  const [selectedItems, setSelectedItems] = useState({
    morning: getDefaultSelectedByView('morning'),
    evening: getDefaultSelectedByView('evening'),
    quick: getDefaultSelectedByView('quick')
  })

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Your Journey! 🌸',
      description: 'Track your perimenopause journey with personalized insights and support.',
      component: 'welcome'
    },
    {
      id: 'tour',
      title: 'App Tour',
      description: 'Let\'s explore the three main views of your tracking app.',
      component: 'tour'
    },
    // Optional demo removed to simplify and avoid heavy UI during onboarding
    {
      id: 'display',
      title: 'Choose Your Display Style',
      description: 'How would you like to see your tracking items?',
      component: 'display'
    },
    {
      id: 'items',
      title: 'Customize Your Tracking',
      description: 'Select which items to track in each view.',
      component: 'items'
    },
    {
      id: 'complete',
      title: 'You\'re All Set! 🎉',
      description: 'Your personalized tracking app is ready to use.',
      component: 'complete'
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = async () => {
    try {
      // Update locally first so onboarding can complete without Drive access
      completeOnboardingLocal(displayType)
      // Best-effort cloud save
      try { await saveConfig() } catch {}
      addNotification({
        type: 'success',
        title: 'Welcome!',
        message: 'You\'re all set up and ready to start tracking.'
      })
    } catch {
      addNotification({ type: 'error', title: 'Setup failed', message: 'There was an error completing setup. Please try again.' })
    }
  }

  const handleComplete = async () => {
    try {
      // Update locally first so setup completes even if Drive auth is required
      completeOnboardingLocal(displayType)
      // Best-effort cloud save; ignore failures (user may need to re-auth in preview)
      try { await saveConfig() } catch {}
      addNotification({ type: 'success', title: 'Setup Complete!', message: 'Your personalized tracking app is ready to use.' })
    } catch {
      addNotification({ type: 'error', title: 'Setup failed', message: 'There was an error completing setup. Please try again.' })
    }
  }

  const renderWelcome = () => (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-4">🌸</div>
      <h2 className="text-3xl font-bold text-gray-800">Welcome to Your Journey!</h2>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        Track your perimenopause journey with personalized insights and support. 
        This app is designed to help you understand your body, mind, and emotional changes.
      </p>
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-xl">
        <h3 className="text-xl font-semibold text-gray-800 mb-3">What You'll Be Able To Do:</h3>
        <ul className="text-left space-y-2 text-gray-700">
          <li>• Track daily symptoms and changes</li>
          <li>• Monitor patterns over time</li>
          <li>• Get insights about your journey</li>
          <li>• Keep your data private and secure</li>
        </ul>
      </div>
    </div>
  )

  const renderTour = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">App Tour</h2>
        <p className="text-gray-600">Let's explore the three main views of your tracking app.</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl">
          <div className="text-4xl mb-3">🌻</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Morning Report</h3>
          <p className="text-sm text-gray-600">Start your day by tracking sleep quality, energy levels, and how you're feeling.</p>
        </div>
        
        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
          <div className="text-4xl mb-3">⚡</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Quick Track</h3>
          <p className="text-sm text-gray-600">Add timestamped entries throughout the day for symptoms or changes you notice.</p>
        </div>
        
        <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
          <div className="text-4xl mb-3">🌙</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Evening Report</h3>
          <p className="text-sm text-gray-600">End your day with reflection, sentiment tracking, and notes about your day.</p>
        </div>
      </div>
    </div>
  )

  const renderDemo = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Sample Data Demo</h2>
        <p className="text-gray-600">See how your data will look with different display options.</p>
      </div>
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Energy Level</h3>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => {
            const { displayText } = getValueLabels(TRACKING_ITEMS.energy_level, value, displayType)
            return (
              <div key={value} className="px-4 py-2 rounded-lg border-2 border-gray-300 bg-white text-gray-700">
                <span className="text-lg">{displayText}</span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex justify-center space-x-4">
        {['text', 'face', 'heart', 'dot'].map((type) => (
          <button
            key={type}
            onClick={() => setDisplayType(type)}
            className={`px-4 py-2 rounded-lg border-2 transition-colors ${
              displayType === type
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300'
            }`}
          >
            {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>
    </div>
  )

  const renderDisplay = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Choose Your Display Style</h2>
        <p className="text-gray-600">How would you like to see your tracking items?</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {['text', 'face', 'heart', 'dot'].map((type) => (
          <button
            key={type}
            onClick={() => setDisplayType(type)}
            className={`p-6 rounded-xl border-2 transition-all ${
              displayType === type
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 bg-white hover:border-primary-300'
            }`}
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h3>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((value) => {
                  const { displayText } = getValueLabels(TRACKING_ITEMS.energy_level, value, type)
                  return (
                    <div key={value} className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700">
                      <span className="text-lg">{displayText}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  const renderItems = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Customize Your Tracking</h2>
        <p className="text-gray-600">Select which items to track in each view.</p>
      </div>
      
      {['morning', 'evening', 'quick'].map((view) => (
        <div key={view} className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 capitalize">
            {view} View
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(TRACKING_ITEMS)
              .filter(([_, item]) => item[view])
              .sort(([, a], [, b]) => a.name.localeCompare(b.name))
              .map(([id, item]) => (
                <label key={id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedItems[view].includes(id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(prev => ({
                          ...prev,
                          [view]: [...prev[view], id]
                        }))
                      } else {
                        setSelectedItems(prev => ({
                          ...prev,
                          [view]: prev[view].filter(item => item !== id)
                        }))
                      }
                    }}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-gray-700">{item.name}</span>
                </label>
              ))}
          </div>
        </div>
      ))}
    </div>
  )

  const renderComplete = () => (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-3xl font-bold text-gray-800">You're All Set!</h2>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        Your personalized tracking app is ready to use. You can always change your settings later.
      </p>
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl">
        <h3 className="text-xl font-semibold text-gray-800 mb-3">What's Next:</h3>
        <ul className="text-left space-y-2 text-gray-700">
          <li>• Start tracking your daily symptoms and changes</li>
          <li>• Explore the different views (Morning, Quick, Evening)</li>
          <li>• Check your insights and patterns over time</li>
          <li>• Customize your settings anytime</li>
        </ul>
      </div>
    </div>
  )

  const renderStep = () => {
    const step = steps[currentStep]
    switch (step.component) {
      case 'welcome': return renderWelcome()
      case 'tour': return renderTour()
      case 'demo': return renderDemo()
      case 'display': return renderDisplay()
      case 'items': return renderItems()
      case 'complete': return renderComplete()
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-sm text-gray-600">{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-lg border-2 transition-colors ${
              currentStep === 0
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:border-primary-300 hover:text-primary-700'
            }`}
          >
            Back
          </button>
          
          <div className="flex space-x-4">
            <button
              onClick={handleSkip}
              className="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 hover:border-primary-300 hover:text-primary-700 transition-colors"
            >
              Skip Setup
            </button>
            
            {currentStep === steps.length - 1 ? (
              <button
                onClick={handleComplete}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Complete Setup
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Onboarding
