import React from 'react'
import { logSecurityEvent } from '../utils/security.js'
import { i18n } from '../utils/i18n.js'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('Error caught by boundary:', error, errorInfo)
    
    // Log security event for suspicious errors
    if (error.message && (
      error.message.includes('script') ||
      error.message.includes('eval') ||
      error.message.includes('injection')
    )) {
      logSecurityEvent('suspicious_error', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    }
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 wildflower-bg">
          <div className="max-w-md w-full">
            <div className="meadow-card p-8 text-center">
              <div className="text-6xl mb-4">😵‍💫</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">{i18n.t('error.title')}</h1>
              <p className="text-gray-600 mb-6">
                {i18n.t('error.subtitle')}
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary w-full"
                >
                  🔄 {i18n.t('error.reload')}
                </button>
                
                <button
                  onClick={() => {
                    localStorage.clear()
                    window.location.reload()
                  }}
                  className="btn-secondary w-full"
                >
                  🗑️ {i18n.t('error.clearAndReload')}
                </button>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">{i18n.t('error.debug')}</summary>
                  <div className="mt-2 p-4 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto max-h-40">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.toString()}
                    </div>
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
              
              <div className="mt-6 text-xs text-gray-500">
                <p>{i18n.t('error.nextSteps.title')}</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>{i18n.t('error.nextSteps.checkConnection')}</li>
                  <li>{i18n.t('error.nextSteps.refresh')}</li>
                  <li>{i18n.t('error.nextSteps.clearCache')}</li>
                  <li>{i18n.t('error.nextSteps.contact')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary 