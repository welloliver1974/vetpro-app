-- VetPro App - Metas Mensais de Faturamento
-- Execute no SQL Editor do Supabase

create table monthly_goals (
  id uuid default uuid_generate_v4() primary key,
  vet_id uuid references profiles(id),
  mes integer not null check (mes >= 1 and mes <= 12),
  ano integer not null,
  valor_meta numeric(10,2) not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(vet_id, mes, ano)
);

alter table monthly_goals enable row level security;

create policy "Vet vê suas metas"
  on monthly_goals for select using (auth.uid() = vet_id);

create policy "Vet pode criar metas"
  on monthly_goals for insert with check (auth.uid() = vet_id);

create policy "Vet pode atualizar metas"
  on monthly_goals for update using (auth.uid() = vet_id);

create policy "Vet pode deletar metas"
  on monthly_goals for delete using (auth.uid() = vet_id);
