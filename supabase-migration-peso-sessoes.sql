-- VetPro App - Adicionar peso às sessões
-- Execute no SQL Editor do Supabase

alter table sessions add column if not exists peso numeric(5,2);