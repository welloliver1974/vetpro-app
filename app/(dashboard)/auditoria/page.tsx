'use client'

import { useAuditLogs, type AuditLog } from '@/hooks/useAuditLogs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/EmptyState'
import { Loader2, History, Eye } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const acaoColors: Record<string, string> = {
  insert: 'bg-emerald-500/15 text-emerald-400 border-emerald-800',
  update: 'bg-blue-500/15 text-blue-400 border-blue-800',
  delete: 'bg-red-500/15 text-red-400 border-red-800',
}

const acaoLabels: Record<string, string> = {
  insert: 'Criado',
  update: 'Alterado',
  delete: 'Excluído',
}

export default function AuditoriaPage() {
  const { data: logs, isLoading } = useAuditLogs()
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <History className="h-7 w-7 text-primary" />
          Auditoria
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registro de alterações em pacientes, atendimentos e sessões.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : logs?.length ? (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} className="bg-card border-border">
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-[10px] border ${acaoColors[log.acao] || ''}`}>
                      {acaoLabels[log.acao] || log.acao}
                    </Badge>
                    <span className="text-sm font-medium text-card-foreground capitalize">{log.tabela}</span>
                    <span className="text-xs text-muted-foreground">{log.registro_id.slice(0, 8)}...</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                {(log.dados_antigos || log.dados_novos) && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setSelectedLog(log)}
                    className="text-muted-foreground hover:text-primary shrink-0"
                    title="Ver detalhes"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={History}
          title="Nenhum registro de auditoria"
          description="As alterações em pacientes, atendimentos e sessões serão registradas aqui automaticamente."
        />
      )}

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="bg-card border-border text-card-foreground max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Alteração</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] border ${acaoColors[selectedLog.acao] || ''}`}>
                  {acaoLabels[selectedLog.acao] || selectedLog.acao}
                </Badge>
                <span className="text-sm font-medium capitalize">{selectedLog.tabela}</span>
                <span className="text-xs text-muted-foreground">{selectedLog.registro_id}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(parseISO(selectedLog.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              {selectedLog.dados_antigos && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Dados anteriores:</p>
                  <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto text-card-foreground">
                    {JSON.stringify(selectedLog.dados_antigos, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.dados_novos && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Dados novos:</p>
                  <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto text-card-foreground">
                    {JSON.stringify(selectedLog.dados_novos, null, 2)}
                  </pre>
                </div>
              )}
              <div className="flex justify-end pt-2">
                <DialogClose asChild>
                  <Button variant="outline" className="border-border text-foreground">Fechar</Button>
                </DialogClose>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
