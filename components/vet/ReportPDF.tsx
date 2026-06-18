'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Patient } from '@/hooks/usePatients'
import type { Session } from '@/hooks/useSessions'

type Props = {
  patient: Patient
  sessions: Session[]
  assinaturaUrl?: string | null
}

export function ReportPDF({ patient, sessions, assinaturaUrl }: Props) {
  const reportRef = useRef<HTMLDivElement>(null)
  const loading = false

  async function generatePDF() {
    if (!reportRef.current) return

    const { default: jsPDF } = await import('jspdf')
    const { default: html2canvas } = await import('html2canvas')

    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      backgroundColor: '#0f172a',
      useCORS: true,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgWidth = 190
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 10

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
    heightLeft -= pdf.internal.pageSize.height - 20

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
      heightLeft -= pdf.internal.pageSize.height - 20
    }

    pdf.save(`evolucao-${patient.nome.toLowerCase().replace(/\s+/g, '-')}.pdf`)
  }

  return (
    <>
      <Button onClick={generatePDF} disabled={loading}
        className="bg-muted hover:bg-muted text-card-foreground border border-border gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        Relatório PDF
      </Button>

      {/* Hidden report content */}
      <div ref={reportRef} className="absolute -left-[9999px] top-0" style={{ width: '800px', padding: '40px', background: '#0f172a', color: '#e2e8f0', fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', borderBottom: '1px solid #334155', paddingBottom: '16px' }}>
          <div style={{ fontSize: '28px' }}>🐾</div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#818cf8' }}>VetPro</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Relatório de Evolução</p>
          </div>
        </div>

        {/* Patient Info */}
        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#f1f5f9' }}>{patient.nome}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
            <div><span style={{ color: '#94a3b8' }}>Espécie:</span> {patient.especie || '-'}</div>
            <div><span style={{ color: '#94a3b8' }}>Raça:</span> {patient.raca || '-'}</div>
            <div><span style={{ color: '#94a3b8' }}>Tutor:</span> {patient.tutor_nome || '-'}</div>
            <div><span style={{ color: '#94a3b8' }}>Contato:</span> {patient.tutor_contato || '-'}</div>
          </div>
        </div>

        {/* Stats */}
        {sessions.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <div style={{ flex: 1, background: '#1e293b', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#818cf8' }}>{sessions.length}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Sessões</div>
            </div>
            <div style={{ flex: 1, background: '#1e293b', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#34d399' }}>{sessions.filter((s) => s.foto_urls?.length > 0).length}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Com Fotos</div>
            </div>
            <div style={{ flex: 1, background: '#1e293b', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fbbf24' }}>
                {sessions.reduce((sum, s) => sum + (s.foto_urls?.length || 0), 0)}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Total de Mídias</div>
            </div>
          </div>
        )}

        {/* Sessions Timeline */}
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0', color: '#f1f5f9' }}>Histórico de Sessões</h3>
        {sessions.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '14px' }}>Nenhuma sessão registrada.</p>
        ) : (
          <div>
            {sessions.map((session, idx) => (
              <div key={session.id} style={{
                borderLeft: '2px solid #334155',
                paddingLeft: '20px',
                paddingBottom: idx === sessions.length - 1 ? '0' : '20px',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  left: '-6px',
                  top: '4px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#818cf8',
                }} />
                <p style={{ fontSize: '12px', color: '#818cf8', margin: '0 0 4px 0', fontWeight: 'bold' }}>
                  {format(parseISO(session.created_at), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                </p>
                {session.notas && (
                  <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '0 0 4px 0' }}>{session.notas}</p>
                )}
                {session.notas_evolucao && (
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 8px 0', fontStyle: 'italic' }}>
                    Evolução: {session.notas_evolucao}
                  </p>
                )}
                {session.foto_urls && session.foto_urls.length > 0 && (
                  <p style={{ fontSize: '11px', color: '#34d399', margin: 0 }}>
                    📸 {session.foto_urls.length} foto(s)
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Signature */}
        {assinaturaUrl && (
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>Assinatura do Tutor</p>
            <img src={assinaturaUrl} alt="Assinatura" style={{ maxHeight: '60px', maxWidth: '300px' }} />
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #334155', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
          Relatório gerado pelo VetPro App em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
        </div>
      </div>
    </>
  )
}
