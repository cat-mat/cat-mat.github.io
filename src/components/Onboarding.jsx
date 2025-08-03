import React, { useState } from 'react'
import { useAppStore } from '../stores/appStore.js'
import { TRACKING_ITEMS, getDisplayValue, getItemColor } from '../constants/trackingItems.js'

const Onboarding = () => {
  const { updateConfig, addNotification } = useAppStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [displayType, setDisplayType] = useState('face')
  const [selectedItems, setSelectedItems] = useState({
    morning: ['energy_level', 'sleep_feeling', 'brain_fog', 'mood'],
    evening: ['energy_level', 'overall_sentiment', 'stress_level', 'anxiety'],
    quick: ['energy_level', 'headache', 'hot_flashes', 'mood']
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
    {
      id: 'demo',
      title: 'Sample Data Demo',
      description: 'See how your data will look with different display options.',
      component: 'demo'
    },
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
      await updateConfig({
        onboarding: {
          completed: true,
          completed_at: new Date().toISOString(),
          tour_completed: true,
          skipped_steps: steps.map(s => s.id)
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

  const handleComplete = async () => {
    try {
      // Create default configuration with selected items
      const defaultConfig = {
        onboarding: {
          completed: true,
          completed_at: new Date().toISOString(),
          tour_completed: true,
          skipped_steps: []
        },
        display_options: {
          item_display_type: displayType,
          view_times: {
            morning_end: '10:00',
            evening_start: '19:00'
          }
        },
        view_configurations: {
          morning_report: {
            sections: {
              body: {
                items: selectedItems.morning.filter(id => TRACKING_ITEMS[id]?.category === 'body'),
                sort_order: selectedItems.morning.filter(id => TRACKING_ITEMS[id]?.category === 'body'),
                visible: true,
                collapsed: false
              },
              mind: {
                items: selectedItems.morning.filter(id => TRACKING_ITEMS[id]?.category === 'mind'),
                sort_order: selectedItems.morning.filter(id => TRACKING_ITEMS[id]?.category === 'mind'),
                visible: true,
                collapsed: false
              }
            }
          },
          evening_report: {
            sections: {
              body: {
                items: selectedItems.evening.filter(id => TRACKING_ITEMS[id]?.category === 'body'),
                sort_order: selectedItems.evening.filter(id => TRACKING_ITEMS[id]?.category === 'body'),
                visible: true,
                collapsed: false
              },
              mind: {
                items: selectedItems.evening.filter(id => TRACKING_ITEMS[id]?.category === 'mind'),
                sort_order: selectedItems.evening.filter(id => TRACKING_ITEMS[id]?.category === 'mind'),
                visible: true,
                collapsed: false
              }
            }
          },
          quick_track: {
            sections: {
              body: {
                items: selectedItems.quick.filter(id => TRACKING_ITEMS[id]?.category === 'body'),
                sort_order: selectedItems.quick.filter(id => TRACKING_ITEMS[id]?.category === 'body'),
                visible: true,
                collapsed: false
              },
              mind: {
                items: selectedItems.quick.filter(id => TRACKING_ITEMS[id]?.category === 'mind'),
                sort_order: selectedItems.quick.filter(id => TRACKING_ITEMS[id]?.category === 'mind'),
                visible: true,
                collapsed: false
              }
            }
          }
        }
      }

      await updateConfig(defaultConfig)
      
      addNotification({
        type: 'success',
        title: 'Welcome!',
        message: 'Your personalized tracking app is ready to use.'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Setup failed',
        message: 'There was an error completing setup. Please try again.'
      })
    }
  }

  const renderWelcome = () => (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-4">🌸</div>
      <h2 className="text-2xl font-bold text-gray-900">
        Welcome to What Even With My Hot Self?!
      </h2>
      <p className="text-lg text-gray-600 max-w-md mx-auto">
        Track your perimenopause journey with personalized insights and support. 
        This app helps you understand your body's changes and find patterns that matter to you.
      </p>
      <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">What you'll be able to do:</h3>
        <ul className="text-sm text-gray-700 space-y-1 text-left">
          <li>• Track daily symptoms and mood changes</li>
          <li>• See patterns and trends over time</li>
          <li>• Get personalized insights about your health</li>
          <li>• Keep your data private and secure</li>
        </ul>
      </div>
    </div>
  )

  const renderTour = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-yellow-100 to-orange-100 p-4 rounded-lg">
          <div className="text-3xl mb-2">🌅</div>
          <h3 className="font-semibold text-gray-800">Morning Report</h3>
          <p className="text-sm text-gray-600">
            Start your day by tracking sleep quality, energy levels, and how you're feeling.
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-4 rounded-lg">
          <div className="text-3xl mb-2">⚡</div>
          <h3 className="font-semibold text-gray-800">Quick Track</h3>
          <p className="text-sm text-gray-600">
            Check in throughout the day for symptoms, mood changes, or anything you notice.
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-4 rounded-lg">
          <div className="text-3xl mb-2">🌙</div>
          <h3 className="font-semibold text-gray-800">Evening Report</h3>
          <p className="text-sm text-gray-600">
            Reflect on your day, track overall sentiment, and write daily notes.
          </p>
        </div>
      </div>
    </div>
  )

  const renderDemo = () => (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600 mb-2">Sample entry with different display styles:</p>
        <div className="flex justify-center space-x-2 mb-4">
          {['text', 'face', 'heart', 'dot'].map(type => (
            <button
              key={type}
              onClick={() => setDisplayType(type)}
              className={`px-3 py-1 rounded text-sm ${
                displayType === type 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h4 className="font-medium text-gray-800 mb-3">Energy Level</h4>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map(value => {
            const item = TRACKING_ITEMS.energy_level
            const displayValue = getDisplayValue(item, value, displayType)
            const colorClass = getItemColor(item, value)
            
            return (
              <button
                key={value}
                className={`p-2 rounded text-center ${colorClass} ${
                  value === 3 ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <div className="text-sm font-medium">{displayValue}</div>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Selected: Moderate (3/5)
        </p>
      </div>
    </div>
  )

  const renderDisplay = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {[
          { id: 'text', name: 'Text', icon: '📝', description: 'Simple text labels' },
          { id: 'face', name: 'Faces', icon: '😊', description: 'Emoji expressions' },
          { id: 'heart', name: 'Hearts', icon: '💚', description: 'Heart indicators' },
          { id: 'dot', name: 'Dots', icon: '🟢', description: 'Color dots' }
        ].map(option => (
          <button
            key={option.id}
            onClick={() => setDisplayType(option.id)}
            className={`p-4 rounded-lg border-2 transition-colors ${
              displayType === option.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-2">{option.icon}</div>
            <div className="font-medium text-gray-800">{option.name}</div>
            <div className="text-sm text-gray-600">{option.description}</div>
          </button>
        ))}
      </div>
    </div>
  )

  const renderItems = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        {['morning', 'evening', 'quick'].map(viewType => (
          <div key={viewType} className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3 capitalize">
              {viewType} Report Items
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(TRACKING_ITEMS)
                .filter(item => item[viewType] || viewType === 'quick')
                .map(item => {
                  const isSelected = selectedItems[viewType].includes(item.id)
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center p-2 rounded border cursor-pointer ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(prev => ({
                              ...prev,
                              [viewType]: [...prev[viewType], item.id]
                            }))
                          } else {
                            setSelectedItems(prev => ({
                              ...prev,
                              [viewType]: prev[viewType].filter(id => id !== item.id)
                            }))
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{item.name}</span>
                    </label>
                  )
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderComplete = () => (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-gray-900">
        You're All Set!
      </h2>
      <p className="text-lg text-gray-600">
        Your personalized tracking app is ready to use. You can always change settings later.
      </p>
      <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">What's next:</h3>
        <ul className="text-sm text-gray-700 space-y-1 text-left">
          <li>• Start with your first morning check-in</li>
          <li>• Explore the different views and features</li>
          <li>• Check out the insights and trends</li>
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
      default: return renderWelcome()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip setup
            </button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="card p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h1>
            <p className="text-gray-600">
              {steps[currentStep].description}
            </p>
          </div>

          {renderStep()}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Back
            </button>
            
            <div className="flex space-x-2">
              {currentStep === steps.length - 1 ? (
                <button
                  onClick={handleComplete}
                  className="btn-primary px-6 py-2"
                >
                  Start Tracking
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="btn-primary px-6 py-2"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Onboarding 