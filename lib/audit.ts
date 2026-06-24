import { createClient } from '@/lib/supabase/client'

export type AuditLog = {
  id: string
  vet_id: string
  tabela: string
  registro_id: string
  acao: 'insert' | 'update' | 'delete'
  dados_antigos: Record<string, unknown> | null
  dados_novos: Record<string, unknown> | null
  created_at: string
}

export async function logAudit(params: {
  tabela: string
  registro_id: string
  acao: 'insert' | 'update' | 'delete'
  dados_antigos?: Record<string, unknown> | null
  dados_novos?: Record<string, unknown> | null
}) {
  try {
    const sb = await createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    await sb.from('audit_logs').insert([{
      vet_id: user.id,
      tabela: params.tabela,
      registro_id: params.registro_id,
      acao: params.acao,
      dados_antigos: params.dados_antigos || null,
      dados_novos: params.dados_novos || null,
    }])
  } catch {
    // Silent fail - audit shouldn't break the app
  }
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const sb = await createClient()
  const { data, error } = await sb
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data as AuditLog[]
}
