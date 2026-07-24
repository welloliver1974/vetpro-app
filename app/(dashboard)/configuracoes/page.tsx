'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { PROVIDERS, getChatModels, type ProviderId, type AiConfig } from '@/lib/ai/config'
import { providerSupportsEmbedding } from '@/lib/ai/embeddings'
import { testConnection } from '@/lib/ai'
import { useAiConfig } from '@/hooks/useAi'
import { Loader2, CheckCircle2, XCircle, Brain, Key, Save, Trash2, MessageCircle, MessageSquare, Download, Upload, CalendarClock, Search, ChevronDown } from 'lucide-react'
import { useNotificationConfig } from '@/hooks/useNotificationConfig'
import { DEFAULT_TEMPLATE, type NotificationConfig } from '@/lib/notification/config'
import { useWeeklyReportConfig } from '@/hooks/useWeeklyReport'
import { DAY_LABELS, type WeeklyReportConfig } from '@/lib/ai/weeklyReportConfig'
import { useMonthlyReportConfig } from '@/hooks/useMonthlyReport'
import type { MonthlyReportConfig } from '@/lib/ai/monthlyReportConfig'

export default function ConfiguracoesPage() {
  const { config, save, clear, loading } = useAiConfig()
  const notify = useNotificationConfig()

  const [provider, setProvider] = useState<ProviderId>('groq')
  const [apiKey, setApiKey] = useState('')
  const [chatModel, setChatModel] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null)

  // Notification state
  const [notifyEnabled, setNotifyEnabled] = useState(false)
  const [notifyApiUrl, setNotifyApiUrl] = useState('')
  const [notifyApiKey, setNotifyApiKey] = useState('')
  const [notifyInstanceName, setNotifyInstanceName] = useState('')
  const [notifyTemplate, setNotifyTemplate] = useState('')
  const [notifyTestSending, setNotifyTestSending] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState('')

  // Weekly Report state
  const weeklyReport = useWeeklyReportConfig()
  const [reportEnabled, setReportEnabled] = useState(false)
  const [reportDayOfWeek, setReportDayOfWeek] = useState('1')
  const [reportHour, setReportHour] = useState('18')
  const [reportMinute, setReportMinute] = useState('0')
  const [reportPhoneNumber, setReportPhoneNumber] = useState('')

  // Monthly Report state
  const monthlyReport = useMonthlyReportConfig()
  const [reportMonthlyEnabled, setReportMonthlyEnabled] = useState(false)
  const [reportMonthlyDay, setReportMonthlyDay] = useState('1')
  const [reportMonthlyHour, setReportMonthlyHour] = useState('18')
  const [reportMonthlyMinute, setReportMonthlyMinute] = useState('0')
  const [reportMonthlyPhoneNumber, setReportMonthlyPhoneNumber] = useState('')

  // Backfill state
  const [backfilling, setBackfilling] = useState(false)
  const [backfillProgress, setBackfillProgress] = useState({ done: 0, total: 0, current: '' })
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggleSection = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const availableModels = getChatModels(provider)
  const currentProvider = PROVIDERS.find((p) => p.id === provider)
  const canTranscribe = currentProvider?.supportsTranscription ?? false

  useEffect(() => {
    if (config) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProvider(config.provider)
      setApiKey(config.apiKey)
      setChatModel(config.chatModel)
    }
  }, [config])

  useEffect(() => {
    if (notify.config) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotifyEnabled(notify.config.enabled)
      setNotifyApiUrl(notify.config.apiUrl)
      setNotifyApiKey(notify.config.apiKey)
      setNotifyInstanceName(notify.config.instanceName)
      setNotifyTemplate(notify.config.template)
    }
  }, [notify.config])

  useEffect(() => {
    if (weeklyReport.config) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReportEnabled(weeklyReport.config.enabled)
      setReportDayOfWeek(String(weeklyReport.config.dayOfWeek))
      setReportHour(String(weeklyReport.config.hour))
      setReportMinute(String(weeklyReport.config.minute))
      setReportPhoneNumber(weeklyReport.config.phoneNumber)
    }
  }, [weeklyReport.config])

  useEffect(() => {
    if (monthlyReport.config) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReportMonthlyEnabled(monthlyReport.config.enabled)
      setReportMonthlyDay(String(monthlyReport.config.dayOfMonth))
      setReportMonthlyHour(String(monthlyReport.config.hour))
      setReportMonthlyMinute(String(monthlyReport.config.minute))
      setReportMonthlyPhoneNumber(monthlyReport.config.phoneNumber)
    }
  }, [monthlyReport.config])

  async function handleSave() {
    if (!apiKey.trim()) {
      toast.error('Informe a chave de API')
      return
    }
    if (!chatModel) {
      toast.error('Selecione um modelo')
      return
    }
    await save({
      provider,
      apiKey: apiKey.trim(),
      chatModel,
      transcriptionModel: 'whisper-large-v3',
    })
    toast.success('Configuração salva!')
  }

  async function handleTest() {
    const cfg: AiConfig = { provider, apiKey: apiKey.trim(), chatModel, transcriptionModel: 'whisper-large-v3' }
    setTesting(true)
    setTestResult(null)
    try {
      const ok = await testConnection(cfg)
      setTestResult(ok ? 'success' : 'fail')
      if (ok) toast.success('Conexão OK!')
      else toast.error('Falha na conexão')
    } catch {
      setTestResult('fail')
      toast.error('Erro ao testar conexão')
    } finally {
      setTesting(false)
    }
  }

  function handleClear() {
    clear()
    setProvider('groq')
    setApiKey('')
    setChatModel('')
    setTestResult(null)
    toast.success('Configuração removida')
  }

  return (
    <div className="p-4 md:p-8">

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Brain className="h-7 w-7 text-primary" />
          Configurações de IA
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Escolha seu provedor de IA e insira sua chave de API. Os dados ficam salvos apenas no seu navegador.
        </p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Provedor */}
        <Card className="bg-card border-border">
          <CardHeader className="cursor-pointer select-none" onClick={() => toggleSection('provider')}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-card-foreground text-lg">Provedor</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Selecione o serviço de IA que deseja utilizar
                </CardDescription>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground mt-1 transition-transform ${!collapsed.provider ? '' : '-rotate-90'}`} />
            </div>
          </CardHeader>
          {!collapsed.provider && <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Provedor</Label>
              <Select value={provider} disabled={loading} onValueChange={(v) => {
                setProvider(v as ProviderId)
                const models = getChatModels(v as ProviderId)
                if (models.length > 0) setChatModel(models[0].id)
              }}>
                <SelectTrigger className="bg-muted border-border text-card-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border text-card-foreground">
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Chave de API</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`sk-... (${currentProvider?.label})`}
                  className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Sua chave fica armazenada apenas no navegador ({currentProvider?.baseUrl})
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Modelo de Chat</Label>
              <Select value={chatModel} onValueChange={setChatModel}>
                <SelectTrigger className="bg-muted border-border text-card-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border text-card-foreground">
                  {availableModels.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                      {m.capabilities.vision && ' 👁️'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {chatModel && (
                <p className="text-xs text-muted-foreground">
                  {availableModels.find((m) => m.id === chatModel)?.capabilities.vision
                    ? 'Suporta análise de imagens'
                    : 'Apenas texto'}
                </p>
              )}
            </div>

            {canTranscribe && (
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Transcrição de áudio disponível para este provedor
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90 text-white gap-2">
                <Save className="h-4 w-4" /> {loading ? 'Carregando...' : 'Salvar'}
              </Button>
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={testing || !apiKey}
                className="border-border text-foreground gap-2"
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : testResult === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : testResult === 'fail' ? (
                  <XCircle className="h-4 w-4 text-red-400" />
                ) : null}
                Testar Conexão
              </Button>
              {config && (
                <Button variant="ghost" onClick={handleClear} className="text-muted-foreground hover:text-red-400 gap-2">
                  <Trash2 className="h-4 w-4" /> Limpar
                </Button>
              )}
            </div>
          </CardContent>}
        </Card>

        {/* Notificações WhatsApp */}
        <Card className="bg-card border-border">
          <CardHeader className="cursor-pointer select-none" onClick={() => toggleSection('whatsapp')}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-card-foreground text-lg flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-emerald-400" />
                  Notificações WhatsApp
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Aviso automático ao tutor quando um agendamento for criado. Requer uma instância Evolution API.
                </CardDescription>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground mt-1 transition-transform ${!collapsed.whatsapp ? '' : '-rotate-90'}`} />
            </div>
          </CardHeader>
          {!collapsed.whatsapp && <CardContent className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyEnabled}
                onChange={(e) => setNotifyEnabled(e.target.checked)}
                className="rounded border-border accent-primary"
              />
              <span className="text-sm text-foreground font-medium">Ativar notificações WhatsApp</span>
            </label>

            <div className="space-y-2">
              <Label className="text-foreground">URL da API</Label>
              <Input
                type="url"
                value={notifyApiUrl}
                onChange={(e) => setNotifyApiUrl(e.target.value)}
                placeholder="https://evo.seusite.com.br"
                className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Chave de API</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={notifyApiKey}
                  onChange={(e) => setNotifyApiKey(e.target.value)}
                  placeholder="Chave da instância Evolution API"
                  className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Nome da Instância</Label>
              <Input
                type="text"
                value={notifyInstanceName}
                onChange={(e) => setNotifyInstanceName(e.target.value)}
                placeholder="Ex: vetpro"
                className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Template da Mensagem</Label>
              <textarea
                value={notifyTemplate}
                onChange={(e) => setNotifyTemplate(e.target.value)}
                placeholder={DEFAULT_TEMPLATE}
                rows={3}
                className="w-full rounded-lg border border-border bg-muted text-card-foreground placeholder:text-muted-foreground px-3 py-2 text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Use {'{{tutor}}'}, {'{{paciente}}'}, {'{{tipo}}'}, {'{{data}}'}, {'{{hora}}'}, {'{{vet}}'}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={async () => {
                  if (!notifyApiUrl || !notifyApiKey || !notifyInstanceName) {
                    toast.error('Preencha URL, chave e instância')
                    return
                  }
                  const cfg: NotificationConfig = {
                    enabled: notifyEnabled,
                    provider: 'evolution',
                    apiUrl: notifyApiUrl.trim(),
                    apiKey: notifyApiKey.trim(),
                    instanceName: notifyInstanceName.trim(),
                    template: notifyTemplate || DEFAULT_TEMPLATE,
                  }
                  await notify.save(cfg)
                  toast.success('Configuração salva!')
                }}
                disabled={notify.loading}
                className="bg-primary hover:bg-primary/90 text-white gap-2"
              >
                <Save className="h-4 w-4" /> Salvar
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  if (!notifyApiUrl || !notifyApiKey) {
                    toast.error('Configure a URL e chave primeiro')
                    return
                  }
                  setNotifyTestSending(true)
                  try {
                    const { sendWhatsApp } = await import('@/lib/notification')
                    const result = await sendWhatsApp(
                      { enabled: true, provider: 'evolution', apiUrl: notifyApiUrl.trim(), apiKey: notifyApiKey.trim(), instanceName: notifyInstanceName.trim(), template: '' },
                      '5511999999999',
                      '🔧 Teste de configuração do VetPro App. Se você recebeu esta mensagem, a integração está funcionando!'
                    )
                    if (result.success) {
                      toast.success('Mensagem de teste enviada! Verifique seu WhatsApp.')
                    } else {
                      toast.error(`Erro: ${result.error}`)
                    }
                  } catch {
                    toast.error('Erro ao enviar teste')
                  } finally {
                    setNotifyTestSending(false)
                  }
                }}
                disabled={notifyTestSending || !notifyApiUrl}
                className="border-border text-foreground gap-2"
              >
                {notifyTestSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                Testar
              </Button>
              {notify.config && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    notify.clear()
                    setNotifyEnabled(false)
                    setNotifyApiUrl('')
                    setNotifyApiKey('')
                    setNotifyInstanceName('')
                    setNotifyTemplate('')
                    toast.success('Configuração removida')
                  }}
                  className="text-muted-foreground hover:text-red-400 gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Limpar
                </Button>
              )}
            </div>
          </CardContent>}
        </Card>

        {/* Relatório Semanal */}
        <Card className="bg-card border-border">
          <CardHeader className="cursor-pointer select-none" onClick={() => toggleSection('weekly')}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-card-foreground text-lg flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-primary" />
                  Relatório Semanal Automático
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Geração automática de relatório semanal com IA e envio por WhatsApp.
                </CardDescription>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground mt-1 transition-transform ${!collapsed.weekly ? '' : '-rotate-90'}`} />
            </div>
          </CardHeader>
          {!collapsed.weekly && <CardContent className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reportEnabled}
                onChange={(e) => setReportEnabled(e.target.checked)}
                className="rounded border-border accent-primary"
              />
              <span className="text-sm text-foreground font-medium">Ativar relatório semanal</span>
            </label>

            <div className="space-y-2">
              <Label className="text-foreground">Dia da semana</Label>
              <Select value={reportDayOfWeek} onValueChange={setReportDayOfWeek}>
                <SelectTrigger className="bg-muted border-border text-card-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border text-card-foreground">
                  {[1, 2, 3, 4, 5, 6].map((d) => (
                    <SelectItem key={d} value={String(d)}>{DAY_LABELS[d]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Hora</Label>
                <Select value={reportHour} onValueChange={setReportHour}>
                  <SelectTrigger className="bg-muted border-border text-card-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border text-card-foreground max-h-60">
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={String(i)}>{String(i).padStart(2, '0')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Minuto</Label>
                <Select value={reportMinute} onValueChange={setReportMinute}>
                  <SelectTrigger className="bg-muted border-border text-card-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border text-card-foreground">
                    {['0', '15', '30', '45'].map((m) => (
                      <SelectItem key={m} value={m}>{m.padStart(2, '0')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Número WhatsApp (destino)</Label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="tel"
                  value={reportPhoneNumber}
                  onChange={(e) => setReportPhoneNumber(e.target.value)}
                  placeholder="5511999999999"
                  className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                O relatório será gerado e enviado automaticamente para este WhatsApp.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={async () => {
                  if (!reportPhoneNumber.trim()) {
                    toast.error('Informe o número de WhatsApp')
                    return
                  }
                  const cfg: WeeklyReportConfig = {
                    enabled: reportEnabled,
                    dayOfWeek: Number(reportDayOfWeek),
                    hour: Number(reportHour),
                    minute: Number(reportMinute),
                    phoneNumber: reportPhoneNumber.trim(),
                  }
                  await weeklyReport.save(cfg)
                  toast.success('Configuração salva!')
                }}
                disabled={weeklyReport.loading}
                className="bg-primary hover:bg-primary/90 text-white gap-2"
              >
                <Save className="h-4 w-4" /> Salvar
              </Button>
              {weeklyReport.config && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    weeklyReport.clear()
                    setReportEnabled(false)
                    setReportDayOfWeek('1')
                    setReportHour('18')
                    setReportMinute('0')
                    setReportPhoneNumber('')
                    toast.success('Configuração removida')
                  }}
                  className="text-muted-foreground hover:text-red-400 gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Limpar
                </Button>
              )}
            </div>

            {weeklyReport.config?.lastSentWeek && (
              <p className="text-xs text-muted-foreground">
                Último envio: Semana {weeklyReport.config.lastSentWeek}/{weeklyReport.config.lastSentYear}
              </p>
            )}
          </CardContent>}
        </Card>

        {/* Relatório Mensal */}
        <Card className="bg-card border-border">
          <CardHeader className="cursor-pointer select-none" onClick={() => toggleSection('monthly')}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-card-foreground text-lg flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-primary" />
                  Relatório Mensal Automático (PDF)
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Geração automática de relatório mensal em PDF com IA e envio por WhatsApp.
                </CardDescription>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground mt-1 transition-transform ${!collapsed.monthly ? '' : '-rotate-90'}`} />
            </div>
          </CardHeader>
          {!collapsed.monthly && <CardContent className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reportMonthlyEnabled}
                onChange={(e) => setReportMonthlyEnabled(e.target.checked)}
                className="rounded border-border accent-primary"
              />
              <span className="text-sm text-foreground font-medium">Ativar relatório mensal</span>
            </label>

            <div className="space-y-2">
              <Label className="text-foreground">Dia do mês</Label>
              <Select value={reportMonthlyDay} onValueChange={setReportMonthlyDay}>
                <SelectTrigger className="bg-muted border-border text-card-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border text-card-foreground max-h-60">
                  {Array.from({ length: 28 }, (_, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{String(i + 1).padStart(2, '0')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                O relatório refere-se sempre ao mês anterior ao selecionado.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Hora</Label>
                <Select value={reportMonthlyHour} onValueChange={setReportMonthlyHour}>
                  <SelectTrigger className="bg-muted border-border text-card-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border text-card-foreground max-h-60">
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={String(i)}>{String(i).padStart(2, '0')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Minuto</Label>
                <Select value={reportMonthlyMinute} onValueChange={setReportMonthlyMinute}>
                  <SelectTrigger className="bg-muted border-border text-card-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border text-card-foreground">
                    {['0', '15', '30', '45'].map((m) => (
                      <SelectItem key={m} value={m}>{m.padStart(2, '0')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Número WhatsApp (destino)</Label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="tel"
                  value={reportMonthlyPhoneNumber}
                  onChange={(e) => setReportMonthlyPhoneNumber(e.target.value)}
                  placeholder="5511999999999"
                  className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                O relatório em PDF será gerado e enviado automaticamente para este WhatsApp.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={async () => {
                  if (!reportMonthlyPhoneNumber.trim()) {
                    toast.error('Informe o número de WhatsApp')
                    return
                  }
                  const cfg: MonthlyReportConfig = {
                    enabled: reportMonthlyEnabled,
                    dayOfMonth: Number(reportMonthlyDay),
                    hour: Number(reportMonthlyHour),
                    minute: Number(reportMonthlyMinute),
                    phoneNumber: reportMonthlyPhoneNumber.trim(),
                  }
                  await monthlyReport.save(cfg)
                  toast.success('Configuração salva!')
                }}
                disabled={monthlyReport.loading}
                className="bg-primary hover:bg-primary/90 text-white gap-2"
              >
                <Save className="h-4 w-4" /> Salvar
              </Button>
              {monthlyReport.config && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    monthlyReport.clear()
                    setReportMonthlyEnabled(false)
                    setReportMonthlyDay('1')
                    setReportMonthlyHour('18')
                    setReportMonthlyMinute('0')
                    setReportMonthlyPhoneNumber('')
                    toast.success('Configuração removida')
                  }}
                  className="text-muted-foreground hover:text-red-400 gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Limpar
                </Button>
              )}
            </div>

            {monthlyReport.config?.lastSentMonth && (
              <p className="text-xs text-muted-foreground">
                Último envio: {monthlyReport.config.lastSentMonth}/{monthlyReport.config.lastSentYear}
              </p>
            )}
          </CardContent>}
        </Card>

        {/* Backup */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground text-lg flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Backup de Dados
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Exporte todos os seus dados como JSON ou importe um backup anterior.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={async () => {
                  try {
                    const { exportBackup, downloadBackup } = await import('@/lib/backup')
                    const data = await exportBackup()
                    downloadBackup(data)
                    toast.success('Backup exportado com sucesso!')
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Erro ao exportar')
                  }
                }}
                className="bg-primary hover:bg-primary/90 text-white gap-2"
              >
                <Download className="h-4 w-4" /> Exportar JSON
              </Button>
              <Button
                variant="outline"
                disabled={importing}
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = '.json'
                  input.onchange = async () => {
                    const file = input.files?.[0]
                    if (!file) return
                    setImporting(true)
                    setImportProgress('Lendo arquivo...')
                    try {
                      const { parseBackupFile, importBackup } = await import('@/lib/backup')
                      const data = await parseBackupFile(file)
                      setImportProgress(`Importando ${data.patients.length} pacientes...`)
                      await importBackup(data, (msg) => setImportProgress(msg))
                      toast.success('Backup importado com sucesso!')
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Erro ao importar')
                    } finally {
                      setImporting(false)
                      setImportProgress('')
                    }
                  }
                  input.click()
                }}
                className="border-border text-foreground gap-2"
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Importar JSON
              </Button>
            </div>
            {importProgress && (
              <p className="text-xs text-muted-foreground">{importProgress}</p>
            )}
          </CardContent>
        </Card>

        {/* Busca Inteligente */}
        <Card className="bg-card border-border">
          <CardHeader className="cursor-pointer select-none" onClick={() => toggleSection('smartSearch')}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-card-foreground text-lg flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Busca Inteligente
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Busca por similaridade semântica em linguagem natural na página de pacientes.
                </CardDescription>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground mt-1 transition-transform ${!collapsed.smartSearch ? '' : '-rotate-90'}`} />
            </div>
          </CardHeader>
          {!collapsed.smartSearch && <CardContent className="space-y-4">
            {(() => {
              const supportsEmbedding = providerSupportsEmbedding(config?.provider || 'groq')
              const compatibleProviders = PROVIDERS
                .filter((p) => p.models.some((m) => m.capabilities.embedding))
                .map((p) => p.label)
              return (
                <>
                  <div className={`rounded-lg p-3 border ${supportsEmbedding ? 'bg-emerald-950/20 border-emerald-800/30' : 'bg-amber-950/20 border-amber-800/30'}`}>
                    <p className={`text-sm flex items-center gap-2 ${supportsEmbedding ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {supportsEmbedding ? (
                        <><CheckCircle2 className="h-4 w-4" /> Provedor compatível com embeddings</>
                      ) : (
                        <><XCircle className="h-4 w-4" /> Provedor atual não suporta embeddings</>
                      )}
                    </p>
                    {!supportsEmbedding && config && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Provedores compatíveis: {compatibleProviders.join(', ')}.
                      </p>
                    )}
                    {!config && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Configure uma chave de API acima para ativar. Provedores compatíveis: {compatibleProviders.join(', ')}.
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ao digitar no campo de busca da página de pacientes, o app gera um embedding da consulta
                    e busca por similaridade semântica no banco de dados. Se o provedor não suportar embeddings,
                    a busca volta ao filtro tradicional por nome/tutor.
                  </p>

                  {config && supportsEmbedding && (
                    <div className="pt-2 space-y-3">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={backfilling}
                        onClick={async () => {
                          setBackfilling(true)
                          setBackfillProgress({ done: 0, total: 0, current: '' })
                          try {
                            const { createClient } = await import('@/lib/supabase/client')
                            const sb = await createClient()
                            const { generateEmbedding } = await import('@/lib/ai/embeddings')

                            // Buscar pacientes sem embedding
                            const { data: patients, error } = await sb
                              .from('patients')
                              .select('id, nome, especie, raca, tutor_nome, queixa_principal, historico_doenca_atual, observacoes')
                              .is('embedding', null)

                            if (error) throw error
                            if (!patients?.length) {
                              toast.success('Todos os pacientes já possuem embeddings!')
                              setBackfilling(false)
                              return
                            }

                            setBackfillProgress({ done: 0, total: patients.length, current: '' })
                            let done = 0
                            let failed = 0

                            for (const patient of patients) {
                              const textForEmbedding = [
                                patient.nome,
                                patient.especie,
                                patient.raca,
                                patient.tutor_nome,
                                patient.queixa_principal,
                                patient.historico_doenca_atual,
                                patient.observacoes,
                              ].filter(Boolean).join(' | ')

                              if (!textForEmbedding.trim()) {
                                done++
                                setBackfillProgress({ done, total: patients.length, current: patient.nome })
                                continue
                              }

                              try {
                                const embedding = await generateEmbedding(textForEmbedding)
                                if (embedding?.length) {
                                  await sb.from('patients').update({ embedding } as never).eq('id', patient.id)
                                }
                                done++
                              } catch {
                                failed++
                              }

                              setBackfillProgress({ done, total: patients.length, current: patient.nome })
                            }

                            toast.success(
                              `Backfill concluído! ${done - failed} embeddings gerados${failed ? `, ${failed} falhas` : ''}.`
                            )
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'Erro no backfill')
                          } finally {
                            setBackfilling(false)
                          }
                        }}
                        className="border-primary/40 text-primary hover:bg-primary/10 gap-2"
                      >
                        {backfilling ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                        {backfilling ? 'Gerando...' : 'Gerar embeddings para pacientes existentes'}
                      </Button>

                      {backfilling && backfillProgress.total > 0 && (
                        <div className="space-y-2">
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full transition-all duration-300"
                              style={{ width: `${(backfillProgress.done / backfillProgress.total) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {backfillProgress.done}/{backfillProgress.total} —
                            {backfillProgress.current ? ` ${backfillProgress.current}` : ' preparando...'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )
            })()}
          </CardContent>}
        </Card>

        {/* Info */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground text-sm">Sobre</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>
              As chamadas de IA são feitas diretamente do seu navegador para o provedor escolhido.
              Nenhum dado passa por servidores intermediários.
            </p>
            <p>
              <strong className="text-muted-foreground">Transcrição de áudio:</strong> disponível apenas via Groq (Whisper Large V3) e OpenAI (Whisper).
            </p>
            <p>
              <strong className="text-muted-foreground">Análise de imagens:</strong> requer modelo com suporte a visão (👁️).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
