# Ideias de melhorias para o VetPro‑App

Esta lista serve como referência para qualquer agente de IA que entrar no repositório. Ela contém sugestões de funcionalidades, melhorias de qualidade, segurança e infraestrutura que podem ser priorizadas em sprints futuros.

---

## Experiência do usuário
- **Modo PWA (Progressive Web App)** – suporte offline avançado, instalação no desktop/mobile.
- **Tema escuro/claro** com toggle persistido em `localStorage`.
- **Internacionalização (i18n)** – suporte a inglês e espanhol usando `next-intl` ou `react-i18next`.

## Automação & Produtividade
- **Geração automática de PDF mensal** com cron / Task Scheduler, enviando o relatório por WhatsApp ou e‑mail.
- **Webhook de notificação** para Slack/Telegram quando houver falha de build ou erro de runtime (via PM2‑hooks).
- **Health‑check endpoint** (`/api/health`) + monitoramento de uptime (UptimeRobot, Grafana).

## Qualidade & Confiabilidade
- **Testes de integração** usando `@testing-library/react` e `jest` nas páginas de dashboard e agenda.
- **CI/CD com GitHub Actions** – lint, test, build, deploy automático ao merge na branch `main`.

## Infraestrutura
- **Dockerização completa** (Dockerfile + docker‑compose) com variáveis de ambiente (`PORT`, `SUPABASE_URL`, etc.).
- **Persistência de PM2** (`pm2 save && pm2 resurrect`) + script de start‑up (`systemd` service).

## Performance
- **Cache de imagens** usando `next/image` com `loader` customizado e CDN (Cloudflare).
- **Incremental Static Regeneration (ISR)** nas páginas que podem ser estáticas.

## Segurança
- **Autenticação JWT** (login via Supabase) e proteção de rotas sensíveis.
- **Rate limiting** nas APIs com `next-rate-limit`.

---

> **Como usar**
> - Leia este arquivo ao iniciar qualquer nova tarefa.
> - Priorize itens conforme necessidade do negócio.
> - Atualize este documento quando concluir ou adicionar novas ideias.
