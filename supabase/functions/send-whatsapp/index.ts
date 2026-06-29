// Supabase Edge Function: send-whatsapp
// Disparada quando o veterinario cria um agendamento.
// Le a config do Evolution API em profiles.notificacoes_config e envia mensagem
// ao tutor via Evolution API. Grava log em notification_log.
//
// Deploy:
//   supabase functions deploy send-whatsapp --project-ref rhugpobguitqlrfiusmh
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sb_secret_...  (no local de deploy)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function formatDateBR(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const yyyy = d.getUTCFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function formatTimeBR(iso: string): string {
  const d = new Date(iso)
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const min = String(d.getUTCMinutes()).padStart(2, '0')
  return `${hh}:${min}`
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  let out = template
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v)
  }
  return out
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const { appointmentId } = await req.json() as { appointmentId?: string }
    if (!appointmentId) {
      return new Response(JSON.stringify({ error: 'appointmentId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    // 1. Buscar appointment + patient + vet profile
    const { data: appt, error: apptErr } = await supabaseAdmin
      .from('appointments')
      .select('id, paciente_id, data, tipo, vet_id, status')
      .eq('id', appointmentId)
      .single()

    if (apptErr || !appt) {
      await supabaseAdmin.from('notification_log').insert({
        appointment_id: appointmentId,
        tipo_envio: 'whatsapp',
        destinatario: 'unknown',
        status: 'erro',
        erro: `Appointment not found: ${apptErr?.message || 'no data'}`,
      })
      return new Response(JSON.stringify({ error: 'appointment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: patient, error: patErr } = await supabaseAdmin
      .from('patients')
      .select('tutor_nome, tutor_contato, especie')
      .eq('id', appt.paciente_id)
      .single()

    if (patErr || !patient) {
      await supabaseAdmin.from('notification_log').insert({
        vet_id: appt.vet_id,
        appointment_id: appointmentId,
        tipo_envio: 'whatsapp',
        destinatario: 'unknown',
        status: 'erro',
        erro: `Patient not found: ${patErr?.message || 'no data'}`,
      })
      return new Response(JSON.stringify({ error: 'patient not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!patient.tutor_contato) {
      await supabaseAdmin.from('notification_log').insert({
        vet_id: appt.vet_id,
        appointment_id: appointmentId,
        tipo_envio: 'whatsapp',
        destinatario: '',
        status: 'erro',
        erro: 'Patient has no tutor_contato phone',
      })
      return new Response(JSON.stringify({ skipped: 'no contact' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Buscar config do vet
    const { data: profile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('nome, notificacoes_config')
      .eq('id', appt.vet_id)
      .single()

    if (profErr || !profile) {
      return new Response(JSON.stringify({ error: 'vet profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const config = profile.notificacoes_config as {
      enabled?: boolean
      provider?: 'evolution'
      apiUrl?: string
      apiKey?: string
      instanceName?: string
      template?: string
    } | null

    if (!config?.enabled || config.provider !== 'evolution') {
      return new Response(JSON.stringify({ skipped: 'notifications disabled' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!config.apiUrl || !config.apiKey || !config.instanceName) {
      return new Response(JSON.stringify({ error: 'evolution config incomplete' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Montar mensagem
    const tipoLabel = appt.tipo === 'fisio'
      ? 'Fisioterapia'
      : appt.tipo === 'externo'
        ? 'Externo (Domiciliar)'
        : 'Clinico'

    const vars: Record<string, string> = {
      tutor: patient.tutor_nome ?? 'Tutor',
      paciente: '', // preenchido abaixo se houver join
      especie: patient.especie ?? '',
      tipo: tipoLabel,
      data: formatDateBR(appt.data),
      hora: formatTimeBR(appt.data),
      vet: profile.nome ?? 'Veterinario',
      endereco: '', // opcional, sem endereco no schema atual
    }

    // Tentar buscar nome do paciente (pode ter join, mas mantemos separado)
    const { data: patientFull } = await supabaseAdmin
      .from('patients')
      .select('nome')
      .eq('id', appt.paciente_id)
      .single()
    vars.paciente = patientFull?.nome ?? 'Paciente'

    const template = config.template && config.template.trim().length > 0
      ? config.template
      : 'Ola {{tutor}}! Lembrete: {{paciente}} tem consulta de {{tipo}} em {{data}} as {{hora}}.'
    const message = renderTemplate(template, vars)

    // 4. Enviar via Evolution API
    const url = `${config.apiUrl.replace(/\/$/, '')}/message/sendText/${config.instanceName}`
    const phone = patient.tutor_contato.replace(/\D/g, '')

    const evoRes = await fetch(url, {
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

    let evoBody = ''
    try {
      evoBody = await evoRes.text()
    } catch {
      // ignore
    }

    const success = evoRes.ok
    await supabaseAdmin.from('notification_log').insert({
      vet_id: appt.vet_id,
      appointment_id: appointmentId,
      tipo_envio: 'whatsapp',
      destinatario: phone,
      status: success ? 'enviado' : 'erro',
      mensagem: message,
      erro: success ? null : `HTTP ${evoRes.status}: ${evoBody}`.slice(0, 1000),
    })

    return new Response(
      JSON.stringify({ success, status: evoRes.status, body: evoBody.slice(0, 500) }),
      {
        status: success ? 200 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
