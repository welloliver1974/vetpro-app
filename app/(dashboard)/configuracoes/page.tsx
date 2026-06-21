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
import {
  PROVIDERS, getChatModels, type ProviderId, type AiConfig,
} from '@/lib/ai/config'
import { testConnection } from '@/lib/ai'
import { useAiConfig } from '@/hooks/useAi'
import { Loader2, CheckCircle2, XCircle, Brain, Key, Save, Trash2 } from 'lucide-react'

export default function ConfiguracoesPage() {
  const { config, save, clear, loading } = useAiConfig()

  const [provider, setProvider] = useState<ProviderId>('groq')
  const [apiKey, setApiKey] = useState('')
  const [chatModel, setChatModel] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null)

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

      <div className="max-w-xl space-y-6">
        {/* Provedor */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground text-lg">Provedor</CardTitle>
            <CardDescription className="text-muted-foreground">
              Selecione o serviço de IA que deseja utilizar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
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
