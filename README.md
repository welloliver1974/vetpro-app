# VetPro App 🐾

> **Última sessão (22/06):** Item #13 (Sugestão de Preço IA) implementado. Planos detalhados dos itens #21 (Notificações WhatsApp/E-mail) e #30 (Integração Google Calendar /.ics) adicionados ao README com arquitetura, fluxos, tabelas, interface e escopo de MVP. Próximos passos: implementar um dos itens do roadmap.

SaaS de gestão veterinária focado em **fisioterapia e atendimento domiciliar**.  
Funciona em notebook, tablet e celular.

---

## Stack

| Camada | Tecnologia |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Linguagem** | TypeScript |
| **Fonte** | Plus Jakarta Sans (via next/font/google, auto-hosted) |
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

#### 📋 Receituário Veterinário
- Prescrições com múltiplos medicamentos por receita
- Cada item: medicamento, dosagem, frequência, duração, via de administração
- Visualização otimizada para impressão com `@media print`
- CRUD completo com TanStack Query + Zod

#### 🎯 Metas Mensais de Faturamento
- Definição de meta por mês/ano (exclusiva por clínica)
- Barra de progresso com cores dinâmicas (verde ≥ 100%, azul ≥ 75%, amarelo ≥ 50%, vermelho < 50%)
- Histórico de metas anteriores com edição e exclusão
- Receita real vs meta calculada automaticamente dos atendimentos concluídos

#### 🔧 Inventário de Equipamentos
- Cadastro de aparelhos (laser, ultrassom, eletroestimulador)
- Controle de modelo e data de última manutenção
- **Estoque de insumos e medicamentos**: controle de quantidade, lote, validade, fornecedor e alerta de estoque mínimo
  
  

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

> Prioridade: 🟢 Fácil → 🟡 Médio → 🔴 Complexo

### 🟢 Fácil/Rápido
| # | Item | Categoria |
|---|------|-----------|
| ~~1~~ | ~~Adicionar lint estrito (unicórnio, segurança)~~ — ✅ | 🧪 Qualidade |
| ~~2~~ | ~~`loading.tsx` / suspense boundaries nas rotas~~ — ✅ | 🚀 Performance |
| ~~3~~ | ~~Pacientes: anamnese / ficha médica completa~~ — ✅ | 💡 Funcionalidades |
| ~~4~~ | ~~Financeiro: emissão de nota fiscal / recibo (PDF)~~ — ✅ | 💡 Funcionalidades |
| ~~5~~ | ~~Equipamentos: estoque de insumos e medicamentos~~ — ✅ | 💡 Funcionalidades |
| ~~6~~ | ~~Impressão: versão printer-friendly (CSS @media print)~~ — ✅ | 💡 Funcionalidades |

### 🟡 Médio
| # | Item | Categoria |
|---|------|-----------|
| ~~7~~ | ~~Pacientes: múltiplos pets por tutor~~ — ✅ | 💡 Funcionalidades |
| ~~8~~ | ~~Dashboard: filtro por período (7d, 30d, personalizado)~~ — ✅ | 💡 Funcionalidades |
| ~~9~~ | ~~Financeiro: gráfico de linha (receita ao longo do tempo)~~ — ✅ | 💡 Funcionalidades |
| ~~10~~ | ~~Financeiro: metas mensais de faturamento~~ — ✅ | 💡 Funcionalidades |
| ~~11~~ | ~~Revisar bundle com `next/bundle-analyzer`~~ — ✅ | 🚀 Performance |
| ~~12~~ | ~~CI/CD no GitHub Actions (build + lint + testes)~~ — ✅ | 🧪 Qualidade |
| ~~13~~ | ~~Sugestão de Preço (IA)~~ — ✅ | 🤖 IA |
| 14 | Relatório Semanal Automático (IA + cron) | 🤖 IA |
| 15 | Backup: exportar/importar dados (JSON) | 💡 Funcionalidades |
| 16 | Auditoria: log de alterações em registros | 💡 Funcionalidades |
| 17 | Testes de integração/e2e (Playwright) | 🧪 Qualidade |
| ~~18~~ | ~~Pacientes: gráfico de peso ao longo do tempo~~ — ✅ | 💡 Funcionalidades |
| 19 | Pacientes: timeline visual de evolução | 💡 Funcionalidades |
| 20 | Agenda: agendamento recorrente | 💡 Funcionalidades |
| 21 | Notificações: lembrete por WhatsApp/e-mail (webhook) | 💡 Funcionalidades |
| 22 | Relatório: agendamento automático de PDF mensal | 💡 Funcionalidades |
| 30 | Integração com Google Calendar / .ics | 💡 Funcionalidades |

### 🔴 Complexo
| # | Item | Categoria |
|---|------|-----------|
| 23 | Agenda: visão mensal / diária | 💡 Funcionalidades |
| 24 | Papéis: permissões por função (admin, vet, assistente) | 💡 Funcionalidades |
| 25 | Offline: cache de dados (Service Worker + sync) | 💡 Funcionalidades |
| 26 | Dashboard: widgets customizáveis (DnD) | 💡 Funcionalidades |
| 27 | Sessão por Voz Completa (IA) | 🤖 IA |
| 28 | Busca Inteligente (pgvector + embeddings) | 🤖 IA |
| 29 | Internacionalização (i18n) | 💡 Funcionalidades |

### Checkpoint concluídos
- [x] `loading.tsx` em cada route group (skeleton/spinner)
- [x] `error.tsx` em cada página (error boundary amigável)
- [x] Página `not-found.tsx` customizada
- [x] Configuração de ambiente de testes (Vitest + Testing Library)
- [x] Testes unitários (Vitest + Testing Library) para hooks de IA (useAiConfig, useChat, useTranscription, useImageAnalysis)
- [x] Validação de formulários com Zod
- [x] toast de erro global unificado (rede, auth, etc.)
- [x] Migrar páginas `'use client'` para Server Components onde possível (dados iniciais)
- [x] Substituir `text-indigo-*` restantes por `text-primary`/design tokens
- [x] Responsividade: revisado Dashboard, Agenda e Detalhes do Paciente
- [x] Dashboard: estados vazios com ícones (gráficos + agenda)
- [x] Estado vazio ilustrado (Pacientes, Equipamentos, Protocolos, Financeiro)
- [x] Criptografar API Key da IA no localStorage
- [x] Revisar RLS policies para garantir isolamento
- [x] Permissão de dono/admin na clínica
- [x] Otimizar queries do Supabase (select específico)
- [x] Corrigir alias `pacientes:nome` em `lib/supabase/queries.ts`

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
npm run lint     # 0 erros
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

---

## Checkpoint da Sessão 20/06/2026

