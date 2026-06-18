-- VetPro App - Schema Completo
-- Execute no SQL Editor do Supabase

-- Extensão UUID
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
  configuracoes_padrao jsonb,
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
  valor decimal(10,2),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Sessions
create table sessions (
  id uuid default uuid_generate_v4() primary key,
  appointment_id uuid references appointments(id),
  protocolo_id uuid references protocols(id),
  notas text,
  notas_evolucao text,
  foto_urls text[],
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilitar RLS em todas as tabelas
alter table profiles enable row level security;
alter table patients enable row level security;
alter table equipments enable row level security;
alter table protocols enable row level security;
alter table appointments enable row level security;
alter table sessions enable row level security;

-- Políticas RLS: cada vet vê apenas seus próprios dados
create policy "Usuários veem seu próprio perfil"
  on profiles for select using (auth.uid() = id);
create policy "Usuários podem inserir próprio perfil"
  on profiles for insert with check (auth.uid() = id);
create policy "Usuários podem atualizar próprio perfil"
  on profiles for update using (auth.uid() = id);

create policy "Vet vê seus pacientes"
  on patients for select using (auth.uid() = vet_id);
create policy "Vet pode criar pacientes"
  on patients for insert with check (auth.uid() = vet_id);
create policy "Vet pode atualizar pacientes"
  on patients for update using (auth.uid() = vet_id);
create policy "Vet pode deletar pacientes"
  on patients for delete using (auth.uid() = vet_id);

create policy "Vet vê seus equipamentos"
  on equipments for select using (auth.uid() = vet_id);
create policy "Vet pode criar equipamentos"
  on equipments for insert with check (auth.uid() = vet_id);
create policy "Vet pode atualizar equipamentos"
  on equipments for update using (auth.uid() = vet_id);
create policy "Vet pode deletar equipamentos"
  on equipments for delete using (auth.uid() = vet_id);

create policy "Vet vê seus protocolos"
  on protocols for select using (auth.uid() = vet_id);
create policy "Vet pode criar protocolos"
  on protocols for insert with check (auth.uid() = vet_id);
create policy "Vet pode atualizar protocolos"
  on protocols for update using (auth.uid() = vet_id);
create policy "Vet pode deletar protocolos"
  on protocols for delete using (auth.uid() = vet_id);

create policy "Vet vê seus agendamentos"
  on appointments for select using (auth.uid() = vet_id);
create policy "Vet pode criar agendamentos"
  on appointments for insert with check (auth.uid() = vet_id);
create policy "Vet pode atualizar agendamentos"
  on appointments for update using (auth.uid() = vet_id);
create policy "Vet pode deletar agendamentos"
  on appointments for delete using (auth.uid() = vet_id);

create policy "Vet vê sessões dos seus agendamentos"
  on sessions for select using (
    auth.uid() = (select vet_id from appointments where id = appointment_id)
  );
create policy "Vet pode criar sessões"
  on sessions for insert with check (
    auth.uid() = (select vet_id from appointments where id = appointment_id)
  );
create policy "Vet pode atualizar sessões"
  on sessions for update using (
    auth.uid() = (select vet_id from appointments where id = appointment_id)
  );
create policy "Vet pode deletar sessões"
  on sessions for delete using (
    auth.uid() = (select vet_id from appointments where id = appointment_id)
  );

-- Trigger: criar profile automaticamente após signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, new.raw_user_meta_data->>'nome');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
