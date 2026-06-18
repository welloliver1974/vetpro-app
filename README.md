# VetPro App 🐾

SaaS de gestão veterinária focado em **fisioterapia e atendimento domiciliar**.  
Funciona em notebook, tablet e celular.

---

## Stack

| Camada | Tecnologia |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Linguagem** | TypeScript |
| **Fonte** | Inter (via next/font) |
| **Estilização** | Tailwind CSS v4 (azul escuro noturno + claro) |
| **Componentes** | Shadcn/ui (Radix UI) |
| **Gráficos** | Recharts (pizza + barras) |
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
- Cadastro completo (nome, espécie, raça, tutor, contato, endereço)
- Listagem com busca por nome ou tutor
- Paginação (10/página)
- Edição e exclusão
- **Comparação de fotos com IA**: selecione Antes/Depois e analise evolução visual

#### 📅 Agenda Unificada
- Visualização em calendário semanal com navegação
- Criação de atendimentos clicando no dia
- Diferenciação visual por tipo: **Fisioterapia** / **Clínico** / **Externo (Domiciliar)**
- Status: Agendado → Em Andamento → Concluído
- Finalização com **assinatura digital** do tutor + valor + forma de pagamento
- **Filtros**: por tipo, status e busca por paciente
- **Lembretes**: notificação 15 min antes (Push API)
- **Google Maps**: link para endereço do paciente em atendimentos externos

#### 📸 Prontuário + Galeria de Evolução
- Registro de sessões vinculadas a atendimentos
- Anotações da sessão + notas de evolução
- **Upload de fotos e vídeos** (Supabase Storage)
- **Gravação de áudio** com transcrição por IA (Whisper)
- **Análise clínica de áudio**: IA estrutura a transcrição em Resumo, Achados e Conduta
- Galeria com timeline visual
- **Custo da sessão** (R$) por atendimento

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
- **Custos totais** com margem de lucro
- **Gráfico de pizza** no Dashboard com distribuição por forma de pagamento
- **Gráfico de barras** no Dashboard com sessões por dia da semana
- Histórico completo com paginação (15/página)
- **Exportar CSV** com BOM UTF-8

#### 📄 Relatório para Tutor
- Geração de PDF com evolução mensal do paciente
- **Relatório com IA**: gera texto em linguagem clara para o tutor
- **Assinatura digital** incluída no PDF

#### 🤖 Integração com IA (Multi-Provedor)
- **Configurações** (`/configuracoes`): escolha o provedor e insira sua chave de API
- Provedores suportados: Groq, OpenRouter, OpenAI (GPT), Anthropic (Claude), Gemini, Omniroute
- Chave armazenada apenas no navegador (localStorage)
- **Transcrição de áudio**: grave direto no navegador e transcreva para as anotações da sessão
- **Análise clínica de áudio**: IA extrai Resumo Clínico, Achados e Conduta da gravação
- **Sugerir Evolução**: IA gera notas de evolução a partir das anotações
- **Comparação de Fotos com IA**: analisa evolução visual entre duas fotos (requer modelo vision)
- **Relatório com IA**: redige relatório em linguagem clara para o tutor
- **Previsão de sessões restantes**: IA estima quantas sessões faltam baseada no histórico
- **Insight do Dia no Dashboard**: clique e receba um resumo inteligente do dia

#### 🏥 Multi-Clínica
- Criação de clínica com convite por email
- Aceite de convite via link com token
- Dados compartilhados entre membros da mesma clínica
- Gerenciamento de membros na página de configurações

#### 📱 PWA (Progressive Web App)
- Manifest.json com ícones SVG e configuração standalone
- Service Worker (network-first, sem cache de chunks .js/.json)
- Página `/offline` fallback
- Instalável como aplicativo no celular e desktop

#### 🔔 Notificações
- Hook `useNotifications` com `scheduleReminder` e `notifyNow`
- Botão de permissão na agenda
- Lembrete automático 15 minutos antes de cada atendimento

#### 🎨 Tema
- Toggle Claro/Escuro no Header (via `next-themes`)
- Tema escuro: azul noturno (navy)
- Tema claro: azul clarinho (sky)
- **Sistema de Design Tokens**: cores hardcoded (`text-slate-*`, `bg-slate-*`, `border-slate-*`) substituídas por variáveis CSS (`text-muted-foreground`, `bg-card`, `bg-muted`, `border-border`, `bg-primary`) em todo o app (17 arquivos, ~340 substituições)
- Botões `bg-indigo-600` migrados para `bg-primary`, permitindo troca de cor primária via CSS

---

## 📋 Roadmap / Melhorias Pendentes

### 🧱 Infraestrutura
- [x] `loading.tsx` em cada route group (skeleton/spinner)
- [x] `error.tsx` em cada página (error boundary amigável)
- [ ] Página `not-found.tsx` customizada
- [ ] Testes unitários (Vitest + Testing Library) para hooks
- [ ] Testes de integração ou e2e (Playwright)
- [ ] Validação de formulários com Zod
- [ ] toast de erro global unificado (rede, auth, etc.)