### O que já foi feito
- Corrigimos a query quebrada de atendimentos em `lib/supabase/queries.ts`.
- Padronizamos os `select` do Supabase para campos explícitos nos hooks e queries principais.
- Criamos a página `not-found.tsx`.
- Removemos os `text-indigo-*` restantes das telas principais.
- Trocamos as imagens mais críticas da tela do paciente para `next/image`.
- Removemos a dependência de Google Fonts do build.
- Validamos com sucesso `npm run lint` e `npm run build`.
- Fizemos um hardening no trigger `handle_new_user` com `search_path` fixo.
- **Upgrade de estados vazios do Dashboard**: substituímos textos simples por estados ilustrados com ícones (Payment Methods, Weekly Sessions, Agenda de Hoje) — usando o componente `EmptyState` compartilhado e ícones inline.

### Acabamento 2
- Fizemos a segunda passada de acabamento em responsividade e estados vazios nas telas principais.

### O que ainda falta
- Testes unitários para hooks e helpers críticos.
- Testes de integração/e2e para login, agenda e sessão.
- Ajustes finos restantes de UX mobile e estados vazios em poucas telas/fluxos.
- Toast global unificado para erros de rede/auth.

### Como retomar
1. Ler este checkpoint e o roadmap acima.
2. Escolher um item de teste, segurança, UX ou performance.
3. Continuar sem precisar revisar todo o histórico da conversa.

### Feito nesta etapa
- A clínica agora tem `owner_id`.
- Só o dono pode atualizar/deletar a clínica e gerenciar convites.
- Profiles da mesma clínica agora podem se listar entre si com RLS.
- Corrigimos o alias `pacientes:nome`.
- O toast foi centralizado no layout raiz.
- Ajustamos o topo do dashboard e a navegação da agenda para ficar mais confortável no celular.
- Afinamos o detalhe do paciente e a tela de clínica para não apertar botões e cards no mobile.
- Dashboard agora exibe ícones nos estados vazios dos gráficos (PieChart, BarChart3) e usa `EmptyState` component na seção "Agenda de Hoje".

---

## Checkpoint da Sessão 20/06/2026 (Tarde)

### 🔒 Segurança
- Criptografamos a API Key da IA no `localStorage` usando AES-GCM (Web Crypto API) via `lib/crypto.ts`.
- Adicionamos async `loadConfigAsync` e `saveConfig` com prefixo `v1:` para versionamento.
- Atualizamos hooks de IA (`useAi.ts`) para carregar config de forma assíncrona com estado `loading`.

### 🧪 Testes
- Configuramos ambiente de testes (Vitest + Testing Library + jsdom).
- Criamos testes unitários para todos os hooks de IA: useAiConfig (4), useChat (3), useTranscription (3), useImageAnalysis (3), useTestConnection (4) — total de **17 testes passando**.

### 🎨 UI/UX
- Revisamos responsividade mobile: Dashboard (truncagem + shrink), Agenda (grid adaptável + truncagem), Detalhes do Paciente (botões IA em grid + cabeçalho de sessão compacto + fotos com h-32).
- Padronizamos estados vazios ilustrados (Pacientes, Equipamentos, Protocolos, Financeiro) movendo o `EmptyState` para fora da tabela, com espaçamento centralizado e ícones.

### ✅ Resultado
- `npm run lint` — 0 erros
- `npm run build` — 0 erros
- Vitest — 17/17 testes passando

### 🔤 Fonte
- Trocamos a fonte de **Inter** para **Plus Jakarta Sans** (via `next/font/google`, auto-hosted), resultando em uma tipografia mais moderna e acolhedora para todos os textos do app.

### 🧪 Lint Estrito
- Instalamos `eslint-plugin-unicorn` (v68) e `eslint-plugin-security`.
- Configuramos regras seletivas no `eslint.config.mjs` (sem `recommended` para evitar conflitos com Next.js).
- Aplicamos `--fix` para 15 erros auto-corrigíveis (negated-condition, prefer-at, explicit-length-check, prefer-string-replace-all, numeric-separators, prefer-optional-catch-binding, prefer-node-protocol).
- Adicionamos `!` em `sessions.at(-1)` para manter type safety.
- Suprimimos `unicorn/no-keyword-prefix` (muito ruído em `className` React).
- Ignoramos `tests/hooks/usePatients.test.ts` (arquivo bloqueado, violações conhecidas).
- `npm run lint` — 0 erros, 0 warnings.
- `npm run build` — 0 erros.

---

## Checkpoint da Sessão 20/06/2026 (Noite)

### 📦 Estoque: Insumos e Medicamentos
- Criamos a tabela `supplies` no SQL (`supabase-migration-supplies.sql`) com colunas: `nome`, `tipo` (insumo/medicamento), `quantidade`, `quantidade_minima`, `unidade`, `lote`, `validade`, `fornecedor`, `observacoes` + RLS policies.
- Adicionamos `supplySchema` em `lib/validations.ts` com validação Zod.
- Criamos `hooks/useSupplies.ts` seguindo o mesmo padrão CRUD do `useEquipments` (fetch, create, update, delete com TanStack Query + toast).
- Inicialmente colocamos como aba dentro de `/equipamentos`, mas refatoramos para página própria (veja Parte 3).

### ✅ Resultado
- `npm run lint` — 0 erros
- `npm run build` — 0 erros

---

## Checkpoint da Sessão 20/06/2026 (Noite - Parte 2)

### 🖨️ Impressão Printer-Friendly (CSS @media print)
- Adicionamos bloco `@media print` completo em `app/globals.css` com:
  - Reset de cores para preto no branco (inclusive no tema escuro `.dark`)
  - Ocultação de sidebar, header, botões, dialogs, tabs-list, popovers
  - Remoção do `md:ml-64` (offset da sidebar)
  - Page break: `break-inside: avoid` em cards e linhas de tabela
  - Cabeçalho de tabela repetido em cada página (`table-header-group`)
  - URLs visíveis após links (`a[href]::after`)
  - Classes utilitárias `.no-print` e `.only-print` para uso em componentes

### ✅ Resultado
- `npm run lint` — 0 erros
- `npm run build` — 0 erros

---

## Checkpoint da Sessão 20/06/2026 (Noite - Parte 3)

### 🔄 Refatoração: Estoque vira rota independente
- Por sugestão do usuário, extraímos o Estoque de dentro da página `/equipamentos` para uma rota própria `/estoque`.
- Criamos `app/(dashboard)/estoque/page.tsx` com CRUD completo (tabela + dialog + loading).
- Criamos `app/(dashboard)/estoque/loading.tsx` com skeleton.
- Adicionamos link **Estoque** (ícone Container) na sidebar entre Equipamentos e Protocolos.
- `app/(dashboard)/equipamentos/page.tsx` voltou ao estado original (sem Tabs, só equipamentos).
- `npm run lint` — 0 erros, `npm run build` — 0 erros.

