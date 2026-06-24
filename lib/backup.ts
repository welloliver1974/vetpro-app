import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export type BackupData = {
  exported_at: string
  patients: Record<string, unknown>[]
  appointments: Record<string, unknown>[]
  sessions: Record<string, unknown>[]
  equipments: Record<string, unknown>[]
  protocols: Record<string, unknown>[]
  prescriptions: Record<string, unknown>[]
  supplies: Record<string, unknown>[]
  monthly_goals: Record<string, unknown>[]
}

export async function exportBackup(): Promise<BackupData> {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const tables = [
    'patients', 'appointments', 'sessions', 'equipments',
    'protocols', 'prescriptions', 'supplies', 'monthly_goals',
  ] as const

  const result: BackupData = {
    exported_at: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
    patients: [],
    appointments: [],
    sessions: [],
    equipments: [],
    protocols: [],
    prescriptions: [],
    supplies: [],
    monthly_goals: [],
  }

  for (const table of tables) {
    const { data } = await sb.from(table).select('*')
    result[table] = (data || []) as Record<string, unknown>[]
  }

  return result
}

export function downloadBackup(data: BackupData) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `vetpro-backup-${format(new Date(), 'yyyy-MM-dd')}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function importBackup(data: BackupData, onProgress?: (msg: string) => void): Promise<void> {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const tables: { name: keyof BackupData; idField: string }[] = [
    { name: 'patients', idField: 'id' },
    { name: 'appointments', idField: 'id' },
    { name: 'sessions', idField: 'id' },
    { name: 'equipments', idField: 'id' },
    { name: 'protocols', idField: 'id' },
    { name: 'prescriptions', idField: 'id' },
    { name: 'supplies', idField: 'id' },
    { name: 'monthly_goals', idField: 'id' },
  ]

  for (const table of tables) {
    onProgress?.(`Importando ${table.name}...`)
    const rows = data[table.name] as Record<string, unknown>[]
    if (rows.length === 0) continue

    // Upsert each row - use the id from backup to preserve references
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50)
      const { error } = await sb.from(table.name).upsert(batch, {
        onConflict: table.idField,
        ignoreDuplicates: false,
      })
      if (error) throw new Error(`Erro em ${table.name}: ${error.message}`)
    }
  }
}

export function parseBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as BackupData
        if (!data.exported_at || !data.patients) {
          reject(new Error('Arquivo de backup inválido'))
          return
        }
        resolve(data)
      } catch {
        reject(new Error('Arquivo JSON inválido'))
      }
    }
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
    reader.readAsText(file)
  })
}
