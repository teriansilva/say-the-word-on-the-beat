import { useState, useRef, useCallback } from 'react'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Crop as CropIcon, ArrowsOut, Check, X, ArrowCounterClockwise } from '@phosphor-icons/react'

interface ImageCropperProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  onCropComplete: (croppedImageDataUrl: string) => void
  aspectRatio?: number
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export function ImageCropper({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  aspectRatio = 1,
}: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, aspectRatio))
  }, [aspectRatio])

  const handleReset = () => {
    setScale(1)
    setRotate(0)
    if (imgRef.current) {
      const { width, height } = imgRef.current
      setCrop(centerAspectCrop(width, height, aspectRatio))
    }
  }

  const getCroppedImage = useCallback(async (): Promise<string> => {
    const image = imgRef.current
    if (!image || !completedCrop) {
      throw new Error('No image or crop data')
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('No 2d context')
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    // Calculate the size of the cropped area in natural pixels
    const cropX = completedCrop.x * scaleX
    const cropY = completedCrop.y * scaleY
    const cropWidth = completedCrop.width * scaleX
    const cropHeight = completedCrop.height * scaleY

    // Handle rotation
    const rotRad = (rotate * Math.PI) / 180

    // Set canvas size to the cropped area size
    // Account for rotation by using the larger dimension if rotated
    let outputWidth = cropWidth
    let outputHeight = cropHeight
    
    if (rotate % 180 !== 0) {
      // For 90/270 degree rotations, swap dimensions
      if (rotate === 90 || rotate === 270 || rotate === -90 || rotate === -270) {
        outputWidth = cropHeight
        outputHeight = cropWidth
      }
    }

    canvas.width = outputWidth / scale
    canvas.height = outputHeight / scale

    ctx.imageSmoothingQuality = 'high'

    // Move to center
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate(rotRad)
    ctx.scale(1, 1)
    ctx.translate(-canvas.width / 2, -canvas.height / 2)

    // Draw the cropped image
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height
    )

    // Convert to data URL with good quality
    return canvas.toDataURL('image/jpeg', 0.92)
  }, [completedCrop, rotate, scale])

  const handleSave = async () => {
    try {
      const croppedImageUrl = await getCroppedImage()
      onCropComplete(croppedImageUrl)
      onOpenChange(false)
      // Reset state for next use
      setCrop(undefined)
      setCompletedCrop(undefined)
      setScale(1)
      setRotate(0)
    } catch (error) {
      console.error('Failed to crop image:', error)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    setCrop(undefined)
    setCompletedCrop(undefined)
    setScale(1)
    setRotate(0)
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <CropIcon size={24} weight="bold" className="text-primary" />
            Crop Image
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto">
          <div className="flex flex-col gap-4">
            {/* Crop area */}
            <div className="flex justify-center bg-muted/50 rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-hidden">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
                className="max-h-full"
              >
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={imageSrc}
                  style={{
                    transform: `scale(${scale}) rotate(${rotate}deg)`,
                    maxHeight: '380px',
                    objectFit: 'contain',
                  }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            </div>

            {/* Controls */}
            <div className="space-y-4 px-2">
              {/* Zoom */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <ArrowsOut size={16} weight="bold" />
                    Zoom
                  </label>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(scale * 100)}%
                  </Badge>
                </div>
                <Slider
                  value={[scale]}
                  onValueChange={([value]) => setScale(value)}
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Rotate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <ArrowCounterClockwise size={16} weight="bold" />
                    Rotate
                  </label>
                  <Badge variant="secondary" className="text-xs">
                    {rotate}°
                  </Badge>
                </div>
                <Slider
                  value={[rotate]}
                  onValueChange={([value]) => setRotate(value)}
                  min={-180}
                  max={180}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Quick rotate buttons */}
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotate(r => Math.max(-180, r - 90))}
                  className="text-xs"
                >
                  -90°
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="text-xs"
                >
                  Reset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotate(r => Math.min(180, r + 90))}
                  className="text-xs"
                >
                  +90°
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel} className="gap-2">
            <X size={16} weight="bold" />
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Check size={16} weight="bold" />
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
