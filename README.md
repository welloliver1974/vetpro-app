# VetPro App 🐾

SaaS de gestão veterinária focado em **fisioterapia e atendimento domiciliar**.  
Funciona em notebook, tablet e celular.

---

## Stack

| Camada | Tecnologia |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Linguagem** | TypeScript |
| **Estilização** | Tailwind CSS v4 (Dark/Light) |
| **Componentes** | Shadcn/ui (Radix UI) |
| **State** | TanStack Query v5 |
| **Backend/DB** | Supabase (PostgreSQL + Auth + Storage) |
| **Auth** | Supabase Auth (email/senha) |
| **PDF** | jsPDF + html2canvas |
| **IA** | Multi-provedor (Groq, OpenRouter, OpenAI, Anthropic, Gemini, Omniroute) |

---

## Funcionalidades

### ✅ Concluído

#### 🔐 Autenticação
- Login e cadastro com email/senha
- Proteção de rotas via Proxy (substituto do Middleware do Next.js)
- Trigger automático de criação de perfil no signup
- RLS (Row Level Security) isolando dados por veterinário

#### 📋 Pacientes
- Cadastro completo (nome, espécie, raça, tutor, contato)
- Listagem com busca por nome ou tutor
- Paginação (10/página)
- Edição e exclusão

#### 📅 Agenda Unificada
- Visualização em calendário semanal com navegação
- Criação de atendimentos clicando no dia
- Diferenciação visual por tipo: **Fisioterapia** / **Clínico** / **Externo (Domiciliar)**
- Status: Agendado → Em Andamento → Concluído
- Finalização com valor e forma de pagamento
- **Filtros**: por tipo, status e busca por paciente

#### 📸 Prontuário + Galeria de Evolução
- Registro de sessões vinculadas a atendimentos
- Anotações da sessão + notas de evolução
- Upload de fotos e vídeos (Supabase Storage)
- Galeria com timeline visual
- **Comparação de fotos com IA**: selecione Antes/Depois e analise evolução visual

#### 🔧 Inventário de Equipamentos
- Cadastro de aparelhos (laser, ultrassom, eletroestimulador)
- Controle de modelo e data de última manutenção

#### 📋 Biblioteca de Protocolos
- Templates de tratamento vinculados a equipamentos
- Configurações dinâmicas em JSON
- Seleção do protocolo usado ao registrar sessão

#### 💰 Financeiro (PDV Móvel)
- Modal de **Finalizar Atendimento** com resumo
- Registro de valor cobrado
- Formas de pagamento: Pix, Cartão, Dinheiro
- Painel financeiro com faturamento (Hoje, Mês, Total)
- Histórico completo com paginação (15/página)
- **Exportar CSV** com BOM UTF-8

#### 📄 Relatório para Tutor
- Geração de PDF com evolução mensal do paciente
- **Relatório com IA**: gera texto em linguagem clara para o tutor

#### 🤖 Integração com IA (Multi-Provedor)
- **Configurações** (`/configuracoes`): escolha o provedor e insira sua chave de API
- Provedores suportados: Groq, OpenRouter, OpenAI (GPT), Anthropic (Claude), Gemini, Omniroute
- Chave armazenada apenas no navegador (localStorage)
- **Transcrição de áudio**: grave direto no navegador e transcreva para as anotações da sessão
- **Sugerir Evolução**: IA gera notas de evolução a partir das anotações
- **Comparação de Fotos**: IA analisa evolução visual entre duas fotos (requer modelo vision)
- **Insight do Dia no Dashboard**: clique e receba um resumo inteligente do dia

#### 📱 PWA (Progressive Web App)
- Manifest.json com ícones e configuração standalone
- Service Worker com cache-first para assets estáticos
- Página `/offline` fallback
- Instalável como aplicativo no celular e desktop

#### 🔔 Notificações
- Hook `useNotifications` com `scheduleReminder` e `notifyNow`
- Botão de permissão na agenda
- Lembrete automático 15 minutos antes de cada atendimento

#### 🎨 Tema
- Toggle Claro/Escuro no Header (via `next-themes`)

---

## Estrutura de Pastas

```
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx              # Dashboard + Insight IA
│   │   ├── agenda/               # Calendário + filtros
│   │   ├── pacientes/            # Lista com paginação
│   │   ├── pacientes/[id]/       # Detalhe + sessões + galeria + IA
│   │   ├── equipamentos/
│   │   ├── protocolos/
│   │   ├── financeiro/           # Resumo + CSV + paginação
│   │   └── configuracoes/        # Configuração de IA
│   ├── auth/ (login, signup, callback)
│   └── layout.tsx                # ThemeProvider
├── components/
│   ├── ui/                       # Shadcn
│   ├── layout/                   # Sidebar + Header (toggle tema)
│   └── vet/
│       ├── ReportPDF.tsx
│       └── AudioRecorder.tsx     # Gravação de áudio com transcrição
├── hooks/
│   ├── usePatients.ts
│   ├── useAppointments.ts
│   ├── useSessions.ts
│   ├── useEquipments.ts
│   ├── useProtocols.ts
│   ├── useFinances.ts
│   └── useAi.ts                  # Hooks de IA
├── lib/
│   ├── ai/
│   │   ├── config.ts             # Configuração dos provedores
│   │   └── index.ts              # Serviço de IA unificado
│   ├── supabase/ (client, server, queries)
│   ├── dal.ts
│   └── utils.ts
├── providers/
│   └── QueryProvider.tsx
├── proxy.ts
├── supabase-schema.sql
├── supabase-storage.sql
└── supabase-migration-financeiro.sql
```

---

## Banco de Dados

6 tabelas no PostgreSQL com RLS:

| Tabela | Descrição |
|---|---|
| `profiles` | Perfil do veterinário |
| `patients` | Pacientes (animais) |
| `equipments` | Equipamentos de fisioterapia |
| `protocols` | Protocolos de tratamento |
| `appointments` | Atendimentos agendados |
| `sessions` | Sessões com notas e fotos |

Storage bucket: `session-media` (fotos/vídeos)

---

## Como Rodar

```bash
npm install
# Configure .env.local com suas credenciais do Supabase
# Execute supabase-schema.sql, supabase-storage.sql,
# supabase-migration-financeiro.sql no SQL Editor
npm run dev
```

---

## Roadmap Futuro

- [ ] **Integração WhatsApp** — compartilhar PDF do relatório diretamente
- [ ] **Gráficos no Dashboard** — sessões/dia, faturamento mensal, formas de pagamento
- [ ] **Multi-clínica** — suporte a múltiplos veterinários na mesma conta
- [ ] **Google Maps** — rotas para atendimento externo/domiciliar
- [ ] **Gestão de custo por sessão** — energia + manutenção de equipamentos
- [ ] **Assinatura digital do tutor** — no relatório ou na ficha do paciente
- [ ] **Análise de áudio avançada** — IA extrai diagnóstico das gravações
- [ ] **Previsão de sessões restantes** — IA estima progresso do tratamento
