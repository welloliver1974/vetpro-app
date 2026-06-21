'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Receipt, Loader2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import type { jsPDF } from 'jspdf'
import type { Clinic } from '@/hooks/useClinic'
import type { CompletedAppointment } from '@/hooks/useFinances'

type PdfWithAutoTable = jsPDF & { lastAutoTable: { finalY: number } }

type Props = {
  appointment: CompletedAppointment
  clinic: Clinic | undefined
}

const tipoLabel: Record<string, string> = {
  fisio: 'Fisioterapia',
  clinico: 'Clínico',
  externo: 'Externo (Domiciliar)',
}

const pagamentoLabel: Record<string, string> = {
  pix: 'Pix',
  cartao: 'Cartão',
  dinheiro: 'Dinheiro',
}

export function ReceiptPDF({ appointment, clinic }: Props) {
  const [loading, setLoading] = useState(false)

  async function generatePDF() {
    setLoading(true)

    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const pdf = new jsPDF('p', 'mm', 'a4') as PdfWithAutoTable
      const pageW = pdf.internal.pageSize.width
      const contentW = pageW - 40
      const margin = 20
      let y = margin

      function addFooter() {
        const footerY = pdf.internal.pageSize.height - 10
        pdf.setFontSize(8)
        pdf.setTextColor('#94a3b8')
        pdf.text(`Recibo gerado pelo VetPro App em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, pageW / 2, footerY, { align: 'center' })
      }

      // ===== CLINIC HEADER =====
      pdf.setFontSize(20)
      pdf.setTextColor('#1e293b')
      pdf.text(clinic?.nome || 'VetPro', pageW / 2, y, { align: 'center' })
      y += 7
      if (clinic?.endereco) {
        pdf.setFontSize(9)
        pdf.setTextColor('#64748b')
        pdf.text(clinic.endereco, pageW / 2, y, { align: 'center' })
        y += 5
      }
      if (clinic?.telefone) {
        pdf.setFontSize(9)
        pdf.setTextColor('#64748b')
        pdf.text(`Tel: ${clinic.telefone}`, pageW / 2, y, { align: 'center' })
        y += 5
      }

      // Divider line
      y += 3
      pdf.setDrawColor('#1e293b')
      pdf.setLineWidth(0.8)
      pdf.line(margin, y, pageW - margin, y)
      y += 10

      // ===== TITLE =====
      pdf.setFontSize(16)
      pdf.setTextColor('#1e293b')
      pdf.text('RECIBO', pageW / 2, y, { align: 'center' })
      y += 6
      pdf.setFontSize(9)
      pdf.setTextColor('#64748b')
      pdf.text(`Nº ${appointment.id.slice(0, 8).toUpperCase()} | ${format(parseISO(appointment.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageW / 2, y, { align: 'center' })
      y += 12

      // ===== PATIENT INFO =====
      autoTable(pdf, {
        startY: y,
        theme: 'grid',
        headStyles: { fillColor: [100, 116, 139], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        tableLineColor: [226, 232, 240],
        head: [['Dados do Paciente', '']],
        body: [
          ['Paciente', appointment.patients?.nome || '---'],
          ['Espécie', appointment.patients?.especie || '---'],
          ['Tutor', appointment.patients?.tutor_nome || '---'],
          ['Contato', appointment.patients?.tutor_contato || '---'],
        ],
      })

      y = pdf.lastAutoTable.finalY + 10

      // ===== SERVICE DETAILS =====
      autoTable(pdf, {
        startY: y,
        theme: 'grid',
        headStyles: { fillColor: [100, 116, 139], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        tableLineColor: [226, 232, 240],
        head: [['Detalhes do Atendimento', '']],
        body: [
          ['Tipo', tipoLabel[appointment.tipo] || appointment.tipo],
          ['Forma de Pagamento', appointment.forma_pagamento ? pagamentoLabel[appointment.forma_pagamento] || appointment.forma_pagamento : 'Não informado'],
        ],
      })

      y = pdf.lastAutoTable.finalY + 10

      // ===== VALUE =====
      pdf.setDrawColor('#bbf7d0')
      pdf.setFillColor(240, 253, 244)
      pdf.roundedRect(margin, y, contentW, 22, 3, 3, 'FD')
      pdf.setFontSize(9)
      pdf.setTextColor('#64748b')
      pdf.text('Valor Recebido', pageW / 2, y + 7, { align: 'center' })
      pdf.setFontSize(22)
      pdf.setTextColor('#16a34a')
      pdf.text(`R$ ${Number(appointment.valor || 0).toFixed(2)}`, pageW / 2, y + 18, { align: 'center' })
      y += 32

      // ===== SIGNATURE =====
      if (appointment.assinatura_url && y < pdf.internal.pageSize.height - 40) {
        pdf.setFontSize(9)
        pdf.setTextColor('#64748b')
        pdf.text('Assinatura do Tutor', pageW / 2, y, { align: 'center' })
        y += 5

        try {
          const sigImg = new Image()
          sigImg.crossOrigin = 'anonymous'
          sigImg.src = appointment.assinatura_url
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
        } catch {
          // signature image failed to load, skip
        }
      }

      // ===== FOOTER =====
      addFooter()

      pdf.save(`recibo-${appointment.patients?.nome?.toLowerCase().replaceAll(/\s+/g, '-') || 'paciente'}.pdf`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar recibo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={generatePDF} disabled={loading} variant="ghost" size="xs" className="gap-1 text-muted-foreground hover:text-primary">
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Receipt className="h-3.5 w-3.5" />
      )}
      Recibo
    </Button>
  )
}
