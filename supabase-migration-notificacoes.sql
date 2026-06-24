-- Notification log table
create table if not exists notification_log (
  id uuid default uuid_generate_v4() primary key,
  vet_id uuid references profiles(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  tipo_envio text not null check (tipo_envio in ('whatsapp', 'email')),
  destinatario text not null,
  status text not null default 'enviado' check (status in ('enviado', 'erro', 'lido')),
  mensagem text,
  erro text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Add notification config column to profiles
alter table profiles add column if not exists notificacoes_config jsonb;

-- RLS: vet can see own notification logs
alter table notification_log enable row level security;

create policy "Vets can manage own notification logs"
  on notification_log
  using (vet_id = auth.uid())
  with check (vet_id = auth.uid());
