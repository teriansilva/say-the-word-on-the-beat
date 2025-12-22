import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Upload, X, Images, Pencil } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { validateImageFile, sanitizeText } from '@/lib/security'

export interface ImagePoolItem {
  url: string
  word?: string
}

interface ImagePoolManagerProps {
  images: ImagePoolItem[]
  onImagesChange: (images: ImagePoolItem[]) => void
}

export function ImagePoolManager({ images, onImagesChange }: ImagePoolManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingWord, setEditingWord] = useState('')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const remainingSlots = 8 - images.length
    if (files.length > remainingSlots) {
      toast.error(`You can only upload ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'}`)
      return
    }

    // Validate all files first
    const validationPromises = files.map(async file => {
      const validation = await validateImageFile(file)
      return { file, validation }
    })

    const validationResults = await Promise.all(validationPromises)
    const validFiles = validationResults.filter(result => {
      if (!result.validation.valid) {
        toast.error(`${result.file.name}: ${result.validation.error}`)
        return false
      }
      return true
    }).map(result => result.file)

    if (validFiles.length === 0) return

    let processedCount = 0
    const newImages: ImagePoolItem[] = []

    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        newImages.push({ url: dataUrl })
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

  const handleEditWord = (index: number) => {
    setEditingIndex(index)
    setEditingWord(images[index].word || '')
  }

  const handleSaveWord = (index: number) => {
    const sanitizedWord = sanitizeText(editingWord.trim())
    const updatedImages = [...images]
    updatedImages[index] = { 
      ...updatedImages[index], 
      word: sanitizedWord || undefined 
    }
    onImagesChange(updatedImages)
    setEditingIndex(null)
    setEditingWord('')
    toast.success(sanitizedWord ? 'Word saved' : 'Word removed')
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
            {images.length}/8
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Upload up to 8 images. Optionally add custom words that display with each image.
        </p>

        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {images.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="relative group aspect-square">
                  <img
                    src={item.url}
                    alt={`Pool image ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border-2 border-border"
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:scale-110 active:scale-95 shadow-md z-10"
                  >
                    <X size={14} weight="bold" />
                  </button>
                  {item.word && (
                    <div className="absolute bottom-2 left-2 right-2 bg-black/75 text-white text-xs font-bold py-1 px-2 rounded">
                      {item.word}
                    </div>
                  )}
                </div>
                
                {editingIndex === index ? (
                  <div className="flex gap-1">
                    <Input
                      value={editingWord}
                      onChange={(e) => setEditingWord(e.target.value)}
                      placeholder="Word (optional)"
                      className="text-xs h-7"
                      maxLength={20}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveWord(index)
                        } else if (e.key === 'Escape') {
                          setEditingIndex(null)
                          setEditingWord('')
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveWord(index)}
                      className="h-7 px-2"
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditWord(index)}
                    className="w-full h-7 text-xs gap-1"
                  >
                    <Pencil size={12} weight="bold" />
                    {item.word ? 'Edit Word' : 'Add Word'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full gap-2"
          disabled={images.length >= 8}
        >
          <Upload size={16} weight="bold" />
          {images.length === 0 ? 'Upload Images' : `Upload More (${8 - images.length} slots)`}
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
