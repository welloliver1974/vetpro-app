# Plano MVP — Notificações WhatsApp (Evolution API)

> **Objetivo:** Quando o veterinário criar um agendamento na agenda, o tutor do paciente recebe WhatsApp automático com os detalhes.
> **Provedor:** Evolution API (self-hosted na sua VPS Oracle) — gratuito, controle total.

---

## ✅ O que JÁ EXISTE (pronto, não mexer)

| Item | Local |
|------|--|--|
| UI completa em `/configuracoes` (ativa/desativa, URL, Key, Instance, Template, botão Testar) | `app/(dashboard)/configuracoes/page.tsx` (linhas 249-399) |
| Config criptografada no `localStorage` (AES-GCM) | `lib/notification/config.ts` + `hooks/useNotificationConfig.ts` |
| Envio via Evolution API (`sendWhatsApp`) | `lib/notification/index.ts` |
| Template com variáveis `{{tutor}}`, `{{paciente}}`, `{{tipo}}`, `{{data}}`, `{{hora}}`, `{{vet}}`, `{{endereco}}` | `lib/notification/templates.ts` |
| Tabela `notification_log` + coluna `notificacoes_config` em `profiles` | `supabase-migration-notificacoes.sql` |
| Função pronta `sendAppointmentNotification()` (monta vars + envia + loga) | `lib/notification/index.ts` (linha 74) |

---

## ❌ O que FALTA (3 tarefas principais)

| # | Tarefa | Onde | Esforço |
|--|--|--|--|
| 1 | **Instalar Evolution API na VPS** (Docker + Nginx + SSL) | VPS Oracle | 🟢 30 min |
| 2 | **Criar Supabase Edge Function `send-whatsapp`** (server-side, lê config do banco) | `supabase/functions/send-whatsapp/index.ts` | 🟢 30 min |
| 3 | **Conectar no `useCreateAppointment`** (disparar Edge Function após criar agendamento) | `hooks/useAppointments.ts` | 🟢 15 min |
| 4 | **Sincronizar config no banco** (ao salvar em `/configuracoes`, gravar em `profiles.notificacoes_config`) | `lib/notification/config.ts` | 🟢 10 min |
| 5 | **Rodar migration** `notification_log` no Supabase produção | SQL Editor do Supabase | 🟢 5 min |

---

## 1️⃣ INFRA — Evolution API na VPS

### 1.1 Docker Compose (`/home/ubuntu/docker-compose.evolution.yml`)

```yaml
version: '3.8'
services:
  evolution-api:
    image: atendai/evolution-api:v1.9.2
    container_name: evolution-api
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://localhost:8080
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://postgres:postgres@db:5432/evolution
      - CONFIG_SESSION_PHONE_CLIENT=VetProApp
      - AUTHENTICATION_API_KEY=SUA_CHAVE_SECRETA_AQUI   # gerar: openssl rand -hex 32
      - CORS_ORIGIN=*
      - LOG_LEVEL=INFO
      - SERVER_TYPE=development
    volumes:
      - evolution_data:/evolution/instances
      - evolution_db:/var/lib/postgresql/data
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    container_name: evolution-db
    restart: unless-stopped
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=evolution
    volumes:
      - evolution_db:/var/lib/postgresql/data

volumes:
  evolution_data:
  evolution_db:
```

**Comandos na VPS:**
```bash
cd /home/ubuntu
# 1. Criar arquivo acima
# 2. Gerar chave segura
echo "AUTHENTICATION_API_KEY=$(openssl rand -hex 32)" > .evolution.env
# 3. Subir
docker compose -f docker-compose.evolution.yml up -d
# 4. Verificar
curl http://localhost:8080/manager/status
```

---

### 1.2 Nginx + SSL (subdomínio `evo.vetpro.housecloud.tec.br`)

```nginx
# /etc/nginx/sites-available/evolution
server {
    server_name evo.vetpro.housecloud.tec.br;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/evolution /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d evo.vetpro.housecloud.tec.br --noninteractive --agree-tos -m seu@email.com
```

---

### 1.3 Criar instância `vetpro` + escanear QR

```bash
curl -X POST https://evo.vetpro.housecloud.tec.br/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: SUA_AUTHENTICATION_API_KEY" \
  -d '{"instanceName":"vetpro","qrcode":true,"integration":"WHATSAPP-BAILEYS"}'
```

