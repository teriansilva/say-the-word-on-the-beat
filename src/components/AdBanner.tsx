/**
 * AdBanner Component
 * 
 * Displays Google AdSense advertisements in different formats.
 * Supports horizontal banners and vertical (portrait) sidebars.
 * 
 * Google Auto Ads handles placement automatically.
 * Configuration via environment variables:
 * - VITE_ADSENSE_CLIENT_ID: Your AdSense publisher ID
 */

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

export type AdFormat = 'horizontal' | 'vertical' | 'rectangle'

interface AdBannerProps {
  format?: AdFormat
  className?: string
}

// AdSense configuration from environment variables
const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID || ''

// Track if AdSense script has been loaded globally
let adsenseScriptLoaded = false

/**
 * Dynamically load the AdSense script if not already loaded
 */
function loadAdsenseScript(clientId: string) {
  if (adsenseScriptLoaded || !clientId) return
  
  const existingScript = document.querySelector('script[src*="pagead2.googlesyndication.com"]')
  if (existingScript) {
    adsenseScriptLoaded = true
    return
  }
  
  const script = document.createElement('script')
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`
  script.async = true
  script.crossOrigin = 'anonymous'
  document.head.appendChild(script)
  adsenseScriptLoaded = true
}

export function AdBanner({ format = 'horizontal', className }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null)
  const isLoaded = useRef(false)

  // Don't render if AdSense is not configured
  const adClientId = ADSENSE_CLIENT_ID
  
  useEffect(() => {
    // Load AdSense script dynamically
    if (adClientId) {
      loadAdsenseScript(adClientId)
    }
  }, [adClientId])
  
  useEffect(() => {
    // Only load once per mount and if properly configured
    if (isLoaded.current || !adClientId) return
    
    try {
      // Push the ad to adsbygoogle queue
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        window.adsbygoogle.push({})
        isLoaded.current = true
      }
    } catch (error) {
      console.debug('AdSense error:', error)
    }
  }, [adClientId])

  // Don't render placeholder if AdSense is not configured
  if (!adClientId) {
    return null
  }

  // Determine dimensions based on format
  const getAdStyle = () => {
    switch (format) {
      case 'vertical':
        return {
          display: 'inline-block',
          width: '160px',
          height: '600px',
        }
      case 'rectangle':
        return {
          display: 'inline-block',
          width: '300px',
          height: '250px',
        }
      case 'horizontal':
      default:
        return {
          display: 'block',
          width: '100%',
          height: '90px',
        }
    }
  }

  return (
    <div 
      className={cn(
        'ad-banner flex items-center justify-center overflow-hidden',
        format === 'vertical' && 'min-h-[600px]',
        format === 'horizontal' && 'w-full min-h-[90px]',
        format === 'rectangle' && 'min-h-[250px]',
        className
      )}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={getAdStyle()}
        data-ad-client={adClientId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}

/**
 * Wrapper for vertical sidebar ads
 */
export function AdSidebar({ className }: { className?: string }) {
  return (
    <div className={cn('hidden xl:block w-[160px] shrink-0', className)}>
      <div className="sticky top-8">
        <AdBanner format="vertical" />
      </div>
    </div>
  )
}

/**
 * Wrapper for horizontal top banner ads
 */
export function AdTopBanner({ className }: { className?: string }) {
  return (
    <div className={cn('w-full max-w-4xl mx-auto mb-4', className)}>
      <AdBanner format="horizontal" />
    </div>
  )
}

/**
 * Wrapper for completion screen ads
 */
export function AdCompletionBanner({ className }: { className?: string }) {
  return (
    <div className={cn('w-full max-w-md mx-auto mt-6', className)}>
      <AdBanner format="rectangle" />
    </div>
  )
}
