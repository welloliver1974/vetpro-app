-- VetPro App - Multi-Clínica Migration
-- Execute no SQL Editor do Supabase

-- 1. Tabela de clínicas
create table if not exists clinics (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references profiles(id) not null,
  nome text not null,
  endereco text,
  telefone text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table clinics add column if not exists owner_id uuid references profiles(id);

-- 2. Adicionar clinic_id ao perfil
alter table profiles add column if not exists clinic_id uuid references clinics(id);

-- 3. Tabela de convites
create table if not exists clinic_invites (
  id uuid default uuid_generate_v4() primary key,
  clinic_id uuid references clinics(id) not null,
  email text not null,
  token text not null unique,
  usado boolean default false,
  created_by uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilitar RLS
alter table clinics enable row level security;
alter table clinic_invites enable row level security;

-- RLS: clínicas
create policy "Membros veem sua clínica"
  on clinics for select using (
    id = (select clinic_id from profiles where id = auth.uid())
  );

create policy "Dono pode atualizar clínica"
  on clinics for update using (owner_id = auth.uid());

create policy "Dono pode deletar clínica"
  on clinics for delete using (owner_id = auth.uid());

-- RLS: perfis da clínica
create policy "Membros veem perfis da clínica"
  on profiles for select using (
    auth.uid() = id
    or clinic_id = (select clinic_id from profiles where id = auth.uid())
  );

-- RLS: convites
create policy "Dono vê convites da clínica"
  on clinic_invites for select using (
    clinic_id in (select id from clinics where owner_id = auth.uid())
  );

create policy "Dono pode criar convites"
  on clinic_invites for insert with check (
    clinic_id in (select id from clinics where owner_id = auth.uid())
  );

create policy "Dono pode atualizar convites"
  on clinic_invites for update using (
    clinic_id in (select id from clinics where owner_id = auth.uid())
  );

create policy "Dono pode deletar convites"
  on clinic_invites for delete using (
    clinic_id in (select id from clinics where owner_id = auth.uid())
  );

-- RLS atualizado para pacientes (agora inclui colegas de clínica)
drop policy if exists "Vet vê seus pacientes" on patients;
create policy "Vet vê pacientes da clínica"
  on patients for select using (
    auth.uid() = vet_id
    or
    (select clinic_id from profiles where id = auth.uid()) = (select clinic_id from profiles where id = vet_id)
  );

-- RLS atualizado para equipamentos
drop policy if exists "Vet vê seus equipamentos" on equipments;
create policy "Vet vê equipamentos da clínica"
  on equipments for select using (
    auth.uid() = vet_id
    or
    (select clinic_id from profiles where id = auth.uid()) = (select clinic_id from profiles where id = vet_id)
  );

-- RLS atualizado para protocolos
drop policy if exists "Vet vê seus protocolos" on protocols;
create policy "Vet vê protocolos da clínica"
  on protocols for select using (
    auth.uid() = vet_id
    or
    (select clinic_id from profiles where id = auth.uid()) = (select clinic_id from profiles where id = vet_id)
  );

-- RLS atualizado para agendamentos
drop policy if exists "Vet vê seus agendamentos" on appointments;
create policy "Vet vê agendamentos da clínica"
  on appointments for select using (
    auth.uid() = vet_id
    or
    (select clinic_id from profiles where id = auth.uid()) = (select clinic_id from profiles where id = vet_id)
  );

-- RLS atualizado para sessões (via appointment)
drop policy if exists "Vet vê sessões dos seus agendamentos" on sessions;
create policy "Vet vê sessões da clínica"
  on sessions for select using (
    auth.uid() = (select vet_id from appointments where id = appointment_id)
    or
    (select clinic_id from profiles where id = auth.uid()) = (
      select clinic_id from profiles where id = (select vet_id from appointments where id = appointment_id)
    )
  );