- Abrir a URL de QR Code retornada → escanear com WhatsApp do número da clínica
- Confirmar conexão:
```bash
curl https://evo.vetpro.housecloud.tec.br/instance/connectionState/vetpro \
  -H "apikey: SUA_AUTHENTICATION_API_KEY"
```

---

## 2️⃣ SUPABASE — Migration

Executar no **SQL Editor do Supabase (produção)**:

```sql
-- supabase-migration-notificacoes.sql
create table if not exists notification_log (
  id uuid default uuid_generate_v4() primary key,
  vet_id uuid references profiles(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  tipo_envio text not null check (tipo_envio in ('whatsapp', 'email')),
  destinatario text not null,
  status text not null default 'enviado' check (status in ('enviado', 'erro', 'lido')),
  mensagem text,
  erro text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table profiles add column if not exists notificacoes_config jsonb;

alter table notification_log enable row level security;
create policy "Vets can manage own notification logs"
  on notification_log
  using (vet_id = auth.uid())
  with check (vet_id = auth.uid());
```

---

## 3️⃣ CÓDIGO — Edge Function `send-whatsapp`

**Arquivo novo:** `supabase/functions/send-whatsapp/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { appointmentId } = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 1. Buscar appointment + patient + profile (vet)
  const { data: appt } = await supabase
    .from('appointments')
    .select('*, patients(tutor_nome, tutor_contato, especie, endereco), profiles!inner(nome)')
    .eq('id', appointmentId)
    .single()

  if (!appt?.patients?.tutor_contato) return new Response('Sem contato', { status: 400 })

  // 2. Buscar config do vet (profiles.notificacoes_config)
  const { data: profile } = await supabase
    .from('profiles')
    .select('notificacoes_config')
    .eq('id', appt.profiles.id)
    .single()

  const config = profile?.notificacoes_config
  if (!config?.enabled || config.provider !== 'evolution') return new Response('Desativado', { status: 200 })

  // 3. Montar mensagem (mesma lógica de templates.ts)
  const vars = {
    tutor: appt.patients.tutor_nome || 'Tutor',
    paciente: appt.patients.nome || 'Paciente',
    especie: appt.patients.especie || '',
    tipo: appt.tipo === 'fisio' ? 'Fisioterapia' : appt.tipo === 'externo' ? 'Externo (Domiciliar)' : 'Clínico',
    data: new Date(appt.data).toLocaleDateString('pt-BR'),
    hora: new Date(appt.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    vet: appt.profiles.nome,
    endereco: appt.patients.endereco || ''
  }
  let msg = config.template
  Object.entries(vars).forEach(([k, v]) => msg = msg.replaceAll(`{{${k}}}`, v))

  // 4. Enviar via Evolution API
  const url = `${config.apiUrl}/message/sendText/${config.instanceName}`
  const phone = appt.patients.tutor_contato.replace(/\D/g, '')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: config.apiKey },
    body: JSON.stringify({ number: phone, text: msg, options: { delay: 1200 } })
  })

  // 5. Log na tabela notification_log
  await supabase.from('notification_log').insert({
    vet_id: appt.profiles.id,
    appointment_id: appointmentId,
    tipo_envio: 'whatsapp',
    destinatario: phone,
    status: res.ok ? 'enviado' : 'erro',
    mensagem: msg,
    erro: res.ok ? null : await res.text()
  })

  return new Response(JSON.stringify({ success: res.ok }), { status: res.ok ? 200 : 500 })
})
```

**Deploy:**
```bash
supabase functions deploy send-whatsapp --project-ref rhugpobguitqlrfiusmh
# Precisa ter SUPABASE_SERVICE_ROLE_KEY no .env.local da máquina que faz deploy
```

---

## 4️⃣ CÓDIGO — Hook `useCreateAppointment` (disparo)

**Arquivo:** `hooks/useAppointments.ts` → dentro de `useCreateAppointment` → `onSuccess`:

```typescript
// Imports adicionais no topo do arquivo:
import { loadNotifyConfigAsync } from '@/lib/notification/config'
import { sendAppointmentNotification } from '@/lib/notification'

// ...

export function useCreateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAppointment,
    onSuccess: async (newAppt) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Atendimento agendado!')

      // 👇 NOVO: chamar Edge Function (fire-and-forget)
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rhugpobguitqlrfiusmh.supabase.co'
        await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ appointmentId: newAppt.id })
        })
      } catch {
        // silent fail — não bloqueia o agendamento
      }
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
```

