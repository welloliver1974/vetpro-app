quero para usao tanto em notebook, tablet e celular....gosto da ideia de frontend bem moderno, tons mais escuros....tailwind, css, html...e bacend pode ser o supabase mesmo por exemplo ou outro gratuito.....isso seria a principio

Funcionalidades do MVP: "VetPro Mobile"
Dashboard de Agenda Unificada:

Visualização tipo calendário (diária/semanal).

Diferenciação visual clara entre "Atendimento Externo" (com campo de endereço integrado ao Maps) e "Sessão de Fisio" (na clínica).

Prontuário de Evolução Clínica com "Galeria de Fisio":

Cadastro rápido do paciente.

Upload de fotos e vídeos rápidos para comparar a evolução motora do animal, com campo de anotações por sessão (essencial para fisio).

Financeiro Rápido (PDV Móvel):

Botão de "Finalizar Atendimento" que gera um resumo e permite registrar o método de pagamento (Pix/Cartão/Dinheiro) na hora, evitando esquecimento de cobrança em atendimentos externos.

1. Stack Tecnológica
Frontend: Next.js (React). É a escolha ideal para criar interfaces modernas, rápidas e que funcionam muito bem tanto em desktop quanto mobile.

Estilização: Tailwind CSS com tema escuro (Dark Mode por padrão).

Backend & Banco: Supabase.

Auth: Gerenciamento de login dos veterinários.

Database: PostgreSQL para dados estruturados (pacientes, agendas, financeiro).

Storage: Armazenamento das fotos/vídeos da evolução da fisio.

Componentes UI: Shadcn/ui. São componentes prontos, extremamente bonitos, feitos com Tailwind, que dão aquele aspecto "premium" e profissional que você busca.

2. Estrutura de Dados (Conceitual)
Para o Supabase, precisaríamos de quatro tabelas principais para começar:

profiles: Dados do veterinário/clínica.

patients: Nome, espécie, tutor, histórico básico.

appointments: Data, tipo (externo/fisio/clínico), status (agendado/concluído), valor.

sessions: Relacionada ao paciente/appointment, para salvar as notas de evolução e links das mídias (fotos/vídeos).

 o veterinario tem equipamentos que usa na fisioterapia, seria interesante ter um lugar para ele cadastrar o equipamento e ter mais informaçoes quando tiver o uso na fisioterapia....acho que e importante pois ele ali tem protocolos definidos para cada paciente e cada equipamento... 

Módulo de Inventário de Equipamentos: Cadastro dos aparelhos (ex: Laser, Ultrassom terapêutico, Eletroestimulador).

Biblioteca de Protocolos: O veterinário cria "templates" de uso (ex: Protocolo de Artrite -> Laser 808nm + 10 min de Eletro).

Vinculação na Sessão: Quando ele registrar a sessão de fisio, ele seleciona o paciente e já associa qual "Protocolo" foi usado. Isso facilita muito o acompanhamento da eficácia do tratamento.

Exportação de Relatório para o Tutor: Um botão que gera um PDF simples com a "Evolução do mês" do pet. Isso é algo que o veterinário envia no WhatsApp para o dono do animal e gera uma fidelização incrível.

Gestão de Custo por Sessão: Como ele tem custo de energia e manutenção dos equipamentos, o app poderia sugerir um preço mínimo baseado no protocolo usado.

Agora nosso MVP ficou assim:

Base: Agenda, Prontuário, Financeiro.

Diferencial Técnico: Inventário de Equipamentos + Biblioteca de Protocolos de Tratamento.

Atue como um Arquiteto de Software Sênior. Quero criar um banco de dados no Supabase para um app de gestão veterinária (foco em fisio e atendimento domiciliar). Crie o script SQL para as seguintes tabelas, garantindo relacionamentos (Foreign Keys) e boas práticas:

profiles: (id, nome, especialidade, created_at)

patients: (id, nome, especie, raca, tutor_nome, tutor_contato, created_at)

equipments: (id, nome, modelo, manutencao_periodica, created_at)

protocols: (id, nome, descricao, equipamento_id, configuracoes_padrao [JSONB])

appointments: (id, paciente_id, data, tipo [fisio/clinico/externo], status, valor)

sessions: (id, appointment_id, protocolo_id, notas, notas_evolucao, foto_url [array])

Por favor, use tipos de dados eficientes para PostgreSQL, defina as chaves primárias como UUID e sugira as políticas básicas de RLS (Row Level Security) para que cada veterinário só veja seus próprios dados."

# Estrutura do Banco de Dados - VetPro App

