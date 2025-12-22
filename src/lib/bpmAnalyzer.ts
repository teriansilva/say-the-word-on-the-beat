export interface BpmSegment {
  startTime: number
  endTime: number
  bpm: number
}

export interface BpmAnalysisResult {
  segments: BpmSegment[]
  averageBpm: number
  silenceOffset: number
}

export async function analyzeBpm(audioUrl: string): Promise<BpmAnalysisResult> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  
  try {
    const response = await fetch(audioUrl)
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    
    const silenceOffset = detectSilenceOffset(audioBuffer)
    
    const offlineContext = new OfflineAudioContext(
      1,
      audioBuffer.length,
      audioBuffer.sampleRate
    )
    
    const source = offlineContext.createBufferSource()
    source.buffer = audioBuffer
    
    const analyser = offlineContext.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.8
    
    const lowpass = offlineContext.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 150
    
    source.connect(lowpass)
    lowpass.connect(analyser)
    analyser.connect(offlineContext.destination)
    
    source.start(0)
    
    const renderedBuffer = await offlineContext.startRendering()
    const channelData = renderedBuffer.getChannelData(0)
    
    const peaks = detectPeaks(channelData, audioBuffer.sampleRate)
    const segments = analyzeBpmSegments(peaks, audioBuffer.duration, audioBuffer.sampleRate)
    
    const averageBpm = segments.reduce((sum, seg) => sum + seg.bpm, 0) / segments.length
    
    return {
      segments,
      averageBpm: Math.round(averageBpm),
      silenceOffset
    }
  } finally {
    await audioContext.close()
  }
}

function detectPeaks(data: Float32Array, sampleRate: number): number[] {
  const peaks: number[] = []
  const threshold = 0.3
  const minTimeBetweenPeaks = Math.floor(sampleRate * 0.2)
  
  let maxAmplitude = 0
  for (let i = 0; i < data.length; i++) {
    if (Math.abs(data[i]) > maxAmplitude) {
      maxAmplitude = Math.abs(data[i])
    }
  }
  
  const adaptiveThreshold = maxAmplitude * threshold
  
  for (let i = minTimeBetweenPeaks; i < data.length - minTimeBetweenPeaks; i++) {
    const current = Math.abs(data[i])
    
    if (current > adaptiveThreshold) {
      let isPeak = true
      
      for (let j = 1; j <= minTimeBetweenPeaks && isPeak; j++) {
        if (Math.abs(data[i - j]) > current || Math.abs(data[i + j]) > current) {
          isPeak = false
        }
      }
      
      if (isPeak) {
        const timeInSeconds = i / sampleRate
        
        if (peaks.length === 0 || (timeInSeconds - peaks[peaks.length - 1]) >= 0.2) {
          peaks.push(timeInSeconds)
        }
      }
    }
  }
  
  return peaks
}

function analyzeBpmSegments(
  peaks: number[],
  totalDuration: number,
  sampleRate: number
): BpmSegment[] {
  const segments: BpmSegment[] = []
  const segmentDuration = 8
  const numSegments = Math.max(1, Math.ceil(totalDuration / segmentDuration))
  
  for (let i = 0; i < numSegments; i++) {
    const startTime = i * segmentDuration
    const endTime = Math.min((i + 1) * segmentDuration, totalDuration)
    
    const segmentPeaks = peaks.filter(p => p >= startTime && p < endTime)
    
    if (segmentPeaks.length < 2) {
      const prevBpm = segments.length > 0 ? segments[segments.length - 1].bpm : 120
      segments.push({
        startTime,
        endTime,
        bpm: prevBpm
      })
      continue
    }
    
    const intervals: number[] = []
    for (let j = 1; j < segmentPeaks.length; j++) {
      intervals.push(segmentPeaks[j] - segmentPeaks[j - 1])
    }
    
    intervals.sort((a, b) => a - b)
    const medianInterval = intervals[Math.floor(intervals.length / 2)]
    
    let bpm = 60 / medianInterval
    
    while (bpm < 80) bpm *= 2
    while (bpm > 180) bpm /= 2
    
    bpm = Math.round(bpm)
    
    segments.push({
      startTime,
      endTime,
      bpm
    })
  }
  
  return smoothSegments(segments)
}

function detectSilenceOffset(audioBuffer: AudioBuffer): number {
  const sampleRate = audioBuffer.sampleRate
  const channelData = audioBuffer.getChannelData(0)
  
  const silenceThreshold = 0.01
  const windowSize = Math.floor(sampleRate * 0.01)
  
  for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
    let maxAmplitude = 0
    
    for (let j = 0; j < windowSize; j++) {
      const amplitude = Math.abs(channelData[i + j])
      if (amplitude > maxAmplitude) {
        maxAmplitude = amplitude
      }
    }
    
    if (maxAmplitude > silenceThreshold) {
      return i / sampleRate
    }
  }
  
  return 0
}

function smoothSegments(segments: BpmSegment[]): BpmSegment[] {
  if (segments.length <= 2) return segments
  
  for (let i = 1; i < segments.length - 1; i++) {
    const prev = segments[i - 1].bpm
    const current = segments[i].bpm
    const next = segments[i + 1].bpm
    
    const avgNeighbors = (prev + next) / 2
    
    if (Math.abs(current - avgNeighbors) > 10) {
      segments[i].bpm = Math.round(avgNeighbors)
    }
  }
  
  return segments
}

export function getBpmAtTime(segments: BpmSegment[], time: number): number {
  for (const segment of segments) {
    if (time >= segment.startTime && time < segment.endTime) {
      return segment.bpm
    }
  }
  
  return segments[segments.length - 1]?.bpm || 120
}
