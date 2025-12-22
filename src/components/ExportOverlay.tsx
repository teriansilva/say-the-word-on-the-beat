interface ExportOverlayProps {
  isExporting: boolean
  progress: number
}

export function ExportOverlay({ isExporting, progress }: ExportOverlayProps) {
  if (!isExporting) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card p-8 rounded-3xl shadow-2xl text-center space-y-4 max-w-md">
        <div className="text-6xl font-bold text-primary animate-pulse">
          {progress < 33 ? '🎬' : progress < 66 ? '🎥' : '✨'}
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {progress < 33 ? 'Preparing...' : progress < 66 ? 'Recording...' : 'Finishing up...'}
        </h2>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Please keep this tab visible while recording
        </p>
      </div>
    </div>
  )
}
