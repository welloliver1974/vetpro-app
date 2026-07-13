# Portal do Tutor

Link público (sem login) que o veterinário gera no app e envia por WhatsApp para o tutor acompanhar a evolução do pet.

## Como funciona

1. Vet acessa **Pacientes → Detalhe → clica "Compartilhar"**
2. Sistema gera/cria um token (UUID v4) na tabela `patient_tokens`
3. Link copiado: `https://vetpro.housecloud.tec.br/tutor/{token}`
4. Tutor abre no navegador — **não precisa de login**

## O que o tutor vê

- Nome, espécie, raça, peso, nome do tutor
- Próximos agendamentos (próximos 5, com data e tipo)
- Últimas 20 sessões com notas de evolução, peso e fotos
- Galeria de fotos clicável (abre em nova aba)
- Botão **"Baixar Relatório de Evolução"** (PDF com jsPDF)

## Arquitetura

- **Proxy.ts**: `/tutor/` e `/api/tutor/` são rotas públicas (não redireciona pro login)
- **API Route** `GET /api/tutor/[token]`: usa `SUPABASE_SERVICE_ROLE_KEY` para bypass RLS
- **Client Component** `app/tutor/[token]/page.tsx`: consome a API e renderiza
- **Token**: UUID v4, único por paciente, ativo/inativo

## Arquivos principais

- `app/api/tutor/[token]/route.ts` — endpoint público
- `app/tutor/[token]/page.tsx` — página do portal
- `hooks/usePatientToken.ts` — hook para criar/obter token
- `lib/pdf/tutorReport.ts` — geração de PDF do relatório
- `supabase-migration-tutor-portal.sql` — tabela `patient_tokens` + RLS
- `proxy.ts` — exempt de auth para `/tutor/`

## O que NÃO expõe

Dados financeiros (custo, valor), dados clínicos sensíveis (queixa principal, doenças preexistentes).
Apenas informações úteis pro tutor.
