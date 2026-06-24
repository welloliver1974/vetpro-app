import { createClient } from '@/lib/supabase/client'
import { renderTemplate, buildTemplateVars } from './templates'
import type { NotificationConfig } from './config'

export type NotifyResult = { success: boolean; error?: string }

export async function sendWhatsApp(
  config: NotificationConfig,
  to: string,
  message: string,
): Promise<NotifyResult> {
  if (!config.apiUrl || !config.apiKey || !config.instanceName) {
    return { success: false, error: 'Configuração incompleta' }
  }

  const url = `${config.apiUrl.replace(/\/$/, '')}/message/sendText/${config.instanceName}`
  const phone = to.replace(/\D/g, '')

  if (!phone) {
    return { success: false, error: 'Número de telefone inválido' }
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.apiKey,
      },
      body: JSON.stringify({
        number: phone,
        text: message,
        options: { delay: 1200, presence: 'composing' },
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { success: false, error: `HTTP ${res.status}: ${text}` }
    }

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro de rede'
    return { success: false, error: msg }
  }
}

export async function logNotification(params: {
  vetId: string
  appointmentId?: string
  tipo: 'whatsapp' | 'email'
  destinatario: string
  status: 'enviado' | 'erro'
  mensagem?: string
  erro?: string
}) {
  try {
    const sb = await createClient()
    await sb.from('notification_log').insert([{
      vet_id: params.vetId,
      appointment_id: params.appointmentId,
      tipo_envio: params.tipo,
      destinatario: params.destinatario,
      status: params.status,
      mensagem: params.mensagem,
      erro: params.erro,
    }])
  } catch {
    // Silently fail - logging shouldn't break the flow
  }
}

export async function sendAppointmentNotification(params: {
  config: NotificationConfig
  appointmentId: string
  tutorNome: string
  tutorContato: string
  pacienteNome: string
  especie: string
  tipo: 'fisio' | 'clinico' | 'externo'
  dataISO: string
  vetNome: string
  vetId: string
  endereco: string | null
}): Promise<NotifyResult> {
  const vars = buildTemplateVars({
    tutorNome: params.tutorNome,
    pacienteNome: params.pacienteNome,
    especie: params.especie,
    tipo: params.tipo,
    dataISO: params.dataISO,
    vetNome: params.vetNome,
    endereco: params.endereco,
  })

  const message = renderTemplate(params.config.template || '', vars)
  const result = await sendWhatsApp(params.config, params.tutorContato, message)

  await logNotification({
    vetId: params.vetId,
    appointmentId: params.appointmentId,
    tipo: 'whatsapp',
    destinatario: params.tutorContato,
    status: result.success ? 'enviado' : 'erro',
    mensagem: message,
    erro: result.error,
  })

  return result
}
