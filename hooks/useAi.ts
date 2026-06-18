'use client'

import { useState } from 'react'
import { chat, transcribeAudio, analyzeImage, testConnection } from '@/lib/ai'
import { loadConfig, type AiConfig } from '@/lib/ai/config'

export function useAiConfig() {
  const [config, setConfig] = useState<AiConfig | null>(() => loadConfig())

  function save(updated: AiConfig) {
    localStorage.setItem('vetpro_ai_config', JSON.stringify(updated))
    setConfig(updated)
  }

  function clear() {
    localStorage.removeItem('vetpro_ai_config')
    setConfig(null)
  }

  return { config, save, clear }
}

export function useChat() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate(prompt: string, systemPrompt?: string): Promise<string> {
    setLoading(true)
    setError(null)
    try {
      const result = await chat(prompt, systemPrompt)
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar texto'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { generate, loading, error }
}

export function useTranscription() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function transcribe(audioBlob: Blob): Promise<string> {
    setLoading(true)
    setError(null)
    try {
      const result = await transcribeAudio(audioBlob)
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao transcrever'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { transcribe, loading, error }
}

export function useImageAnalysis() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function analyze(imageUrl: string, prompt: string): Promise<string> {
    setLoading(true)
    setError(null)
    try {
      const result = await analyzeImage(imageUrl, prompt)
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao analisar imagem'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { analyze, loading, error }
}

export function useTestConnection() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<'success' | 'fail' | null>(null)

  async function test(config: AiConfig) {
    setLoading(true)
    setResult(null)
    try {
      const ok = await testConnection(config)
      setResult(ok ? 'success' : 'fail')
      return ok
    } catch {
      setResult('fail')
      return false
    } finally {
      setLoading(false)
    }
  }

  return { test, loading, result }
}
