/**
 * Performance Monitoring Utilities
 * Tracks Core Web Vitals and performance metrics
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {}
    this.observers = []
    this.isSupported = 'PerformanceObserver' in window
    this.slowOperationThresholdMs = 5000
    this.slowOperationHandler = null
    this.performanceBudgets = {
      lcpMs: 3000,
      fcpMs: 2000,
      bundleKb: 500
    }
  }

  /**
   * Initialize performance monitoring
   */
  initialize() {
    if (!this.isSupported) {
      console.warn('PerformanceObserver not supported')
      return
    }

    this.observeCoreWebVitals()
    this.observeNavigationTiming()
    this.observeResourceTiming()
    this.observeLongTasks()
  }

  /**
   * Observe Core Web Vitals
   */
  observeCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.metrics.lcp = lastEntry.startTime
        this.logMetric('LCP', lastEntry.startTime)
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          this.metrics.fid = entry.processingStart - entry.startTime
          this.logMetric('FID', this.metrics.fid)
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })

      // Cumulative Layout Shift (CLS)
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            this.metrics.cls = clsValue
            this.logMetric('CLS', clsValue)
          }
        })
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    }
  }

  /**
   * Observe navigation timing
   */
  observeNavigationTiming() {
    if ('PerformanceObserver' in window) {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.metrics.navigation = {
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              loadComplete: entry.loadEventEnd - entry.loadEventStart,
              domInteractive: entry.domInteractive,
              firstPaint: entry.responseStart
            }
            this.logMetric('Navigation', this.metrics.navigation)
          }
        })
      })
      navigationObserver.observe({ entryTypes: ['navigation'] })
    }
  }

  /**
   * Observe resource timing
   */
  observeResourceTiming() {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.initiatorType === 'script' || entry.initiatorType === 'css') {
            this.logMetric('Resource', {
              name: entry.name,
              duration: entry.duration,
              size: entry.transferSize,
              type: entry.initiatorType
            })
          }
        })
      })
      resourceObserver.observe({ entryTypes: ['resource'] })
    }
  }

  /**
   * Observe long tasks
   */
  observeLongTasks() {
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          this.logMetric('LongTask', {
            duration: entry.duration,
            startTime: entry.startTime
          })
        })
      })
      longTaskObserver.observe({ entryTypes: ['longtask'] })
    }
  }

  /**
   * Log performance metric
   */
  logMetric(name, value) {
    const timestamp = new Date().toISOString()
    console.log(`Performance [${timestamp}]: ${name} =`, value)
    
    // Store metric for reporting
    if (!this.metrics[name]) {
      this.metrics[name] = []
    }
    this.metrics[name].push({ value, timestamp })
  }

  /**
   * Configure slow operation threshold and handler
   */
  setSlowOperationHandler(handler, thresholdMs = 5000) {
    this.slowOperationHandler = typeof handler === 'function' ? handler : null
    if (typeof thresholdMs === 'number' && thresholdMs > 0) {
      this.slowOperationThresholdMs = thresholdMs
    }
  }

  /**
   * Set performance budgets
   */
  setPerformanceBudgets({ lcpMs, fcpMs, bundleKb } = {}) {
    this.performanceBudgets = {
      lcpMs: lcpMs ?? this.performanceBudgets.lcpMs,
      fcpMs: fcpMs ?? this.performanceBudgets.fcpMs,
      bundleKb: bundleKb ?? this.performanceBudgets.bundleKb
    }
  }

  /**
   * Evaluate against budgets and return breaches
   */
  evaluateBudgets() {
    const summary = this.getSummary()
    const breaches = []
    if (summary?.lcp && summary.lcp > this.performanceBudgets.lcpMs) {
      breaches.push({ metric: 'LCP', value: summary.lcp, budget: this.performanceBudgets.lcpMs })
    }
    const fcp = summary?.navigation?.firstPaint
    if (fcp && fcp > this.performanceBudgets.fcpMs) {
      breaches.push({ metric: 'FCP', value: fcp, budget: this.performanceBudgets.fcpMs })
    }
    const bundle = this.getBundleSize()
    const bundleKb = Math.round((bundle.estimatedSize || 0) / 1024)
    if (bundleKb && bundleKb > this.performanceBudgets.bundleKb) {
      breaches.push({ metric: 'Bundle Size', value: `${bundleKb}KB`, budget: `${this.performanceBudgets.bundleKb}KB` })
    }
    return breaches
  }

  /**
   * Get performance report
   */
  getReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      summary: this.getSummary()
    }
    return report
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const summary = {}
    
    // Core Web Vitals
    if (this.metrics.lcp) {
      summary.lcp = this.metrics.lcp
      summary.lcpRating = this.getRating(this.metrics.lcp, [2500, 4000])
    }
    
    if (this.metrics.fid) {
      summary.fid = this.metrics.fid
      summary.fidRating = this.getRating(this.metrics.fid, [100, 300])
    }
    
    if (this.metrics.cls) {
      summary.cls = this.metrics.cls
      summary.clsRating = this.getRating(this.metrics.cls, [0.1, 0.25])
    }

    // Navigation timing
    if (this.metrics.navigation) {
      summary.navigation = this.metrics.navigation
    }

    return summary
  }

  /**
   * Get rating for metric
   */
  getRating(value, thresholds) {
    if (value <= thresholds[0]) return 'good'
    if (value <= thresholds[1]) return 'needs-improvement'
    return 'poor'
  }

  /**
   * Measure function execution time
   */
  async measureFunction(name, fn) {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.logMetric(`Function:${name}`, duration)
      if (this.slowOperationHandler && duration >= this.slowOperationThresholdMs) {
        try { this.slowOperationHandler({ name, duration }) } catch {}
      }
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.logMetric(`Function:${name}:error`, duration)
      if (this.slowOperationHandler && duration >= this.slowOperationThresholdMs) {
        try { this.slowOperationHandler({ name, duration, error: true }) } catch {}
      }
      throw error
    }
  }

  /**
   * Measure component render time
   */
  measureRender(componentName, renderFn) {
    const start = performance.now()
    const result = renderFn()
    const duration = performance.now() - start
    this.logMetric(`Render:${componentName}`, duration)
    return result
  }

  /**
   * Monitor memory usage
   */
  monitorMemory() {
    if ('memory' in performance) {
      const memory = performance.memory
      this.logMetric('Memory', {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      })
    }
  }

  /**
   * Get bundle size estimate
   */
  getBundleSize() {
    const scripts = document.querySelectorAll('script[src]')
    let totalSize = 0
    
    scripts.forEach(script => {
      const url = script.src
      if (url.includes('chunk') || url.includes('main')) {
        // Estimate size based on URL patterns
        totalSize += 100 * 1024 // Rough estimate
      }
    })
    
    return {
      estimatedSize: totalSize,
      scriptCount: scripts.length
    }
  }

  /**
   * Check if performance is acceptable
   */
  isPerformanceAcceptable() {
    const summary = this.getSummary()
    const ratings = [summary.lcpRating, summary.fidRating, summary.clsRating]
    const goodRatings = ratings.filter(r => r === 'good').length
    return goodRatings >= 2 // At least 2 out of 3 should be good
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Performance optimization utilities
 */
export const performanceUtils = {
  /**
   * Debounce function calls
   */
  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  },

  /**
   * Throttle function calls
   */
  throttle(func, limit) {
    let inThrottle
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },

  /**
   * Lazy load component
   */
  lazyLoad(importFn) {
    return React.lazy(() => {
      return new Promise((resolve) => {
        // Add artificial delay to simulate loading
        setTimeout(() => {
          importFn().then(resolve)
        }, 100)
      })
    })
  },

  /**
   * Preload critical resources
   */
  preloadResources(resources) {
    resources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = resource.href
      link.as = resource.as || 'script'
      document.head.appendChild(link)
    })
  }
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  performanceMonitor.initialize()
} 