import { encrypt, decrypt } from '@/lib/crypto'

const STORAGE_KEY = 'vetpro_weekly_report_config'

export type WeeklyReportConfig = {
  enabled: boolean
  dayOfWeek: number
  hour: number
  minute: number
  phoneNumber: string
  lastSentWeek?: number
  lastSentYear?: number
}

export const DAY_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
}

export async function loadWeeklyReportConfigAsync(): Promise<WeeklyReportConfig | null> {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed.phoneNumber && parsed.phoneNumber.startsWith('v1:')) {
      parsed.phoneNumber = await decrypt(parsed.phoneNumber.slice(3))
    }
    return parsed as WeeklyReportConfig
  } catch {
    return null
  }
}

export async function saveWeeklyReportConfig(config: WeeklyReportConfig): Promise<void> {
  if (typeof window === 'undefined') return
  const toStore = { ...config }
  if (toStore.phoneNumber) {
    const encrypted = await encrypt(toStore.phoneNumber)
    toStore.phoneNumber = `v1:${encrypted}`
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
}

export async function clearWeeklyReportConfig(): Promise<void> {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
