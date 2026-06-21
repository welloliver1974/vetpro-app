-- VetPro App - Insumos e Medicamentos (Estoque)
-- Execute no SQL Editor do Supabase

create table supplies (
  id uuid default uuid_generate_v4() primary key,
  vet_id uuid references profiles(id),
  nome text not null,
  tipo text not null check (tipo in ('insumo', 'medicamento')),
  quantidade integer not null default 0,
  quantidade_minima integer not null default 0,
  unidade text not null default 'un',
  lote text,
  validade date,
  fornecedor text,
  observacoes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table supplies enable row level security;

create policy "Vet vê seus insumos"
  on supplies for select using (auth.uid() = vet_id);

create policy "Vet pode criar insumos"
  on supplies for insert with check (auth.uid() = vet_id);

create policy "Vet pode atualizar insumos"
  on supplies for update using (auth.uid() = vet_id);

create policy "Vet pode deletar insumos"
  on supplies for delete using (auth.uid() = vet_id);
