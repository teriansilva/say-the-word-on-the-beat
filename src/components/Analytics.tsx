import { useEffect } from 'react'

const ANALYTICS_SCRIPT_URL = 'https://analytics.superstatus.io/script.js'
const WEBSITE_ID = '9411ff1f-a13e-4671-a1e5-9f949e712b9e'

export function Analytics() {
  useEffect(() => {
    // Only load analytics in production
    if (!import.meta.env.PROD) {
      return
    }

    // Check if script is already loaded
    if (document.querySelector(`script[src="${ANALYTICS_SCRIPT_URL}"]`)) {
      return
    }

    const script = document.createElement('script')
    script.src = ANALYTICS_SCRIPT_URL
    script.defer = true
    script.dataset.websiteId = WEBSITE_ID
    document.head.appendChild(script)

    return () => {
      // Cleanup on unmount (unlikely but good practice)
      const existingScript = document.querySelector(`script[src="${ANALYTICS_SCRIPT_URL}"]`)
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [])

  return null
}
