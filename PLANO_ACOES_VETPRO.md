# 📋 Plano de Ações — VetPro App

> **Data:** 05/07/2026
> **Baseado na análise completa do código-fonte e arquitetura do app.**

---

## 🎯 Priorização

| Prioridade | Item | Esforço | Impacto | Roadmap |
|-----------|------|---------|---------|---------|
| 🔥 P0 | **#1 — Ativar WhatsApp (escanear QR)** | 5 min | Alto | #21 |
| 🔥 P0 | **#2 — Testes e2e com Playwright** | 2-3 dias | Alto | #17 |
| 🟡 P1 | **#3 — Refatorar páginas monolíticas** | 1-2 dias | Médio | — |
| 🟡 P1 | **#4 — Gerar tipos do Supabase** | 1 hora | Médio | — |
| 🟢 P2 | **#5 — Máscara de telefone** | 1 hora | Baixo | — |
| 🔵 P3 | **#6 — Relatório PDF automático** | 1 dia | Médio | #22 |
| 🔵 P3 | **#7 — Papéis/Permissões** | 2-3 dias | Alto | #24 |
| 🔵 P3 | **#8 — Busca Inteligente (pgvector)** | ✅ Concluído (23/07) | Alto | #28 |
| 🔵 P3 | **#9 — Internacionalização (i18n)** | 3-4 dias | Médio | #29 |

---

## 🔥 P0 — Fazer Primeiro (Alto Impacto, Pouco Esforço)

### #1 — Ativar WhatsApp (Escanear QR Code)

**O quê:** Acessar `https://evo.vetpro.housecloud.tec.br/manager`, instância `vetpro`, escanear QR Code com o WhatsApp da clínica.

**Por quê:** Toda a infra está pronta e testada (Edge Function, Evolution API, Nginx, SSL). A mensagem já é montada corretamente. Falta apenas este passo para o MVP de notificações ficar 100% operacional.

**Como testar:**
1. Escanear QR no manager
2. No app, ir em `/configuracoes` e preencher:
   - URL: `https://evo.vetpro.housecloud.tec.br`
   - API Key: (ver .env da VPS)
   - Instance: `vetpro`
3. Criar um agendamento de teste com paciente que tenha `tutor_contato`
4. Verificar `notification_log` no Supabase (status = `enviado`)

---

### #2 — Testes e2e com Playwright (Item #17 do Roadmap)

**O quê:** Criar testes end-to-end cobrindo o fluxo principal do app.

**Por quê:** 77 testes unitários é ótimo, mas não garantem que o fluxo completo (login → criar paciente → agendar → finalizar → ver no financeiro) funciona. Playwright testa no browser real.

**Estimativa:** 2-3 dias

#### Fluxos a testar:

| Fluxo | Descrição |
|-------|-----------|
| **Login > Dashboard** | Autenticação, ver widgets carregando |
| **Criar paciente** | Formulário, validação Zod, confirmação toast |
| **Agendar atendimento** | Selecionar paciente, data, tipo, ver no calendário |
| **Finalizar atendimento** | Modal, valor, forma de pagamento, assinatura |
| **Ver no Financeiro** | Card do mês atualiza, histórico mostra o registro |
| **Sessão no paciente** | Criar sessão com notas + fotos |
| **Tema escuro/claro** | Toggle no header |
| **Offline banner** | Desativar rede, ver banner |
| **Responsividade** | Testar em viewport mobile (375px) |

#### Implementação sugerida:

```bash
npm init playwright@latest -- --ct
# ou: npx playwright install
```

**Estrutura:**
```
tests/
  e2e/
    auth.setup.ts          # Login + cookie
    dashboard.spec.ts      # Dashboard widgets
    patients.spec.ts       # CRUD pacientes
    agenda.spec.ts         # Agenda + finalizar
    financeiro.spec.ts     # Financeiro
    mobile.spec.ts         # Responsivo
```

**Configuração `playwright.config.ts`:**
- Projeto `setup` (login via API do Supabase)
- Projetos `chromium`, `firefox`, `mobile-chrome`
- CI: rodar no GitHub Actions `ci.yml`

---

## 🟡 P1 — Fazer em Seguida

### #3 — Refatorar Páginas Monolíticas