---

## 5️⃣ CÓDIGO — Sincronizar config no banco ao salvar

**Arquivo:** `lib/notification/config.ts` → função `saveNotifyConfig`:

```typescript
export async function saveNotifyConfig(config: NotificationConfig): Promise<void> {
  if (typeof window === 'undefined') return
  const toStore = { ...config }
  if (toStore.apiKey) {
    const encrypted = await encrypt(toStore.apiKey)
    toStore.apiKey = `v1:${encrypted}`
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))

  // 👇 NOVO: sincronizar no profiles.notificacoes_config
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const sb = await createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (user) {
      await sb.from('profiles').update({ notificacoes_config: toStore }).eq('id', user.id)
    }
  } catch {
    // silent fail — localStorage já salvou
  }
}
```

---

## 6️⃣ GITHUB SECRETS (para deploy automático continuar funcionando)

| Secret | Valor | Onde pegar |
|--|--|--|
| `VPS_HOST` | IP público da VPS Oracle | Painel Oracle Cloud |
| `VPS_USER` | `ubuntu` | — |
| `VPS_SSH_KEY` | Chave privada SSH (-----BEGIN OPENSSH PRIVATE KEY-----) | `~/.ssh/id_rsa` ou gerada nova |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rhugpobguitqlrfiusmh.supabase.co` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_...` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_...` (service role) | Supabase → Settings → API → **service_role** (não anon!) |

> ⚠️ O `SUPABASE_SERVICE_ROLE_KEY` é **sensível** — só use em GitHub Secrets e Edge Functions, nunca no client.

---

## 7️⃣ TESTE FINAL (checklist)

| Passo | Como testar | Esperado |
|--|--|--|
| 1. Evolution API up | `curl https://evo.vetpro.housecloud.tec.br/manager/status` | JSON com `"status":"running"` |
| 2. Instância conectada | `curl .../instance/connectionState/vetpro -H "apikey:KEY"` | `"state":"open"` |
| 3. Migration rodou | Supabase → Table Editor → `notification_log` existe | ✅ |
| 4. Edge Function deployada | Supabase → Functions → `send-whatsapp` | ✅ |
| 5. Config salva no banco | `/configuracoes` → preencher WhatsApp → Salvar → profiles.notificacoes_config preenchido | ✅ |
| 6. Criar agendamento | Agenda → novo atendimento → paciente com `tutor_contato` | WhatsApp chega no tutor! |
| 7. Log gravado | Supabase → `notification_log` → nova linha status `enviado` | ✅ |

---

## 📦 FORA DO MVP (depois)

- Lembrete 1h antes → GitHub Actions cron (`*/15 * * * *`) chamando Edge Function que busca appointments em `now → now+1h`
- Confirmação via link (`/confirmar?token=...`) + badge na agenda
- Templates editáveis com preview em tempo real
- E-mail (Resend/SendGrid) como canal alternativo

---

## 🚀 ORDEM DE EXECUÇÃO SUGERIDA

1. **Você (VPS):** Subir Evolution API (docker-compose + nginx + SSL + instância + QR)
2. **Você (Supabase):** Rodar migration `notification_log`
3. **Eu (código):** Criar Edge Function + alterar `useAppointments.ts` + `config.ts`
4. **Eu (deploy):** `supabase functions deploy send-whatsapp`
5. **Você (GitHub):** Adicionar `SUPABASE_SERVICE_ROLE_KEY` nos Secrets
6. **Nós (teste):** Criar agendamento real → confirmar WhatsApp no tutor

---

## ❓ DÚVIDAS / DECISÕES PENDENTES

- [ ] IP público da VPS confirmado para `VPS_HOST`?
- [ ] Subdomínio `evo.vetpro.housecloud.tec.br` criado no DNS (A record → IP da VPS)?
- [ ] Service Role Key do Supabase disponível para por nos GitHub Secrets?
- [ ] Número de WhatsApp da clínica pronto para escanear QR?

---

**Próximo comando sugerido:** quando a VPS estiver pronta, me avise e eu gero os arquivos de código (Edge Function + patches nos hooks).