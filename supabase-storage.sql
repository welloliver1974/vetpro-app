-- Execute no SQL Editor do Supabase
-- Cria bucket para fotos/vídeos das sessões

insert into storage.buckets (id, name, public)
values ('session-media', 'session-media', true);

-- Política: qualquer usuário autenticado pode fazer upload
create policy "Usuários autenticados podem fazer upload"
  on storage.objects for insert
  with check (bucket_id = 'session-media' and auth.role() = 'authenticated');

-- Política: qualquer um pode ver os arquivos (bucket público)
create policy "Qualquer um pode ver"
  on storage.objects for select
  using (bucket_id = 'session-media');