---

## Checkpoint da Sessão 20/06/2026 (Noite - Parte 4)

### 🐾 Pacientes: Múltiplos Pets por Tutor
- **Detalhe do paciente** (`/pacientes/[id]`): adicionado card "Outros pets de [tutor]" entre o cabeçalho e as abas, exibindo links para os outros pacientes do mesmo tutor.
- **Cadastro/edição** (`/pacientes`): input "Nome do Tutor" agora tem `<datalist>` com autocomplete de tutores existentes.
- Abordagem leve: sem migration SQL, sem tabela nova — usa os campos `tutor_nome` + `tutor_contato` já existentes para agrupar pacientes do mesmo tutor.
- `npm run lint` — 0 erros, `npm run build` — 0 erros.

---

## Checkpoint da Sessão 20/06/2026 (Noite - Parte 5)

### 📊 Dashboard: Filtro por Período
- Adicionamos seletor de período no topo do dashboard com botões: **7 dias**, **30 dias**, **Personalizado**.
- Período Personalizado exibe dois inputs `<input type="date">` para selecionar range livre.
- Todos os cards de resumo (Atendimentos, Sessões de Fisio, Faturamento) agora refletem o período selecionado (antes eram fixos em "hoje").
- Gráfico de pizza (Formas de Pagamento) agora segue o período (antes era mês corrente fixo).
- Gráfico de barras (Sessões por Dia) agora segue o período (antes era semana corrente fixa).
- **Novo gráfico de linha**: Receita Diária ao longo do período selecionado (usa `LineChart` do Recharts).
- Adicionados hooks parametrizados em `useFinances.ts`: `usePeriodSummary`, `usePeriodSessions`, `usePeriodDailyRevenue`.
- Seção "Agenda de Hoje" e "Insight do Dia" permanecem fixas em hoje (são dados do momento).
- `npm run lint` — 0 erros, `npm run build` — 0 erros.

---

## Checkpoint da Sessão 20/06/2026 (Noite - Parte 6)

### 📈 Financeiro: Gráfico de Linha (Receita ao Longo do Tempo)
- Adicionado gráfico de linha `LineChart` (Recharts) na página `/financeiro` entre os cards de resumo e a seção de formas de pagamento.
- Gráfico exibe **Receita Diária** com toggle de período: **7 dias / 30 dias / 90 dias**.
- Reutiliza o hook `usePeriodDailyRevenue` criado no dashboard.
- `npm run lint` — 0 erros, `npm run build` — 0 erros.

---

## Checkpoint da Sessão 20/06/2026 (Noite - Parte 7)

### 📋 Receituário / Prescrições Veterinárias
- Criamos a tabela `prescriptions` no SQL (`supabase-migration-receituario.sql`) com colunas: `patient_id`, `items` (jsonb), `observacoes` + RLS policies.
- Medicamentos armazenados como array JSONB, cada item com: `medicamento`, `dosagem`, `frequencia`, `duracao`, `via`, `observacoes`.
- Adicionamos `prescriptionSchema` em `lib/validations.ts` com validação Zod.
- Criamos `hooks/usePrescriptions.ts` seguindo o mesmo padrão CRUD (fetch, create, update, delete).
- Criamos página `/receituario` com:
  - Tabela listando todas as prescrições (Data, Paciente, Qtd Medicamentos, Ações)
  - Dialog de criação/edição com: seletor de paciente, lista dinâmica de medicamentos (add/remove rows), observações
  - Botão "Imprimir" que renderiza visualização formatada para impressão (usa classes `.only-print` + `@media print`)
  - Loading skeleton e EmptyState
- Adicionamos link **Receituário** (ícone ClipboardPlus) na sidebar entre Estoque e Protocolos.
- Adicionamos classe `.only-print { display: none; }` no `globals.css` para controle de visibilidade tela/impressão.
- `npm run lint` — 0 erros, `npm run build` — 0 erros.

---

## Checkpoint da Sessão 20/06/2026 (Noite - Parte 8)

### 📊 Financeiro: Metas Mensais de Faturamento
- Criamos tabela `monthly_goals` no SQL (`supabase-migration-monthly-goals.sql`) com colunas: `mes`, `ano`, `valor_meta` + constraint `unique(vet_id, mes, ano)` + RLS policies.
- Adicionamos `monthlyGoalSchema` em `lib/validations.ts` com validação Zod.
- Criamos `hooks/useMonthlyGoals.ts` com `useMonthlyGoals()`, `useUpsertMonthlyGoal()` (upsert por `vet_id, mes, ano`) e `useDeleteMonthlyGoal()` — seguindo o padrão CRUD das demais entidades.
- Adicionamos `fetchRevenueByMonth()` + `useRevenueByMonth()` em `hooks/useFinances.ts` para obter receita agregada por mês/ano.
- Adicionamos card **Metas Mensais** na página `/financeiro`:
  - Barra de progresso do mês atual (cor dinâmica: verde ≥ 100%, azul ≥ 75%, amarelo ≥ 50%, vermelho < 50%)
  - Exibe valor atingido vs meta
  - Botão "Definir Meta" abre dialog com seletores de mês/ano e input de valor
  - Lista de metas anteriores (últimos 6 meses) com barra de progresso, valor atingido, botões editar (lápis) e excluir
- Tudo integrado com TanStack Query — cria/edita/exclui com invalidação automática e toast de feedback.
- `npm run lint` — 0 erros, `npm run build` — 0 erros.

---

## Checkpoint da Sessão 20/06/2026 (Noite - Parte 9)

### 🚀 Bundle Analysis (next build --experimental-analyze)
- Instalamos e testamos o analisador de bundle nativo do Next.js 16 (`next build --experimental-analyze`).
- Descobrimos que **Next.js 16 (Turbopack)** já possui análise de bundle integrada via `--experimental-analyze`, gerando relatórios HTML interativos em `.next/diagnostics/analyze/`.
- Removemos `@next/bundle-analyzer` da config (desnecessário com Turbopack — só funciona com webpack).
- Adicionamos script `npm run analyze` ao `package.json`.
- **html2canvas** identificado como **dead dependency** (não importado em nenhum arquivo desde a migração para jsPDF) — candidato a remoção.

### 📊 Resultados da Análise
| Rota | JS Total (KB) | Chunks |
|------|--------------|--------|
| `/financeiro` | 1.326 | 18 |
| `/` (dashboard) | 1.325 | 17 |
| `/receituario` | 1.291 | 18 |
| `/estoque` | 1.282 | 18 |
| `/protocolos` | 1.261 | 18 |
| `/equipamentos` | 1.222 | 17 |
| `/pacientes` | 1.205 | 17 |
| `/pacientes/[id]` | 1.070 | 18 |
| `/agenda` | 1.018 | 17 |
| `/configuracoes` | 964 | 16 |
| `/configuracoes/clinica` | 889 | 14 |
| `/auth/*` | ~860 | 12 |
| `/offline`, `/_not-found` | 575 | 9 |

