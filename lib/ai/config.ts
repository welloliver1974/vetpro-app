export type ProviderId = 'groq' | 'openrouter' | 'openai' | 'anthropic' | 'gemini' | 'omniroute'

export type ModelCapabilities = {
  chat: boolean
  transcription: boolean
  vision: boolean
}

export type ProviderModel = {
  id: string
  label: string
  capabilities: ModelCapabilities
}

export type ProviderConfig = {
  id: ProviderId
  label: string
  baseUrl: string
  apiKeyEnv?: string
  models: ProviderModel[]
  supportsTranscription: boolean
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'groq',
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    supportsTranscription: true,
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'LLaMA 3.3 70B', capabilities: { chat: true, transcription: false, vision: false } },
      { id: 'llama-3.1-8b-instant', label: 'LLaMA 3.1 8B', capabilities: { chat: true, transcription: false, vision: false } },
      { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', capabilities: { chat: true, transcription: false, vision: false } },
      { id: 'gemma2-9b-it', label: 'Gemma 2 9B', capabilities: { chat: true, transcription: false, vision: false } },
      { id: 'llama-3.2-11b-vision-preview', label: 'LLaMA 3.2 11B Vision', capabilities: { chat: true, transcription: false, vision: true } },
      { id: 'whisper-large-v3', label: 'Whisper Large V3', capabilities: { chat: false, transcription: true, vision: false } },
    ],
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    supportsTranscription: false,
    models: [
      { id: 'openai/gpt-4o', label: 'GPT-4o', capabilities: { chat: true, transcription: false, vision: true } },
      { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', capabilities: { chat: true, transcription: false, vision: true } },
      { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', capabilities: { chat: true, transcription: false, vision: true } },
      { id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash', capabilities: { chat: true, transcription: false, vision: true } },
      { id: 'meta-llama/llama-3.3-70b-instruct', label: 'LLaMA 3.3 70B', capabilities: { chat: true, transcription: false, vision: false } },
    ],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    supportsTranscription: true,
    models: [
      { id: 'gpt-4o', label: 'GPT-4o', capabilities: { chat: true, transcription: false, vision: true } },
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini', capabilities: { chat: true, transcription: false, vision: true } },
      { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', capabilities: { chat: true, transcription: false, vision: true } },
      { id: 'whisper-1', label: 'Whisper', capabilities: { chat: false, transcription: true, vision: false } },
    ],
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    supportsTranscription: false,
    models: [
      { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', capabilities: { chat: true, transcription: false, vision: true } },
      { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', capabilities: { chat: true, transcription: false, vision: true } },
      { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus', capabilities: { chat: true, transcription: false, vision: true } },
    ],
  },
  {
    id: 'gemini',
    label: 'Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    supportsTranscription: false,
    models: [
      { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', capabilities: { chat: true, transcription: false, vision: true } },
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', capabilities: { chat: true, transcription: false, vision: true } },
      { id: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash', capabilities: { chat: true, transcription: false, vision: true } },
    ],
  },
  {
    id: 'omniroute',
    label: 'Omniroute',
    baseUrl: 'https://api.omniroute.io/v1',
    supportsTranscription: false,
    models: [
      { id: 'omniroute/default', label: 'Default', capabilities: { chat: true, transcription: false, vision: false } },
    ],
  },
]

export const STORAGE_KEY = 'vetpro_ai_config'

export type AiConfig = {
  provider: ProviderId
  apiKey: string
  chatModel: string
  transcriptionModel: string
}

export function loadConfig(): AiConfig | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AiConfig
  } catch {
    return null
  }
}

export function saveConfig(config: AiConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function clearConfig() {
  localStorage.removeItem(STORAGE_KEY)
}

export function getChatModels(providerId: ProviderId) {
  const p = PROVIDERS.find((p) => p.id === providerId)
  return p?.models.filter((m) => m.capabilities.chat) ?? []
}

export function getTranscriptionModels(providerId: ProviderId) {
  const p = PROVIDERS.find((p) => p.id === providerId)
  return p?.models.filter((m) => m.capabilities.transcription) ?? []
}
