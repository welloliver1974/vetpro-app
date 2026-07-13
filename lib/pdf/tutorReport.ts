import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type TutorPatient = {
  nome: string
  especie: string | null
  raca: string | null
  tutor_nome: string | null
  data_nascimento: string | null
  sexo: string | null
}

type TutorSessionPdf = {
  notas_evolucao: string | null
  peso: number | null
  created_at: string
  appointment: { data: string; tipo: string } | null
}

type PdfWithAutoTable = import('jspdf').jsPDF & {
  lastAutoTable: { finalY: number }
}

export type TutorReportPdf = {
  blob: Blob
  filename: string
}

export async function generateTutorReportPdf(
  patient: TutorPatient,
  sessions: TutorSessionPdf[],
): Promise<TutorReportPdf> {
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
    pdf.text(
      `Relatório gerado pelo VetPro App em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
      pageW / 2,
      footerY,
      { align: 'center' },
    )
  }

  // ===== HEADER =====
  pdf.setFontSize(22)
  pdf.setTextColor(primary)
  pdf.text('VetPro — Relatório de Evolução', margin, y)
  y += 10

  pdf.setFontSize(14)
  pdf.setTextColor(dark)
  pdf.text(patient.nome, margin, y)
  y += 7

  pdf.setFontSize(9)
  pdf.setTextColor(muted)
  const info = [
    patient.especie,
    patient.raca,
    patient.sexo === 'macho' ? 'Macho' : patient.sexo === 'femea' ? 'Fêmea' : null,
    patient.tutor_nome ? `Tutor: ${patient.tutor_nome}` : null,
  ]
    .filter(Boolean)
    .join(' | ')
  pdf.text(info, margin, y)
  y += 14

  // ===== STATS =====
  const totalSessions = sessions.length
  const sessionsWithWeight = sessions.filter((s) => s.peso != null)
  const latestWeight =
    sessionsWithWeight.length > 0
      ? sessionsWithWeight[sessionsWithWeight.length - 1].peso
      : null

  autoTable(pdf, {
    startY: y,
    theme: 'grid',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    tableLineColor: [226, 232, 240],
    head: [['Indicador', 'Valor']],
    body: [
      ['Total de sessões', String(totalSessions)],
      [
        'Peso atual',
        latestWeight !== null ? `${latestWeight} kg` : '—',
      ],
      ['Sessões com registro de peso', String(sessionsWithWeight.length)],
    ],
  })
  y = pdf.lastAutoTable.finalY + 12

  // ===== SESSION HISTORY =====
  if (sessions.length > 0) {
    if (y > pdf.internal.pageSize.height - 80) {
      pdf.addPage()
      y = margin
    }

    pdf.setFontSize(13)
    pdf.setTextColor(dark)
    pdf.text('Histórico de Sessões', margin, y)
    y += 8

    for (const session of sessions) {
      const dateStr = session.appointment
        ? format(new Date(session.appointment.data), "d 'de' MMM 'de' yyyy", {
            locale: ptBR,
          })
        : format(new Date(session.created_at), "d 'de' MMM 'de' yyyy", {
            locale: ptBR,
          })

      const tipoLabel =
        session.appointment?.tipo === 'fisio'
          ? 'Fisioterapia'
          : session.appointment?.tipo === 'clinico'
            ? 'Clínico'
            : session.appointment?.tipo === 'externo'
              ? 'Domiciliar'
              : '—'

      if (y > pdf.internal.pageSize.height - 40) {
        pdf.addPage()
        y = margin
      }

      pdf.setFontSize(10)
      pdf.setTextColor(primary)
      pdf.text(`${dateStr} — ${tipoLabel}`, margin, y)
      y += 5

      if (session.peso != null) {
        pdf.setFontSize(8)
        pdf.setTextColor(muted)
        pdf.text(`Peso: ${session.peso} kg`, margin + 2, y)
        y += 4
      }

      if (session.notas_evolucao) {
        pdf.setFontSize(9)
        pdf.setTextColor(dark)
        const lines = pdf.splitTextToSize(
          session.notas_evolucao,
          pageW - margin - 4,
        )
        pdf.text(lines, margin + 2, y)
        y += lines.length * 4.5 + 2
      }

      y += 4
    }
  }

  // ===== FOOTER =====
  addFooter()

  const blob = pdf.output('blob')
  return {
    blob,
    filename: `relatorio-evolucao-${patient.nome.toLowerCase().replace(/\s+/g, '-')}.pdf`,
  }
}