Este arquivo contém o schema SQL para o Supabase. Utiliza UUIDs para IDs e políticas de RLS para isolamento de dados por usuário.

## Schema SQL

```sql
-- Habilitar extensão para UUID
create extension if not exists "uuid-ossp";

-- 1. Profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text,
  especialidade text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Patients
create table patients (
  id uuid default uuid_generate_v4() primary key,
  vet_id uuid references profiles(id),
  nome text not null,
  especie text,
  raca text,
  tutor_nome text,
  tutor_contato text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Equipments
create table equipments (
  id uuid default uuid_generate_v4() primary key,
  vet_id uuid references profiles(id),
  nome text not null,
  modelo text,
  ultima_manutencao date,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Protocols
create table protocols (
  id uuid default uuid_generate_v4() primary key,
  vet_id uuid references profiles(id),
  equipamento_id uuid references equipments(id),
  nome text not null,
  descricao text,
  configuracoes_padrao jsonb, -- Ex: {"intensidade": "5hz", "tempo": "10min"}
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Appointments
create table appointments (
  id uuid default uuid_generate_v4() primary key,
  vet_id uuid references profiles(id),
  paciente_id uuid references patients(id),
  data timestamp with time zone not null,
  tipo text check (tipo in ('fisio', 'clinico', 'externo')),
  status text default 'agendado',
  valor decimal(10,2)
);

-- 6. Sessions
create table sessions (
  id uuid default uuid_generate_v4() primary key,
  appointment_id uuid references appointments(id),
  protocolo_id uuid references protocols(id),
  notas text,
  notas_evolucao text,
  foto_urls text[], -- Array de links das fotos no storage
  created_at timestamp with time zone default timezone('utc'::text, now())
);


# Arquitetura Frontend - VetPro App

## Stack Tecnológica
- **Framework:** Next.js 15+ (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Componentes:** Shadcn/ui (Radix UI)
- **State Management:** TanStack Query (React Query) para cache de servidor e Supabase Client.

## Estrutura de Pastas (Src)
/src
  /app           # Rotas do Next.js
  /components    # Componentes Shadcn e personalizados
    /ui          # Componentes básicos do Shadcn
    /layout      # Header, Sidebar (responsiva)
    /vet         # Componentes de negócio (AgendaCard, ProtocolForm)
  /hooks         # Custom hooks (ex: useSupabase, useAppointments)
  /lib           # Cliente do Supabase e utils (cn, etc)
  /types         # Definições de tipos do DB (Database.ts)

## Design System (Dark Mode)
- **Background:** `bg-slate-950`
- **Surface (Cards):** `bg-slate-900`
- **Border:** `border-slate-800`
- **Primary:** `text-indigo-500` (Para botões e ações de destaque)
- **Typography:** `font-sans` com tons de cinza claro (`text-slate-200`)

## Estratégia de Responsividade
- **Mobile First:** Sidebar oculta em mobile, acessível por menu hamburger.
- **Desktop:** Sidebar fixa lateral, área de dashboard principal com grid responsivo.


# Manual de Desenvolvimento - VetPro App

## 1. Perfil do Colaborador (IA)
Você é um Engenheiro de Software Sênior Full Stack, especialista em Next.js, PostgreSQL/Supabase e arquitetura de sistemas escaláveis. Sua função é me ajudar a desenvolver o "VetPro", um sistema de gestão veterinária voltado para atendimento híbrido (clínico/externo) e fisioterapia.

## 2. Visão do Projeto
O VetPro é um SaaS de nicho focado em:
- **Agenda Híbrida:** Integração entre atendimento clínico, externo e sessões de fisio.
- **Protocolos Técnicos:** Gestão de equipamentos e protocolos de tratamento personalizados.
- **Prontuário Evolutivo:** Registro de sessões, notas de evolução e galeria de fotos/vídeos.
- **Financeiro:** Baixa rápida de pagamentos e resumo de atendimentos.

## 3. Stack Tecnológica
- **Framework:** Next.js 15+ (App Router, TypeScript).
- **Estilização:** Tailwind CSS (Dark Mode: Slate-950/900).
- **Componentes:** Shadcn/ui (Radix UI).
- **Backend/DB:** Supabase (PostgreSQL).
- **Gerenciamento de Estado:** TanStack Query.
- **Arquitetura:** Mobile-First, responsivo, modular.

## 4. Estrutura do Banco de Dados (Schema SQL)
```sql
create extension if not exists "uuid-ossp";

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text, especialidade text, created_at timestamp with time zone default timezone('utc'::text, now())
);

