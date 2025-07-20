import React from 'react'
import { Link } from 'react-router-dom'

const Insights = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <Link to="/" className="text-primary-600 hover:text-primary-700 mr-4">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
        </div>

        <div className="card p-8">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Insights Coming Soon
            </h2>
            <p className="text-gray-600">
              Data analysis and pattern recognition will be available here soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Insights 