import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { TRACKING_ITEMS } from '../constants/tracking-items.js'
import { useAppStore } from '../stores/app-store.js'
import DisplayTypeSelector from './display-type-selector.jsx'
import AppHeader from './app-header.jsx';
import { i18n } from '../utils/i18n.js'

const Settings = () => {
  const { config, updateConfig, updateConfigLocal, saveConfig, exportConfig, importConfig, clearCorruptedConfig, addNotification, auth, signOut } = useAppStore()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [selectedReport, setSelectedReport] = useState('morning')
  const [draggingItem, setDraggingItem] = useState(null) // { id, category }
  const [dragOverItem, setDragOverItem] = useState(null) // { id, category }
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const importInputRef = useRef(null)
  // Notifications UI is currently disabled; block is hidden
  const notificationsUiEnabled = false

  // Helpers to get items eligible for a given view and category
  const getItemsByViewAndCategory = (view, category) => {
    return Object.values(TRACKING_ITEMS)
      .filter(item => item.category === category && !!item[view])
  }

  // Helper to get sorted items for the current report and category
  const getSortedItems = (category, reportType) => {
    const sectionByType = type => {
      if (type === 'quick') {
        return config?.view_configurations?.quick_track?.sections
      }
      return config?.view_configurations?.[`${type}_report`]?.sections
    }
    const section = sectionByType(reportType)
    const checkedIds = (section?.[category]?.items || []).filter(id => {
      const item = TRACKING_ITEMS[id]
      return item && item.category === category && !!item[reportType]
    })
    const allItems = getItemsByViewAndCategory(reportType, category)
    if (!section || !section[category] || checkedIds.length === 0) {
      // No config: sort all alphabetically
      return [...allItems].sort((a, b) => a.name.localeCompare(b.name))
    }
    // Checked items in user-defined order (no sort)
    const checked = checkedIds
      .map(id => allItems.find(item => item.id === id))
      .filter(Boolean)
    // Unchecked items alphabetically
    const unchecked = allItems
      .filter(item => !checkedIds.includes(item.id))
      .sort((a, b) => a.name.localeCompare(b.name))
    return [...checked, ...unchecked]
  }

  // Ensure required fields exist on a view object per schema
  const ensureViewRequiredFields = (reportType, prev = {}) => {
    const view = { ...prev }
    if (reportType === 'morning') {
      if (!Array.isArray(view.wearables)) {
        view.wearables = ['wearables_sleep_score', 'wearables_body_battery']
      }
    }
    return view
  }

  const ensureAllViewRequiredFields = (vc = {}) => {
    const next = { ...vc }
    // Morning wearables must always exist
    next.morning_report = ensureViewRequiredFields('morning', next.morning_report || {})
    // Ensure required section scaffolding exists to satisfy schema
    const ensureSection = (section) => ({
      items: Array.isArray(section?.items) ? section.items : [],
      sort_order: Array.isArray(section?.sort_order) ? section.sort_order : [],
      visible: typeof section?.visible === 'boolean' ? section.visible : true,
      collapsed: typeof section?.collapsed === 'boolean' ? section.collapsed : false
    })
    const ensureViewSections = (view) => {
      const v = view || {}
      v.sections = v.sections || {}
      v.sections.body = ensureSection(v.sections.body)
      v.sections.mind = ensureSection(v.sections.mind)
      return v
    }
    next.morning_report = ensureViewSections(next.morning_report)
    next.evening_report = ensureViewSections(next.evening_report)
    next.quick_track = ensureViewSections(next.quick_track)
    return next
  }

  // Handler for toggling item inclusion
  const handleToggle = (itemId, reportType, checked) => {
    const sectionKey = reportType === 'quick' ? 'quick_track' : `${reportType}_report`
    const newConfig = { ...config, view_configurations: { ...config.view_configurations } }
    const oldSections = config.view_configurations[sectionKey]?.sections || {}
    const newSections = { ...oldSections }
    const cat = TRACKING_ITEMS[itemId].category
    const oldArr = (oldSections[cat]?.items || []).filter(id => !!TRACKING_ITEMS[id]?.[reportType])
    let arr = [...oldArr]
    if (checked) {
      if (!arr.includes(itemId)) arr.push(itemId) // Add to end
    } else {
      arr = arr.filter(id => id !== itemId)
    }
    const baseSection = oldSections[cat] || { items: [], sort_order: [], visible: true, collapsed: false }
    newSections[cat] = { ...baseSection, items: arr, sort_order: arr }
    const reportTypeKey = reportType
    newConfig.view_configurations[sectionKey] = {
      ...ensureViewRequiredFields(reportTypeKey, config.view_configurations[sectionKey]),
      sections: newSections
    }
    newConfig.view_configurations = ensureAllViewRequiredFields(newConfig.view_configurations)
    updateConfigLocal(newConfig)
    setHasUnsavedChanges(true)
    addNotification({ type: 'success', title: i18n.t('settings.trackingItems.updated.title'), message: i18n.t('settings.trackingItems.updated.message') })
  }

  // Handler for moving item up/down
  const handleMove = (itemId, reportType, direction) => {
    const sectionKey = reportType === 'quick' ? 'quick_track' : `${reportType}_report`
    const newConfig = { ...config, view_configurations: { ...config.view_configurations } }
    const oldSections = config.view_configurations[sectionKey]?.sections || {}
    const newSections = { ...oldSections }
    const cat = TRACKING_ITEMS[itemId].category
    const oldArr = (oldSections[cat]?.items || []).filter(id => !!TRACKING_ITEMS[id]?.[reportType])
    const idx = oldArr.indexOf(itemId)
    if (idx === -1) return
    let newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= oldArr.length) return
    // Only operate on checked items
    const arr = [...oldArr]
    ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
    const baseSection = oldSections[cat] || { items: [], sort_order: [], visible: true, collapsed: false }
    newSections[cat] = { ...baseSection, items: arr, sort_order: arr }
    const reportTypeKey = reportType
    newConfig.view_configurations[sectionKey] = {
      ...ensureViewRequiredFields(reportTypeKey, config.view_configurations[sectionKey]),
      sections: newSections
    }
    newConfig.view_configurations = ensureAllViewRequiredFields(newConfig.view_configurations)
    updateConfigLocal(newConfig)
    setHasUnsavedChanges(true)
    addNotification({ type: 'success', title: i18n.t('settings.trackingItems.orderUpdated.title'), message: i18n.t('settings.trackingItems.orderUpdated.message') })
  }

  // Reorder helper used by drag-and-drop
  const applyReorder = (reportType, category, fromId, toId) => {
    const sectionKey = reportType === 'quick' ? 'quick_track' : `${reportType}_report`
    const newConfig = { ...config, view_configurations: { ...config.view_configurations } }
    const oldSections = config.view_configurations[sectionKey]?.sections || {}
    const oldArr = oldSections[category]?.items || []
    const fromIdx = oldArr.indexOf(fromId)
    const toIdx = oldArr.indexOf(toId)
    if (fromIdx === -1 || toIdx === -1) return
    const arr = [...oldArr]
    const [moved] = arr.splice(fromIdx, 1)
    arr.splice(toIdx, 0, moved)
    const newSections = { ...oldSections, [category]: { ...oldSections[category], items: arr, sort_order: arr } }
    newConfig.view_configurations[sectionKey] = { ...ensureViewRequiredFields(reportType, config.view_configurations[sectionKey]), sections: newSections }
    newConfig.view_configurations = ensureAllViewRequiredFields(newConfig.view_configurations)
    updateConfigLocal(newConfig)
    setHasUnsavedChanges(true)
  }

  // Drag-and-drop handlers (checked items only)
  const handleDragStart = (itemId, category) => {
    setDraggingItem({ id: itemId, category })
  }
  const handleDragOver = (itemId, category, e) => {
    try { e.preventDefault() } catch {}
    setDragOverItem({ id: itemId, category })
  }
  const handleDrop = (itemId, category, reportType) => {
    if (draggingItem && draggingItem.category === category && draggingItem.id !== itemId) {
      applyReorder(reportType, category, draggingItem.id, itemId)
    }
    setDraggingItem(null)
    setDragOverItem(null)
  }
  const handleDragEnd = () => {
    setDraggingItem(null)
    setDragOverItem(null)
  }

  // Handler for toggling notification preferences
  const handleNotificationToggle = (type, checked) => {
    const key = `${type}_enabled`
    const newConfig = {
      ...config,
      notification_settings: {
        ...config.notification_settings,
        [key]: checked
      }
    }
    updateConfigLocal(newConfig)
    setHasUnsavedChanges(true)
    addNotification({
      type: 'success',
      title: i18n.t('settings.notifications.preferenceUpdated.title'),
      message: checked
        ? i18n.t('settings.notifications.enabled', { type: i18n.t(`settings.reportType.${type}`) })
        : i18n.t('settings.notifications.disabled', { type: i18n.t(`settings.reportType.${type}`) })
    })
  }

  // Handler for changing notification times
  const handleNotificationTimeChange = (type, value) => {
    const newConfig = { ...config }
    if (!newConfig.notification_settings) newConfig.notification_settings = {}
    newConfig.notification_settings[`${type}_time`] = value
    updateConfigLocal(newConfig)
    setHasUnsavedChanges(true)
    addNotification({
      type: 'success',
      title: i18n.t('settings.notifications.timeUpdated.title'),
      message: i18n.t('settings.notifications.timeUpdated.message', { type: i18n.t(`settings.reportType.${type}`) })
    })
  }

  // Handler for changing report times
  const handleTimeChange = (key, value) => {
    const newConfig = { ...config }
    if (!newConfig.display_options) newConfig.display_options = {}
    if (!newConfig.display_options.view_times) newConfig.display_options.view_times = { morning_end: '09:00', evening_start: '20:00' }
    newConfig.display_options.view_times[key] = value
    updateConfigLocal(newConfig)
    setHasUnsavedChanges(true)
    const timeKeyLabelMap = {
      morning_end: i18n.t('settings.reportTimes.morningEnd'),
      evening_start: i18n.t('settings.reportTimes.eveningStart')
    }
    addNotification({
      type: 'success',
      title: i18n.t('settings.reportTimes.updated.title'),
      message: i18n.t('settings.reportTimes.updated.message', { timeKey: timeKeyLabelMap[key] || key })
    })
  }

  // Render checkboxes and up/down buttons for each item in a table row
  const renderTableRow = (item, idx, reportType) => {
    const sectionByType = type => {
      if (type === 'quick') {
        return config?.view_configurations?.quick_track?.sections
      }
      return config?.view_configurations?.[`${type}_report`]?.sections
    }
    const isDragOver = dragOverItem && dragOverItem.id === item.id
    const rowBg = isDragOver ? 'bg-blue-50' : (idx % 2 === 0 ? 'bg-cream-100' : 'bg-cream-50')
    const section = sectionByType(reportType)
    const cat = item.category
    const arr = (section?.[cat]?.items || []).filter(id => !!TRACKING_ITEMS[id]?.[reportType])
    const checked = arr.includes(item.id)
    // Only checked items are reorderable
    const checkedIds = section?.[cat]?.items || []
    const arrIdx = checkedIds.indexOf(item.id)
    return (
      <tr
        key={item.id}
        className={rowBg}
        draggable={checked}
        onDragStart={() => checked && handleDragStart(item.id, cat)}
        onDragOver={(e) => checked && handleDragOver(item.id, cat, e)}
        onDrop={() => checked && handleDrop(item.id, cat, reportType)}
        onDragEnd={handleDragEnd}
        style={{ cursor: checked ? 'move' : 'default' }}
      >
        <td className="px-2 py-1 w-48 font-medium text-gray-800 align-middle">{item.name}</td>
        <td className="px-2 py-1 text-center align-middle">
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={!!checked}
              onChange={e => handleToggle(item.id, reportType, e.target.checked)}
            />
            <span className="text-xs text-gray-600 capitalize">{reportType}</span>
          </label>
          {checked && (
            <span className="ml-1 inline-flex">
              <span className="px-1 text-xs text-gray-400" title="Drag to reorder">↕</span>
            </span>
          )}
        </td>
      </tr>
    )
  }

  // PWA functionality removed - app works as regular web app

  return (
    <div className="min-h-screen wildflower-bg">
      <AppHeader
        onExportConfig={null}
        setShowImportModal={null}
        setShowResetConfirmModal={null}
        configImportError={null}
        configImportSuccess={null}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hasUnsavedChanges && (
          <div className="sticky top-0 z-10 mb-4">
            <div className="meadow-card p-4 flex items-center justify-between border-l-4 border-primary-400 bg-primary-50">
              <div className="text-sm text-gray-700">You have unsaved changes</div>
              <div className="space-x-2">
                <button
                  className="btn-secondary px-3 py-1 text-sm"
                  onClick={() => { window.location.reload() }}
                >Discard</button>
                <button
                  className="btn-primary px-4 py-1 text-sm"
                  onClick={async () => {
                    try {
                      await saveConfig()
                      setHasUnsavedChanges(false)
                      addNotification({ type: 'success', title: 'Settings saved', message: 'Your configuration has been saved.' })
                    } catch (e) {
                      addNotification({ type: 'error', title: 'Save failed', message: e?.message || 'Please re-authenticate and try again.' })
                    }
                  }}
                >Save changes</button>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center mb-8">
          <Link 
            to="/" 
            className="btn-secondary px-4 py-2 text-sm flex items-center"
          >
            <span className="mr-2">←</span>
            {i18n.t('nav.backToDashboard')}
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 wildflower-text-shadow ml-4">{i18n.t('settings.title')}</h1>
        </div>

        <div className="space-y-6">
          {/* Report Times */}
          <div className="meadow-card p-6 border-l-4 border-accent-400">
            <h3 className="text-lg font-semibold text-accent-800 mb-4">{i18n.t('settings.reportTimes.title')}</h3>
            <p className="text-sm text-gray-600 mb-4">{i18n.t('settings.reportTimes.subtitle')}</p>
            <div className="flex flex-col gap-4 max-w-xs">
              <label className="flex items-center gap-3">
                <span className="w-32 text-gray-700 font-medium">{i18n.t('settings.reportTimes.morningEnd')}</span>
                <input
                  type="time"
                  value={config?.display_options?.view_times?.morning_end || '09:00'}
                  onChange={e => handleTimeChange('morning_end', e.target.value)}
                  className="input w-36"
                />
              </label>
              <label className="flex items-center gap-3">
                <span className="w-32 text-gray-700 font-medium">{i18n.t('settings.reportTimes.eveningStart')}</span>
                <input
                  type="time"
                  value={config?.display_options?.view_times?.evening_start || '20:00'}
                  onChange={e => handleTimeChange('evening_start', e.target.value)}
                  className="input w-36"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">{i18n.t('settings.reportTimes.note')}</p>
          </div>
          {/* Notification Preferences (hidden) */}
          {notificationsUiEnabled && (
            <div className="meadow-card p-6 border-l-4 border-info-400">
              <h3 className="text-lg font-semibold text-info-800 mb-4">{i18n.t('settings.notifications.title')}</h3>
              <p className="text-sm text-gray-600 mb-4">{i18n.t('settings.notifications.subtitle')}</p>
              <div className="flex flex-col gap-4 max-w-xs">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config?.notification_settings?.morning_enabled ?? true}
                    onChange={e => handleNotificationToggle('morning', e.target.checked)}
                    className="checkbox"
                  />
                  <span className="w-32 text-gray-700 font-medium">{i18n.t('settings.notifications.morning')}</span>
                  <input
                    type="time"
                    value={config?.notification_settings?.morning_time || '08:00'}
                    onChange={e => handleNotificationTimeChange('morning', e.target.value)}
                    className="input w-36 ml-2"
                    disabled={!(config?.notification_settings?.morning_enabled ?? true)}
                  />
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config?.notification_settings?.evening_enabled ?? true}
                    onChange={e => handleNotificationToggle('evening', e.target.checked)}
                    className="checkbox"
                  />
                  <span className="w-32 text-gray-700 font-medium">{i18n.t('settings.notifications.evening')}</span>
                  <input
                    type="time"
                    value={config?.notification_settings?.evening_time || '20:00'}
                    onChange={e => handleNotificationTimeChange('evening', e.target.value)}
                    className="input w-36 ml-2"
                    disabled={!(config?.notification_settings?.evening_enabled ?? true)}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">{i18n.t('settings.notifications.note')}</p>
            </div>
          )}
          {/* Customize Tracking Items */}
          <div className="meadow-card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{i18n.t('settings.customize.title')}</h3>
            <p className="text-sm text-gray-600 mb-4">{i18n.t('settings.customize.subtitle')}</p>
            <div className="flex gap-2 mb-4">
                {['morning', 'quick', 'evening'].map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedReport(type)}
                    className={
                      [
                        'flex-1 py-4 px-4 rounded-xl border-2 transition-all duration-300 hover:shadow-medium',
                        selectedReport === type
                          ? 'border-primary-500 bg-gradient-to-br from-primary-100 to-primary-50 text-primary-700 shadow-medium'
                          : 'border-cream-400 bg-cream-500 text-gray-700 hover:border-primary-300 hover:bg-cream-400'
                      ].join(' ')
                    }
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2 animate-bloom">
                        {type === 'morning' ? '🌻' : type === 'evening' ? '🌙' : '⚡'}
                      </div>
                      <div className="text-sm font-medium capitalize">{i18n.t(`settings.reportType.${type}`)}</div>
                    </div>
                  </button>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['body', 'mind'].map(category => (
                <div key={category}>
                  <h4 className="font-semibold text-gray-700 mb-2 capitalize">{category}</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-cream-200">
                          <th className="px-2 py-2 text-left font-semibold text-gray-700">{i18n.t('settings.table.item')}</th>
                          <th className="px-2 py-2 text-center font-semibold text-gray-700">{i18n.t(`settings.table.column.${selectedReport}`)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getSortedItems(category, selectedReport).map((item, idx) => renderTableRow(item, idx, selectedReport))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Display Type Settings */}
          <DisplayTypeSelector />


          {/* Configuration Actions */}
          <div className="meadow-card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{i18n.t('settings.actions.title')}</h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  try {
                    exportConfig && exportConfig()
                  } catch (e) {}
                }}
                className="btn-primary px-4 py-2 text-sm"
              >
                {i18n.t('settings.actions.export')}
              </button>
              <button
                onClick={() => importInputRef.current && importInputRef.current.click()}
                className="btn-secondary px-4 py-2 text-sm"
              >
                {i18n.t('settings.actions.import')}
              </button>
              <input
                type="file"
                ref={importInputRef}
                accept=".json,.lzjson"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const text = await file.text()
                    const data = JSON.parse(text)
                    await (importConfig && importConfig(data))
                    addNotification({ type: 'success', title: i18n.t('settings.actions.import'), message: 'Configuration imported.' })
                  } catch (err) {
                    addNotification({ type: 'error', title: 'Import failed', message: err?.message || 'Invalid file.' })
                  } finally {
                    try { e.target.value = '' } catch {}
                  }
                }}
              />
              <button
                onClick={async () => {
                  const ok = window.confirm('This will reset your configuration to defaults. Continue?')
                  if (!ok) return
                  try {
                    await (clearCorruptedConfig && clearCorruptedConfig())
                    addNotification({ type: 'success', title: i18n.t('toast.config.cleared.title'), message: i18n.t('toast.config.cleared.message') })
                  } catch (e) {
                    addNotification({ type: 'error', title: i18n.t('toast.config.clearFailed.title'), message: i18n.t('toast.config.clearFailed.message') })
                  }
                }}
                className="btn-secondary px-4 py-2 text-sm text-red-600 border-red-400 hover:bg-red-50"
              >
                {i18n.t('settings.actions.reset')}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Settings 