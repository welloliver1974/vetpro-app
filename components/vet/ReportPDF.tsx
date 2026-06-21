'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import type { jsPDF } from 'jspdf'
import type { Patient } from '@/hooks/usePatients'
import type { Session } from '@/hooks/useSessions'

type PdfWithAutoTable = jsPDF & { lastAutoTable: { finalY: number } }

type Props = {
  patient: Patient
  sessions: Session[]
  assinaturaUrl?: string | null
}

export function ReportPDF({ patient, sessions, assinaturaUrl }: Props) {
  const [loading, setLoading] = useState(false)

  async function generatePDF() {
    setLoading(true)

    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const pdf = new jsPDF('p', 'mm', 'a4') as PdfWithAutoTable
      const pageW = pdf.internal.pageSize.width
      const margin = 20
      let y = margin
      const primary = '#6366f1'
      const dark = '#1e293b'
      const muted = '#64748b'

      function addFooter() {
        const footerY = pdf.internal.pageSize.height - 10
        pdf.setFontSize(8)
        pdf.setTextColor(muted)
        pdf.text(`Relatório gerado pelo VetPro App em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, pageW / 2, footerY, { align: 'center' })
      }

      // ===== HEADER =====
      pdf.setFontSize(22)
      pdf.setTextColor(primary)
      pdf.text('VetPro — Relatório de Evolução', margin, y)
      y += 10
      pdf.setFontSize(9)
      pdf.setTextColor(muted)
      pdf.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, margin, y)
      y += 14

      // ===== PATIENT INFO =====
      autoTable(pdf, {
        startY: y,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        tableLineColor: [226, 232, 240],
        head: [['Paciente', 'Detalhes']],
        body: [
          ['Nome', patient.nome],
          ['Espécie', patient.especie || '—'],
          ['Raça', patient.raca || '—'],
          ['Tutor', patient.tutor_nome || '—'],
          ['Contato', patient.tutor_contato || '—'],
        ],
      })

      y = pdf.lastAutoTable.finalY + 12

      // ===== STATS =====
      if (sessions.length > 0) {
        const sessComFotos = sessions.filter((s) => s.foto_urls?.length > 0).length
        const totalMidias = sessions.reduce((sum, s) => sum + (s.foto_urls?.length || 0), 0)

        autoTable(pdf, {
          startY: y,
          theme: 'plain',
          bodyStyles: { fontSize: 9, textColor: [30, 41, 59], halign: 'center' },
          tableLineColor: [226, 232, 240],
          tableLineWidth: 0.5,
          body: [
            [
              { content: `Sessões\n${sessions.length}`, styles: { fontSize: 18, fontStyle: 'bold', textColor: [99, 102, 241], halign: 'center' } },
              { content: `Com Fotos\n${sessComFotos}`, styles: { fontSize: 18, fontStyle: 'bold', textColor: [52, 211, 153], halign: 'center' } },
              { content: `Total Mídias\n${totalMidias}`, styles: { fontSize: 18, fontStyle: 'bold', textColor: [251, 191, 36], halign: 'center' } },
            ],
            [
              { content: '', styles: { fontSize: 7, textColor: muted } },
              { content: '', styles: { fontSize: 7, textColor: muted } },
              { content: '', styles: { fontSize: 7, textColor: muted } },
            ],
          ],
        })

        y = pdf.lastAutoTable.finalY + 12
      }

      // ===== SESSIONS =====
      pdf.setFontSize(13)
      pdf.setTextColor(dark)
      pdf.text('Histórico de Sessões', margin, y)
      y += 8

      if (sessions.length === 0) {
        pdf.setFontSize(10)
        pdf.setTextColor(muted)
        pdf.text('Nenhuma sessão registrada.', margin, y)
      } else {
        const sessBody = sessions.map((s) => [
          format(parseISO(s.created_at), 'dd/MM/yyyy', { locale: ptBR }),
          s.notas || '—',
          s.notas_evolucao || '—',
          s.foto_urls?.length ? `${s.foto_urls.length} foto(s)` : '—',
        ])

        autoTable(pdf, {
          startY: y,
          pageBreak: 'always',
          margin: { top: margin, bottom: margin },
          theme: 'grid',
          headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
          bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          tableLineColor: [226, 232, 240],
          head: [['Data', 'Anotações', 'Evolução', 'Mídias']],
          body: sessBody,
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 60 },
            2: { cellWidth: 60 },
            3: { cellWidth: 25 },
          },
          didDrawPage: () => addFooter(),
        })

        y = pdf.lastAutoTable.finalY + 12
      }

      // ===== SIGNATURE =====
      if (assinaturaUrl) {
        if (y > pdf.internal.pageSize.height - 50) {
          pdf.addPage()
          y = margin
        }

        pdf.setFontSize(9)
        pdf.setTextColor(muted)
        pdf.text('Assinatura do Tutor', pageW / 2, y, { align: 'center' })
        y += 4

        try {
          const sigImg = new Image()
          sigImg.crossOrigin = 'anonymous'
          sigImg.src = assinaturaUrl
          await new Promise((resolve, reject) => {
            sigImg.onload = resolve
            sigImg.onerror = reject
          })
          const maxSigW = 80
          const maxSigH = 20
          let sigW = sigImg.naturalWidth
          let sigH = sigImg.naturalHeight
          if (sigW > maxSigW) { sigH = (sigH * maxSigW) / sigW; sigW = maxSigW }
          if (sigH > maxSigH) { sigW = (sigW * maxSigH) / sigH; sigH = maxSigH }
          pdf.addImage(sigImg, 'PNG', (pageW - sigW) / 2, y, sigW, sigH)
          y += sigH + 12
        } catch {
          pdf.setFontSize(9)
          pdf.setTextColor(muted)
          pdf.text('(assinatura indisponível para impressão)', pageW / 2, y, { align: 'center' })
          y += 8
        }
      }

      // ===== FOOTER =====
      addFooter()

      pdf.save(`evolucao-${patient.nome.toLowerCase().replaceAll(/\s+/g, '-')}.pdf`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
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
  )
}
