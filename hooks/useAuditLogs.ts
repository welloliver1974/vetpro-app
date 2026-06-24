'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchAuditLogs, logAudit, type AuditLog } from '@/lib/audit'

export function useAuditLogs() {
  return useQuery({
    queryKey: ['audit_logs'],
    queryFn: fetchAuditLogs,
  })
}

export { logAudit, type AuditLog }
