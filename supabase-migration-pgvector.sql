-- VetPro App - Busca Inteligente com pgvector
-- Execute no SQL Editor do Supabase

-- 1. Habilitar extensão pgvector
create extension if not exists vector;

-- 2. Coluna de embedding em patients (768d = compatível OpenAI text-embedding-3-small + Gemini embedding-001)
alter table patients add column if not exists embedding vector(768);

-- 3. Coluna de embedding em sessions
alter table sessions add column if not exists embedding vector(768);

-- 4. Índices IVF para busca aproximada (mais rápido que busca exaustiva)
create index if not exists idx_patients_embedding
  on patients
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists idx_sessions_embedding
  on sessions
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 5. Função de busca por similaridade para pacientes
-- Retorna pacientes ordenados por relevância (distância cosseno)
create or replace function match_patients(
  query_embedding vector(768),
  match_threshold float default 0.5,
  match_count int default 20
)
returns table (
  id uuid,
  nome text,
  especie text,
  raca text,
  tutor_nome text,
  created_at timestamptz,
  similarity float
)
language sql stable
as $$
  select
    patients.id,
    patients.nome,
    patients.especie,
    patients.raca,
    patients.tutor_nome,
    patients.created_at,
    1 - (patients.embedding <=> query_embedding) as similarity
  from patients
  where patients.embedding is not null
    and 1 - (patients.embedding <=> query_embedding) > match_threshold
  order by patients.embedding <=> query_embedding
  limit match_count
$$;
