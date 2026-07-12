import { encrypt, decrypt } from '@/lib/crypto'

const STORAGE_KEY = 'vetpro_monthly_report_config'

export type MonthlyReportConfig = {
  enabled: boolean
  dayOfMonth: number
  hour: number
  minute: number
  phoneNumber: string
  lastSentMonth?: number
  lastSentYear?: number
}

export async function loadMonthlyReportConfigAsync(): Promise<MonthlyReportConfig | null> {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed.phoneNumber && parsed.phoneNumber.startsWith('v1:')) {
      parsed.phoneNumber = await decrypt(parsed.phoneNumber.slice(3))
    }
    return parsed as MonthlyReportConfig
  } catch {
    return null
  }
}

export async function saveMonthlyReportConfig(config: MonthlyReportConfig): Promise<void> {
  if (typeof window === 'undefined') return
  const toStore = { ...config }
  if (toStore.phoneNumber) {
    const encrypted = await encrypt(toStore.phoneNumber)
    toStore.phoneNumber = `v1:${encrypted}`
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
}

export async function clearMonthlyReportConfig(): Promise<void> {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