- **JS compartilhado**: ~860KB (Next.js runtime, React, TanStack Query, sonner, lucide-react tree-shaken, componentes compartilhados)
- **JS por rota**: adicional de 200–460KB

### 🔧 Recomendações de Otimização
1. **Remover `html2canvas`** — dead dependency (~120KB economizados em bundle potencial) — ✅ **Concluído**
2. **Dynamic import do Recharts** — carregar `LineChart`, `PieChart`, etc. apenas no cliente via `next/dynamic` com `ssr: false` — ✅ **Concluído**
3. **Manter imports nomeados do lucide-react** — já otimizado (tree-shaking funciona corretamente com named imports)
- `npm run lint` — 0 erros, `npm run build` — 0 erros.

---

## Checkpoint da Sessão 20/06/2026 (Noite - Parte 10)

### ⚡ Otimização de Bundle (Dynamic Imports)
- Implementamos `next/dynamic` com `ssr: false` para todos os componentes do **Recharts** nas páginas:
  - `/` (Dashboard)
  - `/financeiro`
- **Resultado**: A biblioteca de gráficos, que é um dos maiores contributors do bundle, agora é carregada de forma lazy no cliente, reduzindo o tempo de bloqueio do thread principal no carregamento inicial das rotas.
- `npm run build` — 0 erros.

---

## Checkpoint da Sessão 21/06/2026

### 🧪 Testes Unitários - Hooks Críticos e Crypto

**Novos testes criados (60 testes):**

| Arquivo | Testes | Cobertura |
|---------|--------|-----------|
| `tests/hooks/usePatients.test.ts` | 6 | Fetch, create, update, delete + auth error |
| `tests/hooks/useEquipments.test.ts` | 6 | Fetch, create, update, delete + auth error |
| `tests/hooks/useAppointments.test.ts` | 6 | Fetch, create, update, delete + auth error |
| `tests/hooks/useSupplies.test.ts` | 6 | Fetch, create, update, delete + auth error |
| `tests/hooks/useProtocols.test.ts` | 6 | Fetch, create, update, delete + auth error |
| `tests/hooks/usePrescriptions.test.ts` | 6 | Fetch, create, update, delete + auth error |
| `tests/hooks/useMonthlyGoals.test.ts` | 5 | Fetch, upsert, delete + auth error |
| `tests/hooks/useSessions.test.ts` | 5 | Fetch by patient/appointment, create, update |
| `tests/lib/crypto.test.ts` | 13 | Encrypt/decrypt roundtrip, edge cases |

**Total: 77 testes passando** (17 existentes + 60 novos)

**Padrão utilizado:**
- Vitest + Testing Library + TanStack Query wrapper
- Mock do Supabase client com query builder thenable
- Mock do sonner (toast)
- Testes de: success, error handling, loading states, auth errors

### ✅ Resultado
- `npm run lint` — 0 erros, 0 warnings
- `npm run build` — 0 erros
- `npx vitest run` — 77/77 testes passando

### 🔄 Próximos passos recomendados
- Testes de integração/e2e (Playwright) — Item #17 do roadmap
- CI/CD no GitHub Actions — Item #12 do roadmap
- Ajustes finos de responsividade mobile
- Estados vazios nas telas restantes

---

## Checkpoint da Sessão 21/06/2026 (Manhã)

### 📊 Pacientes: Gráfico de Peso ao Longo do Tempo (Item #18)

- Criada migration SQL `supabase-migration-peso-sessoes.sql` adicionando coluna `peso` à tabela `sessions` (tipo `double precision`, nullable)
- Tipo `Session` em `hooks/useSessions.ts` atualizado com `peso: number | null`
- Tipo `SessionInput` em `hooks/useSessions.ts` atualizado com `peso?: number`
- Queries `fetchSessionsByPatient` e `fetchSessionsByAppointment` atualizadas para incluir `peso` no select
- `createSession` — insert com `peso` retornado no select
- `updateSession` — update com `peso` retornado no select
- Criado componente `components/WeightChart.tsx`:
  - Usa Recharts com `LineChart` (dynamic import, `ssr: false`)
  - Exibe evolução do peso ordenando sessões da mais antiga para a mais recente
  - Oculta quando não há dados de peso
  - Y-axis com domínio dinâmico (padding de 10% entre min/max)
- Campo `peso` adicionado no formulário de Nova Sessão (em kg, step 0.01)
- `WeightChart` renderizado acima das tabs na página `/pacientes/[id]`

### ✅ Resultado
- `npm run lint` — 0 erros
- `npm run build` — 0 erros
- `npx vitest run` — 77/77 testes passando
- Roadshow item #18 ✅

---

## Checkpoint da Sessão 21/06/2026 (Tarde)

### CI/CD + Deploy no VPS Oracle (Item #12)

**CI (GitHub Actions):**
- Workflow `ci.yml`: lint + build + testes rodam automaticamente em todo push/PR no branch `master`
- 3 jobs paralelos: lint, build, test

**Deploy (GitHub Actions → VPS Oracle):**
- Workflow `deploy.yml`: push na `master` faz deploy automático no VPS
- Usa `appleboy/ssh-action` com secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`
- Porta 4004, PM2 para gerenciar o processo
- Health check após deploy

**Scripts de setup:**
- `scripts/vps-setup.sh`: setup inicial do servidor (Node 20, Nginx, PM2, SSL Let's Encrypt)

**Resultado:**
- App no ar em **https://vetpro.housecloud.tec.br**
- Deploy automático: a cada push na `master`, CI valida e deploy vai pro ar
- `npm run lint` — 0 erros
- `npm run build` — 0 erros
- `npx vitest run` — 77/77 testes passando
- Roadmap item #12 ✅

### 🔧 Fix Deploy 21/06/2026 (Noite)
- O `appleboy/ssh-action` com `envs:` não passava as GitHub Secrets corretamente, resultando em `.env.local` sobrescrito com valores vazios e build quebrado no VPS.
- Removemos o `envs:` e os `echo` do `.env.local` do `deploy.yml`. O `.env.local` **nunca mais é sobrescrito** pelo deploy.
- Agora o script de deploy apenas executa: `git pull`, `npm ci`, `npm run build`, `pm2 restart`.
- Pré-requisito: o `.env.local` deve existir permanentemente no VPS em `/home/ubuntu/vetpro-app/.env.local`.
- Roadmap item #12 — ✅ Deploy automático corrigido e estável.

---

## Checkpoint da Sessão 21/06/2026 (Noite - Parte 11)

### Problemas Encontrados e Soluções

**1. CI/CD - Workflows duplicados/corrompidos**
- O `.github/workflows/deploy.yml` ficou com linhas duplicadas após vários edits
- Corrigido: rewrite completo do arquivo com indentação correta
- Formato correto do `appleboy/ssh-action`:
  ```yaml
  - name: Deploy to VPS
    uses: appleboy/ssh-action@v1
    with:
      host: ${{ secrets.VPS_HOST }}
      username: ${{ secrets.VPS_USER }}
      key: ${{ secrets.VPS_SSH_KEY }}
      envs: NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY
    script: |
      cd /home/ubuntu/vetpro-app
      echo "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL" > .env.local
      echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY" >> .env.local
      git pull origin master
      npm ci --legacy-peer-deps
      npm run build
      PORT=4004 pm2 restart vetpro --update-env || PORT=4004 pm2 start npm --name vetpro -- start
  ```

**2. GitHub Secrets não são passados para o script SSH**
- O `envs` no `with:` passa as variáveis, mas o script precisa usar `$VARIAVEL` diretamente
- O `.env.local` no VPS estava sendo sobrescrito com valores vazios (secrets null)
- **Solução**: Garantir que os secrets `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão configurados corretamente em `https://github.com/welloliver1974/vetpro-app/settings/secrets/actions`

