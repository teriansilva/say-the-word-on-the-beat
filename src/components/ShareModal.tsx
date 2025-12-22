import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ShareNetwork, Copy, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface ShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerateShare: () => Promise<string>
}

export function ShareModal({ open, onOpenChange, onGenerateShare }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const url = await onGenerateShare()
      setShareUrl(url)
      toast.success('Share link generated!')
    } catch (error) {
      toast.error('Failed to generate share link')
    } finally {
      setIsGenerating(false)
    }
  }

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <ShareNetwork size={28} weight="bold" className="text-primary" />
            Share Your Game
          </DialogTitle>
          <DialogDescription>
            Generate a shareable link that includes all your custom settings (images, difficulty, BPM, and audio)
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {!shareUrl ? (
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
            >
              <ShareNetwork size={20} weight="bold" />
              {isGenerating ? 'Generating...' : 'Generate Share Link'}
            </Button>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Share Link</label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="flex-1"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check size={18} weight="bold" />
                    ) : (
                      <Copy size={18} weight="bold" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
              >
                Generate New Link
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
