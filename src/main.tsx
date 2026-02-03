import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { Analytics } from './components/Analytics.tsx'
import { ensureStorageValid } from './hooks/useLocalStorage.ts'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

// Check if localStorage has expired (7 days since last visit)
// If so, clear all settings to start fresh
const wasCleared = ensureStorageValid()
if (wasCleared) {
  console.log('[App] Local storage was cleared due to inactivity. Starting fresh.')
}

// Load Google AdSense script dynamically if client ID is configured
const adsenseClientId = import.meta.env.VITE_ADSENSE_CLIENT_ID
if (adsenseClientId) {
  const script = document.createElement('script')
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`
  script.async = true
  script.crossOrigin = 'anonymous'
  document.head.appendChild(script)
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <Analytics />
    <App />
   </ErrorBoundary>
)