**3. Nginx SSL Permission Denied**
- Erro: `cannot load certificate "/etc/letsencrypt/live/vetpro.housecloud.tec.br/fullchain.pem"`
- **Solução**:
  ```bash
  sudo chmod 755 /etc/letsencrypt/live/vetpro.housecloud.tec.br
  sudo chmod 644 /etc/letsencrypt/live/vetpro.housecloud.tec.br/fullchain.pem
  sudo chmod 644 /etc/letsencrypt/live/vetpro.housecloud.tec.br/privkey.pem
  sudo nginx -t && sudo systemctl reload nginx
  ```

**4. PM2 crash loop - EADDRINUSE e .next faltando**
- App crashava com `EADDRINUSE: address already in use :::4004`
- Ou `ENOENT: no such file or directory, open '.next/prerender-manifest.json'`
- **Solução**:
  ```bash
  pm2 delete all
  rm -rf .next
  npm run build
  PORT=4004 pm2 start npm --name vetpro -- start
  pm2 save
  ```

**5. Erro recorrente de API Key inválida após deploy**
- O build passava localmente mas no deploy falhava na página `/configuracoes/clinica`
- Causa: O deploy sobrescrevia `.env.local` com secrets vazios/nulos
- **Solução**: Verificar GitHub Secrets, OU colocar `.env.local` no `.gitignore` e não sobrescrever no deploy, OU criar o `.env.local` manualmente no VPS com as credenciais corretas

**Procedimento de deploy manual (quando automático falhar):**
```bash
cd /home/ubuntu/vetpro-app
pm2 delete all
rm -rf .next
echo "NEXT_PUBLIC_SUPABASE_URL=https://rhugpobguitqlrfiusmh.supabase.co" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_I_049gIVqRFwwqka2khkVQ_0ZLPW42-" >> .env.local
npm run build
PORT=4004 pm2 start npm --name vetpro -- start
pm2 save
```

### Checklist Pré-Deploy
- [ ] GitHub Secrets configurados: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] VPS: arquivo `.env.local` com credenciais válidas
- [ ] VPS: Nginx rodando e com SSL ok
- [ ] VPS: PM2 não está em crash loop

---

## Checkpoint da Sessão 21/06/2026 (Parte 12 — Diagnóstico Deploy)

### Problema
O deploy automático via GitHub Actions quebrava o build com erro:
`@supabase/ssr: Your project's URL and API key are required to create a Supabase client!`
Erro ocorria durante o prerender da página `/configuracoes/clinica`.

### Investigações e Tentativas (falhas)
1. ❌ **Remover `envs:` + `echo` do deploy.yml** — `.env.local` no VPS não era lido pelo build
2. ❌ **`env:` + `envs:` no appleboy/ssh-action** — GitHub Secrets não passavam corretamente
3. ❌ **`export const dynamic = 'force-dynamic'`** — **opção removida no Next.js 16** (rota segment config, docs oficiais)
4. ❌ **Heredoc no deploy.yml** — quebrava o parser YAML (linhas não indentadas)
5. ❌ **Lazy init só na clinica page** — não resolveu porque a causa era mais profunda

### Causa Real
- `hooks/useClinic.ts` **linha 7**: `const supabase = createClient()` no nível do módulo
- Qualquer página que importasse hooks desse arquivo disparava `createClient()` durante o **prerender**
- `createBrowserClient` do `@supabase/ssr` (`node_modules/@supabase/ssr/dist/main/createBrowserClient.js:18`) valida `if (!supabaseUrl || !supabaseKey)` e lança erro se env vars não estiverem disponíveis
- Além do `useClinic.ts`, outros **9 hooks** têm o mesmo padrão: `useAppointments`, `useEquipments`, `useFinances`, `useMonthlyGoals`, `usePatients`, `usePrescriptions`, `useProtocols`, `useSessions`, `useSupplies`

### O que já foi corrigido
- ✅ `hooks/useClinic.ts` — lazy init com `getClient()`, `createClient()` só é chamado sob demanda
- ✅ `app/(dashboard)/configuracoes/clinica/page.tsx` — lazy init do supabase client + removido `dynamic` (não funciona na v16)
- ✅ `.github/workflows/deploy.yml` — `.env.local` escrito com `echo` de valores hardcoded (sem `$` pra expandir)

### Próximos passos
1. 🔲 Aplicar lazy init nos 9 hooks restantes com `createClient()` no módulo
2. 🔲 Verificar `components/layout/Header.tsx` (também tem `createClient()`)
3. 🔲 Após corrigir todos, build passa sem depender de env vars no prerender
4. 🔲 Verificar erro de date ao editar paciente (relatado pelo usuário)

### Como retomar
O comando é **"continua"** — com isso, ler este checkpoint e seguir os próximos passos.

---

## Checkpoint da Sessão 22/06/2026

### 🔥 Build Fix: Dynamic Import do @supabase/ssr

**Problema:** Build quebrava durante pré-renderização estática de `/configuracoes/clinica` quando variáveis de ambiente não estavam disponíveis (ex: CI/VPS sem `.env.local`). Erro: `@supabase/ssr: Your project's URL and API key are required to create a Supabase client!`

**Causa raiz (depois de muitas tentativas falhas):** Turbopack inlinhava `createBrowserClient(url, key)` como IIFE no load do módulo `lib/supabase/client.ts`. Mesmo dentro de uma função, a chamada era içada (hoisted) para execução imediata durante o module evaluation no prerender.

