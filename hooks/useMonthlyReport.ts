'use client'

import { useState, useEffect } from 'react'
import {
  loadMonthlyReportConfigAsync,
  saveMonthlyReportConfig,
  clearMonthlyReportConfig,
  type MonthlyReportConfig,
} from '@/lib/ai/monthlyReportConfig'
import { fetchMonthlyData, generateMonthlyReport } from '@/lib/ai/monthlyReport'
import { generateMonthlyReportPdf } from '@/lib/ai/monthlyReportPdf'
import { loadNotifyConfigAsync } from '@/lib/notification/config'
import { sendWhatsAppMedia, logNotification } from '@/lib/notification'
import { createClient } from '@/lib/supabase/client'

export function useMonthlyReportConfig() {
  const [config, setConfig] = useState<MonthlyReportConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMonthlyReportConfigAsync().then((cfg) => {
      setConfig(cfg)
      setLoading(false)
    })
  }, [])

  async function save(updated: MonthlyReportConfig) {
    await saveMonthlyReportConfig(updated)
    setConfig(updated)
  }

  function clear() {
    clearMonthlyReportConfig()
    setConfig(null)
  }

  return { config, save, clear, loading }
}

export function useMonthlyReportTrigger() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function triggerCheck() {
    try {
      const reportConfig = await loadMonthlyReportConfigAsync()
      if (!reportConfig || !reportConfig.enabled || !reportConfig.phoneNumber) return

      const now = new Date()
      if (now.getDate() !== reportConfig.dayOfMonth) return
      if (now.getHours() !== reportConfig.hour) return
      if (now.getMinutes() < reportConfig.minute || now.getMinutes() > reportConfig.minute + 5) return

      const month = now.getMonth() // mês anterior (offset 1 em fetchMonthlyData)
      const year = now.getFullYear()
      if (reportConfig.lastSentMonth === month && reportConfig.lastSentYear === year) return

      setGenerating(true)
      setError(null)

      const data = await fetchMonthlyData(now, 1)
      const narrative = await generateMonthlyReport(now, 1)
      const pdf = await generateMonthlyReportPdf(data, narrative)

      const notifyConfig = await loadNotifyConfigAsync()
      if (!notifyConfig || !notifyConfig.enabled) {
        setError('WhatsApp não configurado')
        setGenerating(false)
        return
      }

      const sb = await createClient()
      const { data: { user } } = await sb.auth.getUser()
      const vetId = user?.id || ''

      const result = await sendWhatsAppMedia(
        notifyConfig,
        reportConfig.phoneNumber,
        pdf.base64,
        pdf.filename,
        `📄 Relatório mensal — ${data.monthLabel}`,
      )

      await logNotification({
        vetId,
        tipo: 'whatsapp',
        destinatario: reportConfig.phoneNumber,
        status: result.success ? 'enviado' : 'erro',
        mensagem: narrative,
        erro: result.error,
      })

      if (result.success) {
        const updatedConfig = await loadMonthlyReportConfigAsync()
        if (updatedConfig) {
          updatedConfig.lastSentMonth = month
          updatedConfig.lastSentYear = year
          await saveMonthlyReportConfig(updatedConfig)
        }
      }

      setGenerating(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar relatório mensal'
      setError(msg)
      setGenerating(false)
    }
  }

  return { triggerCheck, generating, error }
}