**O quê:** Quebrar `agenda/page.tsx` (~850 linhas) e `pacientes/[id]/page.tsx` (~750 linhas) em componentes menores.

**Por quê:** Páginas desse tamanho são difíceis de manter, testar e reutilizar. Um desenvolvedor novo no projeto demora muito para entender o que cada parte faz.

#### Agenda — Componentes sugeridos:

```
components/agenda/
  CalendarGrid.tsx          # Grid semanal/mensal
  DayView.tsx               # Visão diária vertical
  AppointmentCard.tsx       # Card de atendimento
  CreateAppointmentDialog.tsx  # Dialog de criação
  FinishAppointmentDialog.tsx  # Dialog de finalização
  RecurrenceConfig.tsx      # Config de repetição
  AgendaFilters.tsx         # Filtros
```

#### Detalhe do Paciente — Componentes sugeridos:

```
components/patient/
  PatientHeader.tsx         # Cabeçalho com nome + actions
  SessionList.tsx           # Lista de sessões
  SessionCard.tsx           # Card de sessão individual
  NewSessionDialog.tsx      # Dialog de nova sessão
  PhotoGallery.tsx          # Galeria + comparador IA
  AnamneseForm.tsx          # Ficha médica editável
  SiblingPets.tsx           # Card de outros pets
  AISessionActions.tsx      # Botões de IA (relatório, previsão)
```

---

### #4 — Gerar Tipos TypeScript do Supabase

**O quê:** Usar `supabase gen types` para gerar tipos automáticos do banco.

**Por quê:** Hoje os tipos (`Patient`, `Appointment`, etc.) são definidos manualmente nos hooks. Qualquer alteração no banco (migration) exige atualização manual em múltiplos arquivos. Com tipos gerados, isso fica automático.

**Passos:**
```bash
supabase gen types --linked > lib/supabase/database.types.ts
```

Depois, usar `Database['public']['Tables']['patients']['Row']` no lugar dos tipos manuais.

**Onde atualizar:** hooks que têm `type Patient = { ... }` — cerca de 11 hooks com tipos manuais.

---

## 🟢 P2 — Fácil/Rápido

### #5 — Máscara de Telefone no `tutor_contato`

**O quê:** Adicionar máscara de telefone brasileiro `(11) 99999-9999` no campo `tutor_contato` dos pacientes.

**Por quê:** O número é usado pelo WhatsApp. Números mal formatados (sem DDD, sem 9, com espaços inconsistentes) podem quebrar o envio. A máscara garante padronização.

**Implementação:**
1. Criar `lib/phone.ts` com função de máscara + validação
2. Atualizar `Input` do `tutor_contato` em `pacientes/page.tsx` com `onChange` que aplica máscara
3. Exportar número limpo (só dígitos) pro WhatsApp

---

## 🔵 P3 — Roadmap Futuro (Itens Oficiais)

### #6 — Relatório PDF Automático (Item #22)

**O quê:** Enviar PDF mensal de evolução automaticamente para o tutor.