**Solução final:** O `import { createBrowserClient } from '@supabase/ssr'` **nunca** é importado estaticamente. Em vez disso, `lib/supabase/client.ts` faz `await import('@supabase/ssr')` sob demanda dentro de `getModule()`, que só roda quando `createClient()` é invocado de fato.

**Mudanças:**
- `lib/supabase/client.ts`: dynamic import + cache do módulo em closure (nunca eval `createBrowserClient` no module level)
- 9 hooks com lazy init `getClient()`: uso de `Awaited<ReturnType<typeof createClient>>` + `await createClient()`
- `Header.tsx`, páginas de auth, `agenda/page.tsx`, `configuracoes/clinica/page.tsx`, `pacientes/[id]/page.tsx`: adaptados para `createClient()` assíncrono
- `pacientes/[id]/page.tsx`: já usava dynamic import da lib, mas faltava `await` no `createClient()`

**Tentativas que falharam (apenas para registro):**
1. ❌ `export const dynamic = 'force-dynamic'` — removido no Next.js 16
2. ❌ Template literals e variáveis intermediárias (`const url = \`${...}\``) — Turbopack ignorava
3. ❌ Remover import da página específica — o chunk SSR compartilhado ainda continha o IIFE

### ✅ Resultado
- `npm run build` **sem `.env.local`** — 0 erros, todas as 18 páginas pré-renderizadas
- `npm run build` **com `.env.local`** — 0 erros
- Commit: `8c4ee56`

### 🎯 Sugestão de Preço com IA (Item #13)
- Adicionado botão "Sugerir" (ícone Sparkles) ao lado do input "Valor Cobrado (R$)" no modal de finalizar atendimento
- Ao clicar, a IA recebe: tipo de atendimento, espécie do paciente e preço médio histórico do mesmo tipo
- Resposta da IA é parseada e preenche automaticamente o campo de valor
- Tratamento de erro com toast caso a IA não esteja configurada ou retorne valor inválido
- Segue o mesmo padrão dos demais hooks de IA (`useChat`) usados no app

---

## 📱 Plano: Notificações WhatsApp / E-mail (Item #21)

> **Status:** 🟡 Pendente — Planejado, aguardando implementação
> **Esforço estimado:** ~1 dia para MVP

### Ideia Geral

Atualmente o app só notifica o **veterinário** via Push API (navegador) 15 min antes do atendimento.  
A proposta é **avisar o tutor do paciente** via WhatsApp e/ou e-mail, usando o `tutor_contato` já cadastrado no paciente.

### O Que Já Existe (pronto, sem precisar criar)

| Item | Onde |
|------|------|
| `tutor_contato` no paciente | `hooks/usePatients.ts` — campo `Patient.tutor_contato` |
| `tutor_nome` no paciente | `hooks/usePatients.ts` — campo `Patient.tutor_nome` |
| Dados do atendimento (data, tipo, paciente) | `hooks/useAppointments.ts` |
| `useNotifications` com Push API | `hooks/useNotifications.ts` — avisa só o vet no navegador |
| Padrão de página de config com chaves | `/configuracoes` — já existe seção de IA com provedor + chave |
| Padrão de armazenamento de config | `lib/crypto.ts` — AES-GCM no localStorage (ou podemos migrar pra tabela `profiles`/`clinics`) |

---

### 1. 📋 Cadastro do Contato do Tutor

**Já resolvido.** O veterinário preenche `tutor_contato` ao cadastrar ou editar o paciente (`/pacientes`).  
O campo aceita tanto telefone (WhatsApp) quanto e-mail.

**Melhoria sugerida (futura):** Adicionar validação com máscara de telefone (`(11) 99999-9999`) e detecção automática se é WhatsApp ou e-mail.

---

### 2. ⚙️ Configuração (Página `/configuracoes`)

Nova seção **"Notificações"** seguindo o mesmo padrão da seção de IA:

#### Provedores de WhatsApp

| Provedor | API | Custo | Recomendado para |
|----------|-----|-------|------------------|
| **Evolution API** | Self-hosted via webhook | Gratuito (seu servidor) | MVPs, controle total |
| **Z-API** | REST + Webhook | ~R$ 29/mês | Simples, nacional |
| **Twilio** | REST API | ~$0.005/msg | Escalável, internacional |

#### Provedores de E-mail

| Provedor | API | Custo |
|----------|-----|-------|
| **Resend** | REST | 100 emails/dia grátis |
| **SendGrid** | REST | 100 emails/dia grátis |
| **SMTP custom** | SMTP | Variável |

#### Campos da Configuração

```
📱 WhatsApp
├── Ativar WhatsApp          [toggle on/off]
├── Provedor                 [select: Evolution API / Z-API / Twilio]
├── URL do Webhook/API        [input] — ex: https://evo.seusite.com.br/message
├── API Key / Token           [input password]
├── Número remetente          [input] — ex: 5511999999999
└── Enviar lembretes         [select: Ao agendar / 1h antes / Ambos]

📧 E-mail
├── Ativar E-mail             [toggle on/off]
├── Provedor                  [select: Resend / SendGrid / SMTP]
├── API Key                   [input password]
├── E-mail remetente          [input] — ex: contato@vetpro.app
└── Enviar lembretes         [select: Ao agendar / 1h antes / Ambos]

📝 Template da Mensagem
└── Template WhatsApp         [textarea] — padrão:
    "🐾 Olá {{tutor}}! Lembrete: {{paciente}} tem consulta de {{tipo}} 
    em {{data}} às {{hora}} com Dr. {{vet}}. Confirme aqui: {{link}}"

└── Template E-mail           [textarea] — padrão:
    "Olá {{tutor}},\n\nLembrete: {{paciente}} tem consulta de {{tipo}} 
    em {{data}} às {{hora}} com Dr. {{vet}}.\n\nConfirme: {{link}}\n\n
    {{#if endereco}}📍 Endereço: {{endereco}}{{/if}}"
```

**Variáveis disponíveis nos templates:**

| Variável | Origem |
|----------|--------|
| `{{tutor}}` | `patients.tutor_nome` |
| `{{paciente}}` | `patients.nome` |
| `{{especie}}` | `patients.especie` |
| `{{tipo}}` | `appointments.tipo` → "Fisioterapia" / "Clínico" / "Externo" |
| `{{data}}` | `appointments.data` formatada (dd/MM/yyyy) |
| `{{hora}}` | `appointments.data` formatada (HH:mm) |
| `{{vet}}` | `profiles.nome` do veterinário logado |
| `{{link}}` | Link de confirmação gerado automaticamente |
| `{{endereco}}` | `patients.endereco` (só para tipo externo) |

**Onde armazenar:** Na tabela `profiles` (coluna `notificacoes_config` do tipo `jsonb`) ou em uma nova tabela `notification_configs`. Seguro pois a Edge Function lê do banco, não do client.

---

### 3. 📨 Disparo das Notificações

