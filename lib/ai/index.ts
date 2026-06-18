import { PROVIDERS, type AiConfig, type ProviderId } from './config'

class AiError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'AiError'
  }
}

function getConfig(): AiConfig {
  if (typeof window === 'undefined') throw new AiError('AI só funciona no cliente')
  const raw = localStorage.getItem('vetpro_ai_config')
  if (!raw) throw new AiError('Configure sua chave de API em Configurações')
  const config = JSON.parse(raw) as AiConfig
  if (!config.apiKey) throw new AiError('API key não configurada')
  return config
}

function getProvider(providerId: ProviderId) {
  const p = PROVIDERS.find((p) => p.id === providerId)
  if (!p) throw new AiError(`Provedor "${providerId}" não encontrado`)
  return p
}

// ─── Chat (Text Generation) ───

export async function chat(prompt: string, systemPrompt?: string): Promise<string> {
  const config = getConfig()
  const provider = getProvider(config.provider)

  switch (config.provider) {
    case 'anthropic': return anthropicChat(config, provider.baseUrl, prompt, systemPrompt)
    case 'gemini': return geminiChat(config, provider.baseUrl, prompt, systemPrompt)
    default: return openaiCompatibleChat(config, provider.baseUrl, prompt, systemPrompt)
  }
}

async function openaiCompatibleChat(
  config: AiConfig, baseUrl: string, prompt: string, systemPrompt?: string
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.chatModel,
      messages: [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        { role: 'user' as const, content: prompt },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new AiError(`Erro ${res.status}: ${err}`, res.status)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

async function anthropicChat(
  config: AiConfig, baseUrl: string, prompt: string, systemPrompt?: string
): Promise<string> {
  const res = await fetch(`${baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.chatModel,
      max_tokens: 4096,
      system: systemPrompt || '',
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new AiError(`Erro ${res.status}: ${err}`, res.status)
  }

  const data = await res.json()
  return data.content?.[0]?.text || ''
}

async function geminiChat(
  config: AiConfig, baseUrl: string, prompt: string, systemPrompt?: string
): Promise<string> {
  const contents: { role: string; parts: { text: string }[] }[] = []
  if (systemPrompt) {
    contents.push({ role: 'user', parts: [{ text: systemPrompt }] })
    contents.push({ role: 'model', parts: [{ text: 'Ok, entendido.' }] })
  }
  contents.push({ role: 'user', parts: [{ text: prompt }] })

  const res = await fetch(
    `${baseUrl}/models/${config.chatModel}:generateContent?key=${config.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new AiError(`Erro ${res.status}: ${err}`, res.status)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ─── Transcription ───

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const config = getConfig()
  const provider = getProvider(config.provider)

  if (!provider.supportsTranscription) {
    throw new AiError(`${provider.label} não suporta transcrição de áudio. Use Groq ou OpenAI.`)
  }

  if (config.provider === 'groq') {
    return groqTranscribe(config, provider.baseUrl, audioBlob)
  }
  if (config.provider === 'openai') {
    return openaiTranscribe(config, provider.baseUrl, audioBlob)
  }
  throw new AiError('Transcrição não disponível para este provedor')
}

async function openaiCompatibleTranscribe(
  config: AiConfig, baseUrl: string, audioBlob: Blob, model: string
): Promise<string> {
  const form = new FormData()
  form.append('file', audioBlob, 'audio.webm')
  form.append('model', model)
  form.append('language', 'pt')

  const res = await fetch(`${baseUrl}/audio/transcriptions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${config.apiKey}` },
    body: form,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new AiError(`Erro ${res.status}: ${err}`, res.status)
  }

  const data = await res.json()
  return data.text || ''
}

async function groqTranscribe(config: AiConfig, baseUrl: string, audioBlob: Blob) {
  return openaiCompatibleTranscribe(config, baseUrl, audioBlob, 'whisper-large-v3')
}

async function openaiTranscribe(config: AiConfig, baseUrl: string, audioBlob: Blob) {
  return openaiCompatibleTranscribe(config, baseUrl, audioBlob, 'whisper-1')
}

// ─── Image Analysis ───

export async function analyzeImage(
  imageUrl: string, prompt: string
): Promise<string> {
  const config = getConfig()
  const provider = getProvider(config.provider)

  switch (config.provider) {
    case 'anthropic':
      return anthropicVision(config, provider.baseUrl, imageUrl, prompt)
    case 'gemini':
      return geminiVision(config, provider.baseUrl, imageUrl, prompt)
    default:
      return openaiCompatibleVision(config, provider.baseUrl, imageUrl, prompt)
  }
}

async function openaiCompatibleVision(
  config: AiConfig, baseUrl: string, imageUrl: string, prompt: string
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.chatModel,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 2048,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new AiError(`Erro ${res.status}: ${err}`, res.status)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

async function anthropicVision(
  config: AiConfig, baseUrl: string, imageUrl: string, prompt: string
): Promise<string> {
  const imageRes = await fetch(imageUrl)
  const imageBuffer = await imageRes.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))

  const res = await fetch(`${baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.chatModel,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64,
              },
            },
          ],
        },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new AiError(`Erro ${res.status}: ${err}`, res.status)
  }

  const data = await res.json()
  return data.content?.[0]?.text || ''
}

async function geminiVision(
  config: AiConfig, baseUrl: string, imageUrl: string, prompt: string
): Promise<string> {
  const imageRes = await fetch(imageUrl)
  const imageBuffer = await imageRes.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))

  const res = await fetch(
    `${baseUrl}/models/${config.chatModel}:generateContent?key=${config.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            { inline_data: { mime_type: 'image/jpeg', data: base64 } },
          ],
        }],
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new AiError(`Erro ${res.status}: ${err}`, res.status)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ─── Test Connection ───

export async function testConnection(config: AiConfig): Promise<boolean> {
  try {
    const provider = getProvider(config.provider)
    if (config.provider === 'gemini') {
      const res = await fetch(
        `${provider.baseUrl}/models/${config.chatModel}:generateContent?key=${config.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Diga "ok" e nada mais' }] }],
          }),
        }
      )
      return res.ok
    }

    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        ...(config.provider === 'anthropic' ? { 'x-api-key': config.apiKey, 'anthropic-version': '2023-06-01' } : {}),
      },
      body: JSON.stringify({
        model: config.chatModel,
        messages: [{ role: 'user', content: 'ok' }],
        max_tokens: 5,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}
