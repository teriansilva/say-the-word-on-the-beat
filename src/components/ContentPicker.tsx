import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Upload, Image as ImageIcon, Smiley } from '@phosphor-icons/react'
import { useRef } from 'react'
import { toast } from 'sonner'

interface ContentPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (content: string, type: 'emoji' | 'image') => void
}

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳'],
  'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋'],
  'Food': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🍞'],
  'Objects': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷'],
  'Things': ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏰'],
  'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '⭐', '🌟', '✨', '⚡', '💥', '🔥', '🌈', '☀️', '🌙', '⭐', '🎵', '🎶'],
}

export function ContentPicker({ isOpen, onClose, onSelect }: ContentPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji, 'emoji')
    onClose()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      onSelect(dataUrl, 'image')
      onClose()
      toast.success('Image uploaded successfully!')
    }
    reader.onerror = () => {
      toast.error('Failed to read image file')
    }
    reader.readAsDataURL(file)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Choose Content</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="emoji" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="emoji" className="gap-2">
              <Smiley size={20} weight="bold" />
              Emoji
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-2">
              <ImageIcon size={20} weight="bold" />
              Image
            </TabsTrigger>
          </TabsList>

          <TabsContent value="emoji" className="mt-4">
            <ScrollArea className="h-[450px] pr-4">
              <div className="space-y-6">
                {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      {category}
                    </h3>
                    <div className="grid grid-cols-6 gap-2">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleEmojiClick(emoji)}
                          className="aspect-square flex items-center justify-center text-3xl hover:bg-accent rounded-lg transition-colors cursor-pointer border-2 border-transparent hover:border-primary"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="image" className="mt-4">
            <div className="h-[450px] flex items-center justify-center">
              <div className="text-center space-y-4 p-8">
                <div className="w-24 h-24 mx-auto rounded-full bg-accent flex items-center justify-center">
                  <Upload size={48} weight="bold" className="text-accent-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Upload an Image</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a custom image for this card
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Max size: 5MB • Formats: JPG, PNG, GIF, WebP
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload size={20} weight="bold" />
                  Select Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
