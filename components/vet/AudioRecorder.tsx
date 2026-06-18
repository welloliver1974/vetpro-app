'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Square, Loader2 } from 'lucide-react'

type AudioRecorderProps = {
  onTranscription: (text: string) => void
  transcribeFn: (blob: Blob) => Promise<string>
}

export function AudioRecorder({ onTranscription, transcribeFn }: AudioRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunks.current = []
      mediaRecorder.current = new MediaRecorder(stream, { mimeType: 'audio/webm' })

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }

      mediaRecorder.current.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        if (blob.size < 1000) return
        setTranscribing(true)
        try {
          const text = await transcribeFn(blob)
          onTranscription(text)
        } finally {
          setTranscribing(false)
        }
      }

      mediaRecorder.current.start()
      setRecording(true)
    } catch {
      alert('Permissão de microfone negada')
    }
  }

  function stopRecording() {
    mediaRecorder.current?.stop()
    setRecording(false)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={transcribing}
      onClick={recording ? stopRecording : startRecording}
      className={`gap-2 border-border ${recording ? 'text-red-400 border-red-800 bg-red-950/30 animate-pulse' : 'text-foreground'}`}
    >
      {transcribing ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : recording ? (
        <Square className="h-3.5 w-3.5" />
      ) : (
        <Mic className="h-3.5 w-3.5" />
      )}
      {transcribing ? 'Transcrevendo...' : recording ? 'Parar' : 'Gravar Áudio'}
    </Button>
  )
}
