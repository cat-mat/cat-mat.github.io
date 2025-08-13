import React from 'react'
import { Link } from 'react-router-dom'
import { i18n } from '../utils/i18n.js'

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen wildflower-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="btn-secondary px-4 py-2 text-sm flex items-center mb-4"
          >
            <span className="mr-2">←</span>
            {i18n.t('nav.backToDashboard')}
          </Link>
          
          <h1 className="wildflower-header text-4xl mb-4">🔒 {i18n.t('privacy.title')}</h1>
          <p className="text-gray-600 text-center">{i18n.t('privacy.subtitle')}</p>
        </div>

        {/* Privacy Policy Content */}
        <div className="meadow-card p-8">
          <div className="prose prose-lg max-w-none">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{i18n.t('privacy.section.yourPrivacyMatters')}</h2>
              <p className="text-gray-700 mb-4">
                "What Even With My Hot Self?!" is designed with your privacy as our top priority. 
                We believe you should have complete control over your personal health data.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">🔐 {i18n.t('privacy.section.storageSecurity')}</h3>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Your data stays in your Google Drive:</strong> All tracking data is stored in your personal Google Drive account, not on our servers.</li>
                <li><strong>We can't access your files:</strong> We only have permission to access files in the app's designated folder in your Google Drive.</li>
                <li><strong>No server-side storage:</strong> We don't store, process, or transmit your personal data on our servers.</li>
                <li><strong>End-to-end privacy:</strong> Your data is encrypted in transit and stored securely in your Google Drive.</li>
              </ul>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">📊 {i18n.t('privacy.section.whatWeCollect')}</h3>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Tracking entries:</strong> Your daily tracking data (symptoms, mood, energy levels, etc.)</li>
                <li><strong>App configuration:</strong> Your personal settings and preferences</li>
                <li><strong>Usage analytics:</strong> Basic app usage statistics (optional, can be disabled)</li>
                <li><strong>No personal identifiers:</strong> We don't collect your name, email, or other personal information</li>
              </ul>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">🚫 {i18n.t('privacy.section.whatWeDontDo')}</h3>
              <ul className="space-y-2 text-gray-700">
                <li><strong>No data sharing:</strong> We never sell, rent, or share your data with third parties</li>
                <li><strong>No advertising:</strong> We don't use your data for advertising purposes</li>
                <li><strong>No tracking:</strong> We don't track you across other websites or apps</li>
                <li><strong>No profiling:</strong> We don't create profiles or make decisions based on your data</li>
              </ul>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">🛡️ {i18n.t('privacy.section.rightsControl')}</h3>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Complete control:</strong> You can export, modify, or delete your data at any time</li>
                <li><strong>Disconnect anytime:</strong> You can revoke access to your Google Drive and stop using the app</li>
                <li><strong>Data portability:</strong> Export your data in standard formats (JSON, CSV)</li>
                <li><strong>Right to deletion:</strong> Delete your data completely from Google Drive</li>
              </ul>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">🌐 {i18n.t('privacy.section.thirdParties')}</h3>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Google Drive:</strong> Used for data storage (you control access)</li>
                <li><strong>Google Analytics:</strong> Optional usage statistics (can be disabled)</li>
                <li><strong>No other third parties:</strong> We don't integrate with other services that access your data</li>
              </ul>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">📱 {i18n.t('privacy.section.offline')}</h3>
              <p className="text-gray-700 mb-3">
                The app works completely offline. Your data is stored locally on your device and syncs to Google Drive when you're online.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Local storage:</strong> Data is cached on your device for offline access</li>
                <li><strong>Automatic sync:</strong> Changes sync to Google Drive when connection is restored</li>
                <li><strong>No internet required:</strong> You can track and view your data without internet</li>
              </ul>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">🔧 {i18n.t('privacy.section.technical')}</h3>
              <ul className="space-y-2 text-gray-700">
                <li><strong>HTTPS encryption:</strong> All data transmission is encrypted</li>
                <li><strong>OAuth 2.0:</strong> Secure authentication with Google</li>
                <li><strong>No API keys in code:</strong> Your Google credentials are never exposed</li>
                <li><strong>Regular updates:</strong> We keep the app updated with security patches</li>
              </ul>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">📞 {i18n.t('privacy.section.contact')}</h3>
              <p className="text-gray-700 mb-3">
                If you have questions about your privacy or data handling:
              </p>
              <p className="text-gray-700">If you know me, you know how to get ahold of me. If we haven't met, please reach out to me through github.</p>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">📅 {i18n.t('privacy.section.updates')}</h3>
              <p className="text-gray-700">
                This privacy policy may be updated occasionally. We'll notify you of any significant changes 
                through the app or our website. Your continued use of the app after changes constitutes 
                acceptance of the updated policy.
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <p className="text-blue-800 font-medium">
                <strong>{i18n.t('privacy.lastUpdated.label')}</strong> {i18n.t('privacy.lastUpdated.date')}
              </p>
              <p className="text-blue-700 text-sm mt-1">
                {i18n.t('privacy.lastUpdated.scope')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy 