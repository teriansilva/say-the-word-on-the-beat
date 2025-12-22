import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ShareNetwork, Copy, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface ShareLinkProps {
  shareUrl: string
  onGenerate: () => void
}

export function ShareLink({ shareUrl, onGenerate }: ShareLinkProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Share link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  return (
    <Card className="p-4 border-2 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ShareNetwork size={20} weight="bold" />
          Share Your Game
        </label>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Generate a shareable link that includes all your custom settings
      </p>
      
      <div className="flex gap-2">
        <Input
          value={shareUrl}
          readOnly
          className="flex-1 text-sm"
          placeholder="Click 'Generate Link' to create shareable URL"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          disabled={!shareUrl}
          className="shrink-0"
        >
          {copied ? (
            <>
              <Check size={18} weight="bold" />
              Copied
            </>
          ) : (
            <>
              <Copy size={18} weight="bold" />
              Copy
            </>
          )}
        </Button>
      </div>
      
      <Button
        size="sm"
        variant="default"
        onClick={onGenerate}
        className="w-full"
      >
        <ShareNetwork size={18} weight="bold" />
        Generate Share Link
      </Button>
    </Card>
  )
}
