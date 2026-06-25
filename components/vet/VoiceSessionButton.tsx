'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Square, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'

export interface VoiceSessionResult {
  notas: string
  notasEvolucao: string | null
  custo: string
  peso: string
  protocoloNome: string | null
}

interface VoiceSessionButtonProps {
  transcribeFn: (blob: Blob) => Promise<string>
  parseFn: (transcript: string) => Promise<{
    notas: string | null
    notas_evolucao: string | null
    custo: number | null
    peso: number | null
    protocolo: string | null
  }>
  onResult: (result: VoiceSessionResult) => void
}

type Stage = 'idle' | 'recording' | 'transcribing' | 'parsing' | 'done'

export function VoiceSessionButton({
  transcribeFn,
  parseFn,
  onResult,
}: VoiceSessionButtonProps) {
  const [stage, setStage] = useState<Stage>('idle')
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const stopRecording = useCallback(() => {
    mediaRecorder.current?.stop()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    setStage('transcribing')
  }, [])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunks.current = []

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorder.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        if (blob.size < 1000) {
          setStage('idle')
          return
        }

        setStage('transcribing')
        try {
          const text = await transcribeFn(blob)
          if (!text.trim()) {
            setStage('idle')
            return
          }

          setStage('parsing')
          const parsed = await parseFn(text)

          setStage('done')
          const result: VoiceSessionResult = {
            notas: parsed.notas || text,
            notasEvolucao: parsed.notas_evolucao,
            custo: parsed.custo != null ? String(parsed.custo) : '',
            peso: parsed.peso != null ? String(parsed.peso) : '',
            protocoloNome: parsed.protocolo || null,
          }
          onResult(result)
        } finally {
          setTimeout(() => setStage('idle'), 1500)
        }
      }

      recorder.start()
      setStage('recording')
    } catch {
      setStage('idle')
    }
  }

  function handleClick() {
    if (stage === 'recording') {
      stopRecording()
    } else if (stage === 'idle') {
      startRecording()
    }
  }

  const labels: Record<Stage, string> = {
    idle: 'Sessão por Voz',
    recording: 'Parar Gravação',
    transcribing: 'Transcrevendo...',
    parsing: 'Analisando com IA...',
    done: 'Pronto!',
  }

  const icons: Record<Stage, typeof Mic> = {
    idle: Sparkles,
    recording: Square,
    transcribing: Loader2,
    parsing: Loader2,
    done: CheckCircle2,
  }

  const Icon = icons[stage]

  return (
    <Button
      type="button"
      variant={stage === 'recording' ? 'destructive' : stage === 'done' ? 'default' : 'outline'}
      size="sm"
      disabled={stage === 'transcribing' || stage === 'parsing'}
      onClick={handleClick}
      className={`gap-2 w-full sm:w-auto ${
        stage === 'recording'
          ? 'animate-pulse border-red-800'
          : stage === 'idle'
          ? 'border-emerald-700 text-emerald-400 hover:bg-emerald-950/30'
          : ''
      }`}
    >
      {stage === 'transcribing' || stage === 'parsing' ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      <span className="text-xs">
        {labels[stage]}
        {stage === 'parsing' && (
          <span className="ml-1 inline-block w-1.5 h-3 bg-current animate-pulse rounded-sm align-middle" />
        )}
      </span>
    </Button>
  )
}
