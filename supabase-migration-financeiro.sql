-- Adicionar campo de forma de pagamento na tabela appointments
alter table appointments
add column if not exists forma_pagamento text check (forma_pagamento in ('pix', 'cartao', 'dinheiro'));