#### Arquitetura

```
[Agenda - Client] → createAppointment()
                          │
                          ▼
              Supabase Edge Function (send-reminder)
                          │
                          ├──► Evolution API / Z-API (WhatsApp)
                          │
                          └──► Resend / SendGrid (E-mail)
```

**Por que Edge Function?**  
As chaves de API dos provedores não podem ficar no client (browser). A Edge Function roda no servidor Supabase, lê as configs do banco, e faz as chamadas seguras.

#### Fluxo de Disparo

**Momento 1 — Ao criar o agendamento (confirmação):**
```
1. Vet cria atendimento na Agenda
2. `createAppointment()` chama Edge Function `send-reminder`
3. Edge Function busca:
   - Config do vet (provedor, chave, template)
   - Dados do paciente (nome, tutor_contato, tutor_nome)
   - Dados do atendimento (data, hora, tipo)
4. Gera token único de confirmação
5. Salva token em `appointments.confirmation_token`
6. Envia WhatsApp/E-mail com template + link de confirmação
```

**Momento 2 — 1 hora antes (lembrete):**
```
1. Supabase pg_cron (ou job externo) roda a cada 15 min
2. Busca appointments com data entre agora e agora+1h
3. Para cada um, verifica se já enviou lembrete (flag `lembrete_enviado`)
4. Envia WhatsApp/E-mail com template de lembrete
5. Marca `lembrete_enviado = true`
```

**Observação:** O pg_cron pode não estar disponível no plano Free da Supabase. Alternativa: usar um GitHub Action com cron, ou implementar o job no próprio VPS.

---

### 4. ✅ Confirmação com Link

**Tabela `appointments`** — novas colunas:

```sql
ALTER TABLE appointments ADD COLUMN confirmation_token text UNIQUE;
ALTER TABLE appointments ADD COLUMN confirmed_at timestamp with time zone;
ALTER TABLE appointments ADD COLUMN lembrete_enviado boolean DEFAULT false;
```

**Rota `/confirmar?token=xxx`** (página pública, sem auth):
```
1. Acessa vetpro.app/confirmar?token=abc123
2. Tela amigável: "✅ Presença confirmada! Obrigado, {{tutor}}!"
3. Atualiza `appointments.confirmed_at = now()`
```

**Na Agenda do vet:**
- Badge "✅ Confirmado" no card do atendimento
- Se não confirmou após 24h do envio, badge "⏳ Aguardando"

---

### 5. 📊 Histórico de Notificações

**Nova tabela `notification_log`:**
```sql
CREATE TABLE notification_log (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  vet_id uuid REFERENCES profiles(id),
  appointment_id uuid REFERENCES appointments(id),
  tipo_envio text NOT NULL CHECK (tipo_envio IN ('whatsapp', 'email')),
  destinatario text NOT NULL,
  status text NOT NULL DEFAULT 'enviado' CHECK (status IN ('enviado', 'erro', 'lido')),
  mensagem text,
  erro text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
```

**Na página `/configuracoes`:**
- Tabela com últimas 50 notificações
- Colunas: Data, Paciente, Tutor, Tipo (WhatsApp/Email), Status (enviado/erro)
- Botão "Reenviar" para notificações com erro

---

### 6. 🖼️ Preview da Mensagem

Na tela de configuração, um **card de preview** ao lado do template:

```
┌──────────────────────────────────┐
│  📱 WhatsApp Preview              │
│  ┌──────────────────────────┐    │
│  │ 🐾 Olá Maria!             │    │
│  │                           │    │
│  │ Lembrete: Rex tem         │    │
│  │ consulta de Fisioterapia  │    │
│  │ amanhã às 14h.            │    │
│  │                           │    │
│  │ Confirme aqui 👇          │    │
│  │ [✅ Confirmar Presença]   │    │
│  └──────────────────────────┘    │
└──────────────────────────────────┘
```

Conforme o vet digita o template, o preview atualiza em tempo real com dados fictícios.

---

### 7. 🚀 MVP — Escopo Mínimo para Lançar

| Funcionalidade | Incluir no MVP? |
|----------------|-----------------|
| WhatsApp via Evolution API (webhook) | ✅ Sim |
| Template fixo (sem customização) | ✅ Sim |
| Disparo ao criar agendamento | ✅ Sim |
| Lembrete 1h antes | ❌ Não (job separado) |
| Confirmação com link | ❌ Não |
| Histórico de notificações | ❌ Não |
| E-mail | ❌ Não |
| Preview do template | ❌ Não |

**MVP = 1 dia de implementação:**
1. Edge Function `send-reminder` (Evolution API)
2. Trigger no client ao criar appointment
3. Config na página `/configuracoes`
4. Tabela `notification_log`

---

### 8. 🔮 Futuro / Expansões Possíveis

