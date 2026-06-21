-- Anamnese / Ficha Médica Completa
-- Adiciona colunas de informações médicas detalhadas à tabela patients

alter table patients add column if not exists data_nascimento date;
alter table patients add column if not exists sexo text check (sexo in ('macho', 'femea'));
alter table patients add column if not exists peso numeric(5,2);
alter table patients add column if not exists cor_pelagem text;
alter table patients add column if not exists microchip text;

alter table patients add column if not exists queixa_principal text;
alter table patients add column if not exists historico_doenca_atual text;
alter table patients add column if not exists doencas_preexistentes text;
alter table patients add column if not exists medicamentos_continuos text;
alter table patients add column if not exists historico_cirurgico text;
alter table patients add column if not exists alergias text;
alter table patients add column if not exists vacinacao text;
alter table patients add column if not exists observacoes text;
