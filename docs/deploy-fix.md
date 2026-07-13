# Deploy Fix — Julho 2026

Correção do deploy automático no VPS após quebra por secrets vazios e conflito de processos PM2.

## Problemas encontrados

1. **Secret com nome errado**: `NEXT_PLUBLIC_SUPABASE_URL` (PLUBLIC) em vez de `NEXT_PUBLIC_SUPABASE_URL` (PUBLIC)
2. **appleboy/ssh-action `envs:` sem `env:`**: O parâmetro `envs:` precisa que as variáveis existam no runner
3. **PM2 EADDRINUSE**: Processo `vetpro-app` (build antigo) ocupava a porta 4004, `vetpro` novo crashava

## Soluções

1. Deletar o secret errado e recriar com nome correto (`gh secret set`)
2. Adicionar `env:` no step + `envs:` no `with:` do appleboy/ssh-action
3. Trocar `pm2 restart vetpro` para `pm2 delete all` + `pm2 start`

## Arquivo chave

`.github/workflows/deploy.yml`

## Lições

- Verificar `.env.local` no VPS após deploy (valores reais?)
- `pm2 list` mostra se há processos conflitantes
- GitHub Secrets + appleboy/ssh-action exigem `env:` no step + `envs:` no `with:`
