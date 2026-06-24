import { encrypt, decrypt } from '@/lib/crypto'

const STORAGE_KEY = 'vetpro_notify_config'

export type NotificationConfig = {
  enabled: boolean
  provider: 'evolution'
  apiUrl: string
  apiKey: string
  instanceName: string
  template: string
}

export const DEFAULT_TEMPLATE = '🐾 Olá {{tutor}}! Lembrete: {{paciente}} tem consulta de {{tipo}} amanhã às {{hora}}.'

export function loadNotifyConfig(): NotificationConfig | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed.apiKey && parsed.apiKey.startsWith('v1:')) {
      parsed.apiKey = parsed.apiKey.slice(3)
    }
    return parsed as NotificationConfig
  } catch {
    return null
  }
}

export async function loadNotifyConfigAsync(): Promise<NotificationConfig | null> {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed.apiKey && parsed.apiKey.startsWith('v1:')) {
      const encryptedKey = parsed.apiKey.slice(3)
      parsed.apiKey = await decrypt(encryptedKey)
    }
    return parsed as NotificationConfig
  } catch {
    return null
  }
}

export async function saveNotifyConfig(config: NotificationConfig): Promise<void> {
  if (typeof window === 'undefined') return
  const toStore = { ...config }
  if (toStore.apiKey) {
    const encrypted = await encrypt(toStore.apiKey)
    toStore.apiKey = `v1:${encrypted}`
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
}

export function clearNotifyConfig(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
