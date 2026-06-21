-- VetPro App - Receituário / Prescrições
-- Execute no SQL Editor do Supabase

create table prescriptions (
  id uuid default uuid_generate_v4() primary key,
  vet_id uuid references profiles(id),
  patient_id uuid references patients(id) not null,
  items jsonb not null default '[]'::jsonb,
  observacoes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table prescriptions enable row level security;

create policy "Vet vê suas prescrições"
  on prescriptions for select using (auth.uid() = vet_id);

create policy "Vet pode criar prescrições"
  on prescriptions for insert with check (auth.uid() = vet_id);

create policy "Vet pode atualizar prescrições"
  on prescriptions for update using (auth.uid() = vet_id);

create policy "Vet pode deletar prescrições"
  on prescriptions for delete using (auth.uid() = vet_id);
