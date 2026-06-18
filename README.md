# VetPro App 🐾

SaaS de gestão veterinária focado em **fisioterapia e atendimento domiciliar**.  
Funciona em notebook, tablet e celular.

---

## Stack

| Camada | Tecnologia |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Linguagem** | TypeScript |
| **Estilização** | Tailwind CSS v4 (Dark Mode) |
| **Componentes** | Shadcn/ui (Radix UI) |
| **State** | TanStack Query v5 |
| **Backend/DB** | Supabase (PostgreSQL + Auth + Storage) |
| **Auth** | Supabase Auth (email/senha) |
| **PDF** | jsPDF + html2canvas |

---

## Funcionalidades (MVP Completo)

### 🔐 Autenticação
- Login e cadastro com email/senha
- Proteção de rotas via Proxy (substituto do Middleware do Next.js)
- Trigger automático de criação de perfil no signup
- RLS (Row Level Security) isolando dados por veterinário

### 📋 Pacientes
- Cadastro completo (nome, espécie, raça, tutor, contato)
- Listagem com busca por nome ou tutor
- Edição e exclusão

### 📅 Agenda Unificada
- Visualização em calendário semanal
- Criação de atendimentos clicando no dia
- Diferenciação visual por tipo: **Fisioterapia** / **Clínico** / **Externo (Domiciliar)**
- Status: Agendado → Em Andamento → Concluído
- Finalização com valor e forma de pagamento

### 📸 Prontuário + Galeria de Evolução
- Registro de sessões vinculadas a atendimentos
- Anotações da sessão + notas de evolução
- Upload de fotos e vídeos (Supabase Storage)
- Galeria com timeline visual para comparar evolução motora

### 🔧 Inventário de Equipamentos
- Cadastro de aparelhos (laser, ultrassom, eletroestimulador)
- Controle de modelo e data de última manutenção

### 📋 Biblioteca de Protocolos
- Templates de tratamento vinculados a equipamentos
- Configurações dinâmicas em JSON (ex: `intensidade: 5Hz`, `tempo: 10min`)
- Seleção do protocolo usado ao registrar sessão

### 💰 Financeiro (PDV Móvel)
- Modal de **Finalizar Atendimento** com resumo
- Registro de valor cobrado
- Formas de pagamento: Pix, Cartão, Dinheiro
- Painel financeiro com faturamento (Hoje, Mês, Total)
- Histórico completo de atendimentos concluídos

### 📄 Relatório para Tutor
- Geração de PDF com evolução mensal do paciente
- Inclui: dados do animal, número de sessões, fotos, histórico
- Pronto para compartilhar via WhatsApp

---

## Estrutura de Pastas

```
├── app/
│   ├── (dashboard)/          # Rotas protegidas (com sidebar)
│   │   ├── page.tsx          # Dashboard com dados reais
│   │   ├── agenda/           # Calendário semanal
│   │   ├── pacientes/        # Lista de pacientes
│   │   ├── pacientes/[id]/   # Detalhe + sessões + galeria
│   │   ├── equipamentos/     # Inventário
│   │   ├── protocolos/       # Biblioteca de protocolos
│   │   └── financeiro/       # Resumo financeiro
│   ├── auth/
│   │   ├── login/            # Tela de login
│   │   ├── signup/           # Tela de cadastro
│   │   └── callback/         # Callback OAuth
│   └── layout.tsx            # Layout raiz (dark mode)
├── components/
│   ├── ui/                   # Componentes Shadcn
│   ├── layout/               # Sidebar + Header
│   └── vet/                  # ReportPDF
├── hooks/                    # TanStack Query hooks
│   ├── usePatients.ts
│   ├── useAppointments.ts
│   ├── useSessions.ts
│   ├── useEquipments.ts
│   ├── useProtocols.ts
│   └── useFinances.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Cliente browser
│   │   ├── server.ts         # Cliente servidor
│   │   └── queries.ts        # Queries server-side
│   ├── dal.ts                # Data Access Layer (auth)
│   └── utils.ts              # cn() helper
├── providers/
│   └── QueryProvider.tsx      # TanStack Query
├── proxy.ts                  # Proteção de rotas
├── supabase-schema.sql       # Schema do banco
├── supabase-storage.sql      # Bucket de mídias
└── supabase-migration-financeiro.sql  # Migração forma_pagamento
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
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
# Edite .env.local com suas credenciais do Supabase:
#   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave

# 3. Rodar schema SQL no Supabase
# Execute supabase-schema.sql no SQL Editor

# 4. Criar bucket de storage
# Execute supabase-storage.sql no SQL Editor

# 5. Migração financeiro
# Execute supabase-migration-financeiro.sql no SQL Editor

# 6. Iniciar dev server
npm run dev
```

---

## Roadmap Futuro

- [ ] Modo offline (PWA)
- [ ] Integração com Google Maps para rotas de atendimento externo
- [ ] Gestão de custo por sessão (energia + manutenção)
- [ ] Notificações push (lembrete de agendamento)
- [ ] Multi-clínica
- [ ] Assinatura digital do tutor
- [ ] Dashboard com gráficos
