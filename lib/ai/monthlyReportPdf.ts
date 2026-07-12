import type { jsPDF } from 'jspdf'
import type { MonthlyData } from './monthlyReport'

type PdfWithAutoTable = jsPDF & { lastAutoTable: { finalY: number } }

export type MonthlyReportPdf = {
  base64: string
  blob: Blob
  filename: string
}

/** Gera o PDF do relatório mensal (resumo da clínica + narrativa da IA). */
export async function generateMonthlyReportPdf(
  data: MonthlyData,
  narrative: string,
): Promise<MonthlyReportPdf> {
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
      `Relatório mensal gerado pelo VetPro App em ${new Date().toLocaleDateString('pt-BR')}`,
      pageW / 2,
      footerY,
      { align: 'center' },
    )
  }

  // ===== HEADER =====
  pdf.setFontSize(22)
  pdf.setTextColor(primary)
  pdf.text('VetPro — Relatório Mensal', margin, y)
  y += 10
  pdf.setFontSize(11)
  pdf.setTextColor(dark)
  pdf.text(data.monthLabel, margin, y)
  y += 6
  pdf.setFontSize(9)
  pdf.setTextColor(muted)
  pdf.text(
    `Período: ${new Date(data.monthStart).toLocaleDateString('pt-BR')} a ${new Date(data.monthEnd).toLocaleDateString('pt-BR')}`,
    margin,
    y,
  )
  y += 12

  // ===== STATS TABLE =====
  autoTable(pdf, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    tableLineColor: [226, 232, 240],
    head: [['Indicador', 'Valor']],
    body: [
      ['Total de atendimentos', String(data.totalAppointments)],
      ['Faturamento total', `R$ ${data.totalRevenue.toFixed(2)}`],
      ['Fisioterapia', String(data.fisioCount)],
      ['Clínico', String(data.clinicoCount)],
      ['Domiciliar (externo)', String(data.externoCount)],
      ['Pacientes únicos', String(data.uniquePatients)],
    ],
  })
  y = pdf.lastAutoTable.finalY + 12

  // ===== PATIENTS =====
  pdf.setFontSize(13)
  pdf.setTextColor(dark)
  pdf.text('Pacientes atendidos', margin, y)
  y += 8
  if (data.patientNames.length === 0) {
    pdf.setFontSize(10)
    pdf.setTextColor(muted)
    pdf.text('Nenhum paciente atendido neste período.', margin, y)
    y += 8
  } else {
    pdf.setFontSize(10)
    pdf.setTextColor(muted)
    const names = data.patientNames.join(', ')
    const split = pdf.splitTextToSize(names, pageW - margin * 2)
    pdf.text(split, margin, y)
    y += split.length * 5 + 6
  }

  // ===== AI NARRATIVE =====
  if (y > pdf.internal.pageSize.height - 60) {
    pdf.addPage()
    y = margin
  }
  pdf.setFontSize(13)
  pdf.setTextColor(dark)
  pdf.text('Análise do mês', margin, y)
  y += 8
  pdf.setFontSize(10)
  pdf.setTextColor(dark)
  const narrativeLines = pdf.splitTextToSize(narrative || '—', pageW - margin * 2)
  pdf.text(narrativeLines, margin, y)
  y += narrativeLines.length * 5 + 8

  // ===== FOOTER =====
  addFooter()

  const blob = pdf.output('blob')
  const base64 = pdf.output('datauristring')

  return {
    blob,
    base64,
    filename: `relatorio-mensal-${data.year}-${String(data.month).padStart(2, '0')}.pdf`,
  }
}
