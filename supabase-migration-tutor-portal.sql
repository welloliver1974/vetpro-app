-- VetPro App - Portal do Tutor
-- Execute no SQL Editor do Supabase
-- Cria tabela para armazenar tokens únicos de acesso por paciente

create table if not exists patient_tokens (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references patients(id) on delete cascade not null,
  token text not null unique,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Index para busca rápida por token
create index if not exists idx_patient_tokens_token on patient_tokens(token);

-- RLS
alter table patient_tokens enable row level security;

-- Vet pode ver tokens dos seus pacientes
create policy "Vet vê tokens dos seus pacientes"
  on patient_tokens for select
  using (
    patient_id in (select id from patients where vet_id = auth.uid())
  );

-- Vet pode criar tokens para seus pacientes
create policy "Vet pode criar tokens"
  on patient_tokens for insert
  with check (
    patient_id in (select id from patients where vet_id = auth.uid())
  );

-- Vet pode desativar tokens dos seus pacientes
create policy "Vet pode desativar tokens"
  on patient_tokens for update
  using (
    patient_id in (select id from patients where vet_id = auth.uid())
  );
