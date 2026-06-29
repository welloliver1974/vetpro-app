# Plano MVP — Notificações WhatsApp (Evolution API)

> **Objetivo:** Quando o veterinário criar um agendamento na agenda, o tutor do paciente recebe WhatsApp automático com os detalhes.
> **Provedor:** Evolution API (self-hosted na VPS Oracle) — gratuito, controle total.

---

## ✅ STATUS FINAL (Checkpoint 28/06/2026 ~21:45)

| Componente | Status | Detalhes |
|------------|--------|----------|
| **Evolution API** | ✅ ONLINE | v2.3.7 ARM64 nativo, porta 8080 |
| **Nginx + SSL** | ✅ ONLINE | `evo.vetpro.housecloud.tec.br` (Let's Encrypt) |
| **PostgreSQL local** | ✅ | Porta 5433, banco `evolution`, user `evolution` |
| **Instância Evolution `vetpro`** | 🟡 Aguardando | Criada, precisa escanear QR com WhatsApp da clínica |
| **Migration Supabase `notification_log`** | ✅ Rodada | Tabela + coluna `notificacoes_config` criadas |
| **Patches no app** (commit `0a4946a`) | ✅ Commitado | `useAppointments`, `config.ts`, `useNotificationConfig` |
| **Edge Function `send-whatsapp`** | ✅ Deployada | URL: `https://rhugpobguitqlrfiusmh.supabase.co/functions/v1/send-whatsapp` |
| **Secret `SUPABASE_SERVICE_ROLE_KEY`** | ✅ Auto-disponível | Supabase expõe automatico |
| **Build + lint + testes** | ✅ 100% | lint 0 erros, build 19 páginas, vitest 77/77 |
| **Teste real end-to-end** | ✅ Mensagem montada | Log `status=erro`, aguardando WhatsApp conectado |

---

## 🧪 Teste Real Executado (commit `0a4946a`)

**Resultado:** Mensagem gerada corretamente, log gravado em `notification_log`.

Mensagem montada pela Edge Function:
> *"Ola Maria Teste! Lembrete: Rex Teste tem consulta de Fisioterapia em 30/06/2026 as 00:44 com Dr. Wellington ."*

Erro retornado pela Evolution API (esperado):
> HTTP 500: `Connection Closed` — instância ainda não conectada ao WhatsApp

Log gravado em `notification_log`:
```json
{
  "vet_id": "1555640a-a079-45b2-a55a-d6a131650142",
  "appointment_id": "7eca359e-ced1-43cc-8790-7efc6cec96e6",
  "tipo_envio": "whatsapp",
  "destinatario": "11999999999",
  "status": "erro",
  "mensagem": "Ola Maria Teste!...",
  "erro": "HTTP 500: Connection Closed"
}
```

**Próxima vez que o usuário escanear o QR Code e criar um agendamento**, o WhatsApp será entregue.

---

## 📋 Arquivos do Projeto

### Código (commit `0a4946a`)

| Arquivo | O que faz |
|---------|-----------|
| `hooks/useAppointments.ts` | `useCreateAppointment.onSuccess` dispara Edge Function após criar agendamento |
| `hooks/useNotificationConfig.ts` | `clear()` agora é `async` (espera sync no banco) |
| `lib/notification/config.ts` | `saveNotifyConfig` + `clearNotifyConfig` sincronizam `profiles.notificacoes_config` |
| `supabase/functions/send-whatsapp/index.ts` | Edge Function Deno: lê appointment, paciente, profile → chama Evolution API → grava log |
| `supabase/functions/send-whatsapp/deno.json` | Imports do Deno |
| `supabase/config.toml` | Config do projeto Supabase para deploy de functions |
| `tsconfig.json` | Exclui `supabase/functions` do type-check do Next.js |
| `scripts/docker-compose.evolution.yml` | Referência Docker Compose (Evolution API VPS) |
| `scripts/evolution-nginx.conf` | Referência Nginx (SSL + proxy para Evolution API) |
| `scripts/supabase-config.toml` | Template do config.toml (PowerShell-zip-safe) |

---

## 🏗️ Infra na VPS (ARM64 Oracle)

| Porta | Serviço | Container/Processo |
|-------|---------|--------------------|
| 80, 443 | Nginx (proxy reverso) | systemd |
| 4004 | Next.js App | PM2 (`vetpro`) |
| 8080 | Evolution API | Docker `evolution-api:latest` (ARM64) |
| 5432 | PostgreSQL Supabase | Docker `supabase-db` (legado) |
| 5433 | PostgreSQL Evolution | Nativo Ubuntu (`evolution` DB) |
| 22 | SSH | OpenSSH |

### Containers Docker ativos:
- `evolution-api` (ARM64, port 8080, `network_mode: host`)
- `postgres:15-alpine` (Postgres do Evolution — pode ser deletado, agora usa nativo)

### Filesystem:
- `/home/ubuntu/evolution-api/` (registros de sessão Evolution)
- `/etc/nginx/sites-available/evolution` (Nginx config ativo)

---

## 🔑 Credenciais e Secrets

### Evolution API
- **API URL interna**: `http://127.0.0.1:8080`
- **API URL externa**: `https://evo.vetpro.housecloud.tec.br`
- **API Key**: `<see script logs / VPS .env>`
- **Instance**: `vetpro`
- **Status**: criada, aguardando QR

### Supabase Edge Function
- **URL**: `https://rhugpobguitqlrfiusmh.supabase.co/functions/v1/send-whatsapp`
- **SUPABASE_SERVICE_ROLE_KEY**: auto-exposto pelo Supabase (não guardar no código)
- **EVOLUTION_SERVICE_KEY**: secret opcional (criar novo secret se quiser separar do EVOLUTION_API_KEY)
- **Access Token pessoal** (Supabase CLI): `<revogar e criar novo em https://supabase.com/dashboard/account/tokens>` (revogar após uso)

### PostgreSQL local (Evolution DB)
- **Host**: `127.0.0.1:5433`
- **Database**: `evolution`
- **User**: `evolution`
- **Password**: `postgres`
- **Peer Auth** + `scram-sha-256` configurado

---

## 🔄 Fluxo Completo

```
[Vet na Agenda] ─cria agendamento─► [Next.js useCreateAppointment]
                                       │
                                       ├► Grava no Supabase (appointments)
                                       │
                                       └► POST /functions/v1/send-whatsapp
                                              ▼
                                     [Supabase Edge Function (Deno)]
                                              │
                                              ├► Lê appointment + patients + profiles
                                              │
                                              ├► profiles.notificacoes_config:
                                              │     { apiUrl, apiKey, instanceName, template }
                                              │
                                              ├► Renderiza template:
                                              │     "Olá {{tutor}}, sua consulta de {{tipo}}..."
                                              │
                                              ├► POST https://evo.vetpro...
                                              │           /message/sendText/vetpro
                                              │
                                              └► Grava em notification_log
                                                    success=failure/success
```

---

## ⏭️ Como ativar de Verdade (Próximos Passos do Usuário)

1. **Escanear QR Code do WhatsApp:**
   - Acessar `https://evo.vetpro.housecloud.tec.br/manager`
   - Instância: `vetpro` → aparecerá QR Code → escanear com WhatsApp da clínica

2. **Configurar no app** (`/configuracoes`):
   - ✅ Ativar WhatsApp
   - URL: `https://evo.vetpro.housecloud.tec.br`
   - API Key: `<see script logs / VPS .env>`
   - Instance: `vetpro`

3. **Criar agendamento de teste** com paciente que tenha `tutor_contato` preenchido

4. **Verificar `notification_log`** no Supabase → status deve ser `enviado`

---

## 🚀 Deploy / Manutenção

### Redeploy da Edge Function:
```bash
ssh ubuntu@137.131.187.156 -i ~/.ssh/vetproapp-vps
cd /home/ubuntu/vetpro-app
git pull origin master
supabase functions deploy send-whatsapp --project-ref rhugpobguitqlrfiusmh
```

### Atualizar Evolution API:
```bash
ssh ubuntu@137.131.187.156
cd /home/ubuntu
docker compose -f docker-compose.evolution.yml pull evolution-api
docker compose -f docker-compose.evolution.yml up -d
```

### Logs:
```bash
docker logs evolution-api --tail 50    # Evolution API
pm2 logs vetpro --lines 50             # Next.js app
```

---

## ❓ Fora do MVP (Próximas Funcionalidades)

- [ ] Lembrete 1h antes (cron job GitHub Actions chamando Edge Function)
- [ ] Confirmação via link (`/confirmar?token=...`)
- [ ] Templates customizados com preview ao vivo
- [ ] E-mail (Resend/SendGrid) como canal alternativo
- [ ] Histórico de notificações com reenvio

---

## 🎯 Far-Future (Roadmap)

- [ ] Item #17: Testes Playwright e2e
- [ ] Item #22: Relatório PDF mensal automático
- [ ] Item #24: Papéis por função (admin, vet, assistente)
- [ ] Item #28: Busca semântica (pgvector + embeddings)
- [ ] Item #29: i18n (internacionalização)
