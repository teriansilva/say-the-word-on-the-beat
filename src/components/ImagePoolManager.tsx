import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, X, Images } from '@phosphor-icons/react'
import { useRef } from 'react'
import { toast } from 'sonner'

interface ImagePoolManagerProps {
  images: string[]
  onImagesChange: (images: string[]) => void
}

export function ImagePoolManager({ images, onImagesChange }: ImagePoolManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const remainingSlots = 4 - images.length
    if (files.length > remainingSlots) {
      toast.error(`You can only upload ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'}`)
      return
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    let processedCount = 0
    const newImages: string[] = []

    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        newImages.push(dataUrl)
        processedCount++

        if (processedCount === validFiles.length) {
          onImagesChange([...images, ...newImages])
          toast.success(`${validFiles.length} image${validFiles.length === 1 ? '' : 's'} uploaded!`)
        }
      }
      reader.onerror = () => {
        processedCount++
        toast.error(`Failed to read ${file.name}`)
      }
      reader.readAsDataURL(file)
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
    toast.success('Image removed')
  }

  return (
    <Card className="p-4 border-2">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Images size={20} weight="bold" className="text-secondary" />
            <label className="text-sm font-semibold text-foreground">
              Image Pool
            </label>
          </div>
          <Badge variant="secondary" className="text-xs">
            {images.length}/4
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Upload up to 4 images that will be used in the grid based on difficulty
        </p>

        {images.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {images.map((image, index) => (
              <div key={index} className="relative group aspect-square">
                <img
                  src={image}
                  alt={`Pool image ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border-2 border-border"
                />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:scale-110 active:scale-95 shadow-md"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full gap-2"
          disabled={images.length >= 4}
        >
          <Upload size={16} weight="bold" />
          {images.length === 0 ? 'Upload Images' : `Upload More (${4 - images.length} slots)`}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </Card>
  )
}
