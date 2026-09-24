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

// Analytics is opt-in: <Analytics /> loads nothing until the visitor accepts
// in the consent banner (gameplayce.io #1348).
createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <Analytics />
    <App />
   </ErrorBoundary>
)
