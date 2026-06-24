-- Audit log table
create table if not exists audit_logs (
  id uuid default uuid_generate_v4() primary key,
  vet_id uuid references profiles(id) on delete cascade,
  tabela text not null,
  registro_id uuid not null,
  acao text not null check (acao in ('insert', 'update', 'delete')),
  dados_antigos jsonb,
  dados_novos jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table audit_logs enable row level security;

create policy "Vets can see own audit logs"
  on audit_logs for select
  using (vet_id = auth.uid());

create policy "Vets can insert own audit logs"
  on audit_logs for insert
  with check (vet_id = auth.uid());