create table patients (
  id uuid default uuid_generate_v4() primary key, vet_id uuid references profiles(id),
  nome text not null, especie text, raca text, tutor_nome text, tutor_contato text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table equipments (
  id uuid default uuid_generate_v4() primary key, vet_id uuid references profiles(id),
  nome text not null, modelo text, ultima_manutencao date,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table protocols (
  id uuid default uuid_generate_v4() primary key, vet_id uuid references profiles(id),
  equipamento_id uuid references equipments(id), nome text not null, descricao text,
  configuracoes_padrao jsonb, created_at timestamp with time zone default timezone('utc'::text, now())
);

create table appointments (
  id uuid default uuid_generate_v4() primary key, vet_id uuid references profiles(id),
  paciente_id uuid references patients(id), data timestamp with time zone not null,
  tipo text check (tipo in ('fisio', 'clinico', 'externo')), status text default 'agendado', valor decimal(10,2)
);

create table sessions (
  id uuid default uuid_generate_v4() primary key, appointment_id uuid references appointments(id),
  protocolo_id uuid references protocols(id), notas text, notas_evolucao text,
  foto_urls text[], created_at timestamp with time zone default timezone('utc'::text, now())
);

# Estrutura do Banco de Dados - VetPro App

Este arquivo contém o schema SQL para o Supabase. Utiliza UUIDs para IDs e políticas de RLS para isolamento de dados por usuário.

## Schema SQL

```sql
-- Habilitar extensão para UUID
create extension if not exists uuid-ossp;

-- 1. Profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text,
  especialidade text,
  created_at timestamp with time zone default timezone('utc'text, now())
);

-- 2. Patients
create table patients (
  id uuid default uuid_generate_v4() primary key,
  vet_id uuid references profiles(id),
  nome text not null,
  especie text,
  raca text,
  tutor_nome text,
  tutor_contato text,
  created_at timestamp with time zone default timezone('utc'text, now())
);

-- 3. Equipments
create table equipments (
  id uuid default uuid_generate_v4() primary key,
  vet_id uuid references profiles(id),
  nome text not null,
  modelo text,
  ultima_manutencao date,
  created_at timestamp with time zone default timezone('utc'text, now())
);

-- 4. Protocols
create table protocols (
  id uuid default uuid_generate_v4() primary key,
  vet_id uuid references profiles(id),
  equipamento_id uuid references equipments(id),
  nome text not null,
  descricao text,
  configuracoes_padrao jsonb, -- Ex {intensidade 5hz, tempo 10min}
  created_at timestamp with time zone default timezone('utc'text, now())
);

-- 5. Appointments
create table appointments (
  id uuid default uuid_generate_v4() primary key,
  vet_id uuid references profiles(id),
  paciente_id uuid references patients(id),
  data timestamp with time zone not null,
  tipo text check (tipo in ('fisio', 'clinico', 'externo')),
  status text default 'agendado',
  valor decimal(10,2)
);

-- 6. Sessions
create table sessions (
  id uuid default uuid_generate_v4() primary key,
  appointment_id uuid references appointments(id),
  protocolo_id uuid references protocols(id),
  notas text,
  notas_evolucao text,
  foto_urls text[], -- Array de links das fotos no storage
  created_at timestamp with time zone default timezone('utc'text, now())
);

# Arquitetura Frontend - VetPro App

## Stack Tecnológica
- **Framework:** Next.js 15+ (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Componentes:** Shadcn/ui (Radix UI)
- **State Management:** TanStack Query (React Query) para cache de servidor e Supabase Client.

## Estrutura de Pastas (Src)
/src
  /app           # Rotas do Next.js
  /components    # Componentes Shadcn e personalizados
    /ui          # Componentes básicos do Shadcn
    /layout      # Header, Sidebar (responsiva)
    /vet         # Componentes de negócio (AgendaCard, ProtocolForm)
  /hooks         # Custom hooks (ex: useSupabase, useAppointments)
  /lib           # Cliente do Supabase e utils (cn, etc)
  /types         # Definições de tipos do DB (Database.ts)

## Design System (Dark Mode)
- **Background:** `bg-slate-950`
- **Surface (Cards):** `bg-slate-900`
- **Border:** `border-slate-800`
- **Primary:** `text-indigo-500` (Para botões e ações de destaque)
- **Typography:** `font-sans` com tons de cinza claro (`text-slate-200`)

## Estratégia de Responsividade
- **Mobile First:** Sidebar oculta em mobile, acessível por menu hamburger.
- **Desktop:** Sidebar fixa lateral, área de dashboard principal com grid responsivo.