**Pré-requisito:** WhatsApp funcionando (#1)

**Como fazer:**
1. Reaproveitar `components/vet/ReportPDF.tsx` para gerar PDF no servidor
2. Edge Function que gera PDF e envia via WhatsApp
3. Cron job (GitHub Actions) no início de cada mês

---

### #7 — Papéis/Permissões (Item #24)

**O quê:** Controle de acesso por função: admin, veterinário, assistente.

**Como fazer:**
1. Coluna `funcao` na tabela `profiles` (`admin | vet | assistente`)
2. RLS policies adaptadas por função
3. Assistente: só vê agenda e pacientes (não edita financeiro)
4. Admin: gerencia membros + deleta dados

---

### #8 — Busca Inteligente pgvector (Item #28)

**O quê:** Busca semântica em pacientes e sessões usando embeddings.

**Como fazer:**
1. Habilitar extensão `pgvector` no Supabase
2. Criar coluna `embedding` nas tabelas `patients` e `sessions`
3. Gerar embeddings com IA (mesmo provedor configurado)
4. Input de busca "natural": *"cachorro com problema no joelho que fez laser semana passada"*

---

### #9 — Internacionalização (Item #29)

**O quê:** Suporte a múltiplos idiomas (inglês, espanhol).

**Estimativa:** 3-4 dias (esforço maior pela quantidade de strings)

**Ferramenta sugerida:** `next-intl` ou `react-i18next`

---

## ✅ Sessão 05/07/2026 — Concluído 🎉

### Refatoração da Agenda (Item #3 do Plano)

Extraímos **6 componentes** da página `app/(dashboard)/agenda/page.tsx`, reduzindo de **~850 para ~390 linhas**:

| # | Componente | Arquivo | Linhas |
|---|-----------|---------|--------|
| 1 | **AgendaFilters** | `components/agenda/AgendaFilters.tsx` | ~40 |
| 2 | **RecurrenceConfig** | `components/agenda/RecurrenceConfig.tsx` | ~75 |
| 3 | **CreateAppointmentDialog** | `components/agenda/CreateAppointmentDialog.tsx` | ~80 |
| 4 | **FinishAppointmentDialog** | `components/agenda/FinishAppointmentDialog.tsx` | ~120 |
| 5 | **AppointmentCard** | `components/agenda/AppointmentCard.tsx` | ~95 |
| 6 | **CalendarGrid** | `components/agenda/CalendarGrid.tsx` | ~55 |

### Melhorias adicionais

- **`lib/calendar.ts`**: função `generateRecurringDates` movida para cá (antes duplicada na página e no componente), junto com `generateIcsEvent` e `downloadIcs`
- **Imports limpos**: 11 imports órfãos removidos da página (`Badge`, `SignaturePad`, `Sparkles`, `Filter`, `MapPin`, `ExternalLink`, `Calendar`, `CheckCircle2`, `Trash2`, `Dialog*`, `Select*`, `Input`, `Label`, `isSameMonth`, `isToday`)
- **Componentes sem dead code**: imports não utilizados removidos de `CreateAppointmentDialog` (`useState`, `useEffect`, `format`, `parseISO`, `setHours`, `setMinutes`, `ptBR`) e de `RecurrenceConfig` (`generateRecurringDates` local)

### Validação

| Verificação | Resultado |
|------------|-----------|
| `npm run build` | ✅ 0 erros |
| `npm run lint` | ✅ 0 erros, 0 warnings |
| Code review | ✅ Extrações limpas, sem regressão |

---

## 📋 Próximos Passos (Recomendação)

| Prioridade | Item | Esforço |
|-----------|------|---------|
| 🔥 | Escanear QR da Evolution API | 5 min |
| 🔥 | Refatorar **Paciente Detalhe** (`pacientes/[id]/page.tsx` ~750 linhas) | 2-3h |
| 🟡 | Gerar tipos do Supabase (`supabase gen types`) | 1h |
| 🟢 | Máscara de telefone no `tutor_contato` | 1h |
| 🔥 | Testes e2e Playwright | 2-3 dias |

---

## ✅ Como Começar (Original)

**Ordem recomendada inicial:**

```
1️⃣  Escanear QR da Evolution API (5 min)
      ↓
2️⃣  Refatorar Agenda em componentes ✅ (CONCLUÍDO)
      ↓
3️⃣  Gerar tipos do Supabase (1 hora)
      ↓
4️⃣  Máscara de telefone (1 hora)
      ↓
5️⃣  Testes e2e Playwright (2-3 dias)
      ↓
6️⃣  Próximos itens do roadmap
```

---

## 📊 Impacto vs Esforço

```
Alto Impacto
    │
    │  🎯 Playwright         🎯 Papéis/Permissões
    │  (#2)                  (#7)
    │
    │  🎯 WhatsApp QR        🎯 Refatorar páginas    🎯 Busca pgvector
    │  (#1 - 5min!)          (#3)                    (#8)
    │
    │  🎯 Máscara tel        🎯 Tipos Supabase       🎯 Relatório PDF
    │  (#5)                  (#4)                    (#6)
    │
    └──────────────────────────────────────────────→
    Baixo Esforço                      Alto Esforço
```

---

> **Nota:** Este plano é um guia — a ordem pode ser ajustada conforme sua prioridade. O importante é manter o app saudável: código limpo + testes sólidos + features que entregam valor real pros veterinários.
