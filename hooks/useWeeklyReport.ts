'use client'

import { useState, useEffect } from 'react'
import {
  loadWeeklyReportConfigAsync,
  saveWeeklyReportConfig,
  clearWeeklyReportConfig,
  type WeeklyReportConfig,
} from '@/lib/ai/weeklyReportConfig'
import { generateWeeklyReport } from '@/lib/ai/weeklyReport'
import { loadNotifyConfigAsync } from '@/lib/notification/config'
import { sendWhatsApp, logNotification } from '@/lib/notification'
import { createClient } from '@/lib/supabase/client'

export function useWeeklyReportConfig() {
  const [config, setConfig] = useState<WeeklyReportConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWeeklyReportConfigAsync().then((cfg) => {
      setConfig(cfg)
      setLoading(false)
    })
  }, [])

  async function save(updated: WeeklyReportConfig) {
    await saveWeeklyReportConfig(updated)
    setConfig(updated)
  }

  function clear() {
    clearWeeklyReportConfig()
    setConfig(null)
  }

  return { config, save, clear, loading }
}

export function useWeeklyReportTrigger() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function triggerCheck() {
    try {
      const reportConfig = await loadWeeklyReportConfigAsync()
      if (!reportConfig || !reportConfig.enabled || !reportConfig.phoneNumber) return

      const now = new Date()
      const currentDay = now.getDay()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()

      if (currentDay !== reportConfig.dayOfWeek) return
      if (currentHour !== reportConfig.hour) return
      if (currentMinute < reportConfig.minute || currentMinute > reportConfig.minute + 5) return

      const weekNumber = getWeekNumber(now)
      const year = now.getFullYear()
      if (reportConfig.lastSentWeek === weekNumber && reportConfig.lastSentYear === year) return

      setGenerating(true)
      setError(null)

      const report = await generateWeeklyReport()

      const notifyConfig = await loadNotifyConfigAsync()
      if (!notifyConfig || !notifyConfig.enabled) {
        setError('WhatsApp não configurado')
        setGenerating(false)
        return
      }

      const sb = await createClient()
      const { data: { user } } = await sb.auth.getUser()
      const vetId = user?.id || ''

      const result = await sendWhatsApp(notifyConfig, reportConfig.phoneNumber, report)

      await logNotification({
        vetId,
        tipo: 'whatsapp',
        destinatario: reportConfig.phoneNumber,
        status: result.success ? 'enviado' : 'erro',
        mensagem: report,
        erro: result.error,
      })

      if (result.success) {
        const updatedConfig = await loadWeeklyReportConfigAsync()
        if (updatedConfig) {
          updatedConfig.lastSentWeek = weekNumber
          updatedConfig.lastSentYear = year
          await saveWeeklyReportConfig(updatedConfig)
        }
      }

      setGenerating(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar relatório semanal'
      setError(msg)
      setGenerating(false)
    }
  }

  return { triggerCheck, generating, error }
}

function getWeekNumber(d: Date): number {
  const startOfYear = new Date(d.getFullYear(), 0, 1)
  const monday = new Date(d)
  const dayOfWeek = d.getDay()
  monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  const diff = monday.getTime() - startOfYear.getTime()
  return Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7)
}
