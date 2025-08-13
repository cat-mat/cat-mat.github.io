// Local storage usage monitor with warning at ~4MB
import { i18n } from './i18n.js'

const MB = 1024 * 1024
const WARN_THRESHOLD = 4 * MB

export function estimateLocalStorageBytes() {
  try {
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      const value = localStorage.getItem(key)
      total += (key?.length || 0) + (value?.length || 0)
    }
    return total
  } catch {
    return 0
  }
}

export function startLocalStorageMonitor(notify) {
  if (typeof window === 'undefined') return () => {}
  let timer = null
  const tick = () => {
    const bytes = estimateLocalStorageBytes()
    if (bytes >= WARN_THRESHOLD) {
      const mb = (bytes / MB).toFixed(1)
      try {
        if (typeof notify === 'function') {
          notify({
            type: 'warning',
            title: i18n.t('monitor.storage.warning.title'),
            message: i18n.t('monitor.storage.warning.message', { mb })
          })
        }
      } catch {}
    }
  }
  timer = setInterval(tick, 15000)
  return () => timer && clearInterval(timer)
}


