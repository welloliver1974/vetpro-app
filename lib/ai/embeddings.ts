import { PROVIDERS, loadConfigAsync, type AiConfig, type ProviderId } from './config'

class EmbeddingError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'EmbeddingError'
  }
}

async function getConfig(): Promise<AiConfig> {
  const config = await loadConfigAsync()
  if (!config) throw new EmbeddingError('Configure sua chave de API em Configurações')
  if (!config.apiKey) throw new EmbeddingError('API key não configurada')
  return config
}

function getProvider(providerId: ProviderId) {
  const p = PROVIDERS.find((p) => p.id === providerId)
  if (!p) throw new EmbeddingError(`Provedor "${providerId}" não encontrado`)
  return p
}

/**
 * Gera um embedding (vetor numérico) para o texto fornecido.
 * Usa o mesmo provedor/config do chat quando compatível.
 *
 * Provedores com suporte a embedding:
 *  - OpenAI (text-embedding-3-small / text-embedding-3-large)
 *  - Gemini (embedding-001)
 *  - OpenRouter (openai/text-embedding-3-small)
 *
 * Provedores SEM suporte: Groq, Anthropic, Omniroute
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const config = await getConfig()
  const provider = getProvider(config.provider)

  if (!hasEmbeddingCapability(config.provider)) {
    const compatible = PROVIDERS
      .filter((p) => p.models.some((m) => m.capabilities.embedding))
      .map((p) => p.label)
    throw new EmbeddingError(
      `${provider.label} não suporta embeddings. Provedores compatíveis: ${compatible.join(', ')}`
    )
  }

  switch (config.provider) {
    case 'gemini':
      return geminiEmbedding(config, text)
    default:
      return openaiCompatibleEmbedding(config, text)
  }
}

function hasEmbeddingCapability(providerId: ProviderId): boolean {
  const p = PROVIDERS.find((p) => p.id === providerId)
  return p?.models.some((m) => m.capabilities.embedding) ?? false
}

/** Verifica se um provedor tem pelo menos um modelo de embedding disponível */
export function providerSupportsEmbedding(providerId: ProviderId): boolean {
  return hasEmbeddingCapability(providerId)
}

/**
 * Gera embedding via API compatível com OpenAI (POST /embeddings).
 * Funciona para: OpenAI, OpenRouter (com modelos compatíveis).
 */
async function openaiCompatibleEmbedding(config: AiConfig, text: string): Promise<number[]> {
  const provider = getProvider(config.provider)
  const model = config.embeddingModel || getDefaultEmbeddingModel(config.provider)

  if (!model) {
    throw new EmbeddingError(
      `Nenhum modelo de embedding configurado para ${provider.label}`
    )
  }

  const res = await fetch(`${provider.baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: text,
      dimensions: 768,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new EmbeddingError(`Erro ${res.status}: ${err}`, res.status)
  }

  const data = await res.json()
  return data.data?.[0]?.embedding as number[]
}

/**
 * Gera embedding via API Gemini.
 * Endpoint: /models/embedding-001:embedContent?key={apiKey}
 */
async function geminiEmbedding(config: AiConfig, text: string): Promise<number[]> {
  const provider = getProvider(config.provider)
  const model = config.embeddingModel || 'embedding-001'

  const res = await fetch(
    `${provider.baseUrl}/models/${model}:embedContent?key=${config.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${model}`,
        content: {
          parts: [{ text }],
        },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new EmbeddingError(`Erro ${res.status}: ${err}`, res.status)
  }

  const data = await res.json()
  return data.embedding?.values as number[]
}

function getDefaultEmbeddingModel(providerId: ProviderId): string | null {
  const p = PROVIDERS.find((p) => p.id === providerId)
  const embeddingModel = p?.models.find((m) => m.capabilities.embedding)
  return embeddingModel?.id || null
}