### 🎨 UI/UX
- [ ] Migrar páginas `'use client'` para Server Components onde possível (dados iniciais)
- [ ] Substituir `text-indigo-*` restantes por `text-primary`/design tokens
- [ ] Responsividade: revisar mobile em todas as páginas
- [ ] Estado vazio ilustrado (nenhum paciente, nenhuma sessão, etc.)

### 🔒 Segurança
- [ ] Criptografar ou ofuscar API Key da IA no localStorage
- [ ] Revisar RLS policies para garantir isolamento

### 🚀 Performance
- [ ] Adicionar `loading.tsx` com suspense boundaries nas rotas com dados
- [ ] Otimizar queries do Supabase (select específico, evitar `select *`)
- [ ] Revisar bundle com `next/bundle-analyzer`

### 🧪 Qualidade
- [ ] Corrigir alias `pacientes:nome` em `lib/supabase/queries.ts`
- [ ] Adicionar lint estrito (unicórnio, segurança)
- [ ] CI/CD no GitHub Actions (build + lint + testes)

### 💡 Funcionalidades Futuras
- [ ] Dashboard: filtro por período (7d, 30d, personalizado)
- [ ] Agenda: visão mensal / diária
- [ ] Financeiro: gráfico de linha (receita ao longo do tempo)
- [ ] Notificações: lembrete por WhatsApp/e-mail (webhook)
- [ ] Relatório: agendamento automático de PDF mensal

---

## Estrutura de Pastas

```
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx              # Dashboard + gráficos + Insight IA
│   │   ├── agenda/               # Calendário + filtros + notificações
│   │   ├── pacientes/            # Lista com paginação
│   │   ├── pacientes/[id]/       # Detalhe + sessões + galeria + IA
│   │   ├── equipamentos/
│   │   ├── protocolos/
│   │   ├── financeiro/           # Resumo + CSV + paginação
│   │   ├── configuracoes/        # Configuração de IA + Clínica
│   │   └── configuracoes/clinica/# Gerenciamento multi-clínica
│   ├── auth/ (login, signup, callback, join-clinic)
│   ├── offline/                  # Fallback offline
│   └── layout.tsx                # ThemeProvider + Inter font
├── components/
│   ├── ui/                       # Shadcn
│   ├── layout/                   # Sidebar + Header (toggle tema)
│   └── vet/
│       ├── ReportPDF.tsx
│       ├── AudioRecorder.tsx     # Gravação de áudio com transcrição
│       └── SignaturePad.tsx      # Assinatura digital
├── hooks/
│   ├── usePatients.ts
│   ├── useAppointments.ts
│   ├── useSessions.ts
│   ├── useEquipments.ts
│   ├── useProtocols.ts
│   ├── useFinances.ts
│   ├── useAi.ts                  # Hooks de IA
│   ├── useClinic.ts             # Multi-clínica
│   └── useNotifications.ts
├── lib/
│   ├── ai/
│   │   ├── config.ts             # Configuração dos provedores
│   │   └── index.ts              # Serviço de IA unificado
│   ├── supabase/ (client, server, queries)
│   ├── dal.ts
│   └── utils.ts
├── providers/
│   └── QueryProvider.tsx
├── public/
│   ├── manifest.json
│   ├── sw.js                     # Service Worker v2
│   └── icons/                    # Ícones SVG PWA
├── proxy.ts
├── supabase-schema.sql
├── supabase-storage.sql
├── supabase-migration-financeiro.sql
├── supabase-migration-multiclinica.sql
├── supabase-migration-endereco.sql
├── supabase-migration-custo.sql
└── supabase-migration-assinatura.sql
```

---

## Banco de Dados

6 tabelas no PostgreSQL com RLS + 2 tabelas auxiliares:

| Tabela | Descrição |
|---|---|
| `profiles` | Perfil do veterinário (com `clinic_id`) |
| `patients` | Pacientes (animais) com endereço |
| `equipments` | Equipamentos de fisioterapia |
| `protocols` | Protocolos de tratamento |
| `appointments` | Atendimentos agendados (com `forma_pagamento`, `assinatura_url`) |
| `sessions` | Sessões com notas, custo, fotos e vídeos |
| `clinics` | Clínicas (multi-clínica) |
| `clinic_invites` | Convites pendentes |

Storage bucket: `session-media` (fotos/vídeos)  
Storage bucket: `signatures` (assinaturas digitais)

---

## Como Rodar

```bash
npm install
# Configure .env.local com suas credenciais do Supabase
# Execute todos os .sql no SQL Editor do Supabase
npm run dev
```

Build + lint:
```bash
npm run build    # 0 erros
npm run lint     # 0 erros (apenas <img> warnings de fotos de usuário)
```

---

## Rotas

| Rota | Descrição |
|---|---|
| `/` | Dashboard com gráficos |
| `/agenda` | Calendário semanal |
| `/pacientes` | Lista de pacientes |
| `/pacientes/[id]` | Detalhe do paciente |
| `/equipamentos` | Inventário |
| `/protocolos` | Biblioteca de protocolos |
| `/financeiro` | Painel financeiro |
| `/configuracoes` | IA - provedor e chave |
| `/configuracoes/clinica` | Gerenciar clínica |
| `/auth/login` | Login |
| `/auth/signup` | Cadastro |
| `/auth/join-clinic` | Aceitar convite |
| `/offline` | Fallback offline |