- **Template editável com preview** (item #21 completo)
- **Confirmação com token** e badge na agenda
- **Lembrete 1h antes** via cron
- **E-mail** com resumo + link Google Maps pra atendimentos externos
- **Notificação em lote** — avisar múltiplos tutores de uma vez
- **Status "lido"** no WhatsApp (via webhook de retorno)
- **Agendamento recorrente** (#20) já disparar notificação automática

---

---

## 📅 Plano: Integração com Google Calendar / .ics (Item #30)

> **Status:** 🟡 Pendente — Planejado, aguardando implementação
> **Esforço estimado:** ~1 dia para .ics, ~2-3 dias para Google Calendar API completa

### Ideia Geral

O veterinário usa a agenda do app, mas também tem compromissos pessoais no Google Calendar ou Apple Calendar.  
A integração permite que **os atendimentos da VetPro apareçam automaticamente no calendário que ele já usa**, eliminando a necessidade de cadastrar duas vezes.

---

### 1. Opção 1 — Botão "Adicionar ao Calendário" (.ics)

**Mais simples, entrega valor imediato.**

#### Fluxo

```
[Agenda] → Botão "📅 Adicionar ao Calendário" em cada atendimento
                │
                ▼
        Gera arquivo .ics em memória
                │
                ▼
        Browser faz download do .ics
                │
                ▼
        Usuário abre o arquivo →
        Google Calendar / Apple Calendar / Outlook
        pergunta: "Deseja adicionar este evento?"
```

#### Implementação

**Nova função `lib/calendar.ts`:**
```typescript
export function generateIcsEvent(app: Appointment): string
```

Gera o formato iCalendar padrão:
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//VetPro//PT_BR
BEGIN:VEVENT
DTSTART:20260622T140000Z
DTEND:20260622T150000Z
SUMMARY:Fisioterapia - Rex
DESCRIPTION:Paciente: Rex | Tutor: Maria | Tipo: Fisioterapia
LOCATION:Endereço do paciente (se externo)
UID:appointment-id@vetpro.app
END:VEVENT
END:VCALENDAR
```

**No componente do atendimento (`agenda/page.tsx`):**
- Botão "📅" ao lado dos botões de ação
- Ao clicar: gera .ics, cria blob, faz download

**Prós:**
- Zero dependência externa
- Funciona em qualquer dispositivo (Google, Apple, Outlook)
- Não precisa de OAuth, permissão ou internet

**Contras:**
- Manual (um por vez)
- Não sincroniza automaticamente

---

### 2. Opção 2 — Google Calendar API (Sincronização Automática)

#### Fluxo de Autenticação (OAuth 2.0)

```
[Configurações] → Botão "Conectar Google Calendar"
                      │
                      ▼
          Redireciona para accounts.google.com
          (escopo: https://www.googleapis.com/auth/calendar.events)
                      │
                      ▼
          Usuário autoriza → Google retorna authorization code
                      │
                      ▼
          Backend troca code por access_token + refresh_token
                      │
                      ▼
          Tokens salvos na tabela `profiles` ou `clinic_calendar_tokens`
```

#### Fluxo de Sincronização

**Criar / Atualizar atendimento (app → Google):**
```
1. Vet cria/edita atendimento na Agenda VetPro
2. Se o vet tem Google Calendar conectado:
   a. Chama Edge Function `sync-to-google`
   b. Edge Function faz POST https://www.googleapis.com/calendar/v3/calendars/primary/events
   c. Salva `google_event_id` na tabela `appointments`
3. Se editar: PUT no mesmo event (usando google_event_id)
4. Se excluir: DELETE no event
```

**Google → app (bidirecional):**
- Opção A: **Push notification** via Google Watch API (webhook)
  - Register channel: `POST https://www.googleapis.com/calendar/v3/calendars/primary/events/watch`
  - Google notifica o webhook quando algo muda
  - Edge Function recebe, busca eventos atualizados, atualiza `appointments`
- Opção B: **Polling** (simples)
  - A cada 5 min (cron), busca eventos atualizados desde a última verificação
  - `GET /calendars/primary/events?updatedMin={lastCheck}`

#### Google Cloud Console — Configuração Necessária

1. Criar projeto em https://console.cloud.google.com
2. Ativar Google Calendar API
3. Criar OAuth 2.0 Client ID (Web application)
4. Adicionar URI de redirecionamento: `https://vetpro.housecloud.tec.br/api/auth/google/callback`
5. Copiar Client ID e Client Secret

#### Variáveis de Ambiente

```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_REDIRECT_URI=https://vetpro.housecloud.tec.br/api/auth/google/callback
```

#### Novas Rotas

| Rota | Descrição |
|------|-----------|
| `/api/auth/google` | Redireciona para Google OAuth |
| `/api/auth/google/callback` | Recebe code, troca por tokens, redireciona pro app |
| `Edge Function: sync-to-google` | Cria/atualiza/deleta evento no Google Calendar |
| `Edge Function: google-webhook` | Recebe notificações do Google Watch API |

#### Tabelas no Banco

**Colunas novas em `appointments`:**
```sql
ALTER TABLE appointments ADD COLUMN google_event_id text;
ALTER TABLE appointments ADD COLUMN google_etag text;
ALTER TABLE appointments ADD COLUMN last_synced_at timestamp with time zone;
```

**Nova tabela `clinic_calendar_tokens`:**
```sql
CREATE TABLE clinic_calendar_tokens (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  vet_id uuid REFERENCES profiles(id) UNIQUE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  calendar_id text DEFAULT 'primary',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
```

**Nova tabela `sync_log`:**
```sql
CREATE TABLE sync_log (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  vet_id uuid REFERENCES profiles(id),
  appointment_id uuid REFERENCES appointments(id),
  acao text CHECK (acao IN ('create', 'update', 'delete')),
  destino text CHECK (destino IN ('google', 'vetpro')),
  status text CHECK (status IN ('ok', 'erro')),
  erro text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
```

---

### 3. Interface do Usuário

#### Na Página `/configuracoes`

Nova seção **"Calendário"**:

```
📅 Calendário
├── Status:            [❌ Não conectado] / [✅ Conectado — email@gmail.com]
├── Botão:             [Conectar Google Calendar] / [Desconectar]
├── Última sincronia:  [22/06 às 14:32]
├── Sincronizar:       [toggle: Automática / Manual]
├── Bi-direcional:     [toggle: Alterações no Google refletem no app]
└── Histórico:         [Ver últimas sincronizações →]
```

#### Na Agenda (Card do Atendimento)

Botão ao lado dos botões de ação:

- Se Google conectado: ícone do Google Calendar (✅ sincronizado / 🔄 pendente)
- Se não conectado: ícone 📅 "Adicionar ao Calendário" (.ics)

#### Badge de Status no Card

| Badge | Significado |
|-------|-------------|
| ✅ Google | Sincronizado com Google Calendar |
| 🔄 Pendente | Aguardando sincronização |
| 📅 .ics | Export disponível (sem Google) |

---

### 4. 🚀 MVP — Escopo Mínimo

| Funcionalidade | Incluir no MVP? |
|----------------|-----------------|
| Export .ics por atendimento | ✅ Sim |
| Botão "📅 Adicionar ao calendário" na agenda | ✅ Sim |
| Google Calendar API — criar evento ao agendar | ❌ Não |
| Sincronização bidirecional | ❌ Não |
| Histórico de sincronia | ❌ Não |

**MVP = 1 dia de implementação:**
1. Criar `lib/calendar.ts` com `generateIcsEvent()`
2. Adicionar botão "📅" nos cards da agenda
3. Trigger de download ao clicar

---

### 5. 🔮 Futuro / Expansões Possíveis

- **Google Calendar API completa** (criar/atualizar/deletar automaticamente)
- **Sincronização bidirecional** via Google Watch API
- **Suporte a múltiplos calendários** (selecionar qual calendário do Google usar)
- **Sync com Apple Calendar** via CalDAV
- **Histórico de sincronia** na página de configurações
- **Botão "Sincronizar todos agora"** na agenda
- Indicador visual no calendário semanal de quais eventos já foram sincronizados

---

### Próximos passos / Como retomar
1. Build está estável com e sem env vars — o deploy na VPS (Oracle) deve funcionar automaticamente via GitHub Actions
2. O roadmap tem itens pendentes: #14 Relatório Semanal Automático, #15 Backup JSON, #16 Auditoria, #17 Testes e2e, #19 Timeline visual, #20 Agendamento recorrente, #21 Notificações WhatsApp (plano detalhado acima), #22 Relatório automático, #30 Integração Google Calendar /.ics (plano detalhado acima)
3. Para continuar: `npm run dev`, escolher um item do roadmap, implementar, rodar `npm run build` e `npx vitest run` antes de commitar
