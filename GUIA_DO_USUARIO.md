# 🐾 VetPro — Guia do Usuário

> **SaaS de gestão veterinária** focado em fisioterapia e atendimento domiciliar.
> Funciona em notebook, tablet e celular.

---

## 📑 Sumário

1. [Primeiros Passos](#1-primeiros-passos)
2. [Dashboard](#2-dashboard)
3. [Pacientes](#3-pacientes)
4. [Agenda](#4-agenda)
5. [Prontuário e Sessões](#5-prontuário-e-sessões)
6. [Equipamentos e Estoque](#6-equipamentos-e-estoque)
7. [Protocolos](#7-protocolos)
8. [Receituário](#8-receituário)
9. [Financeiro](#9-financeiro)
10. [Portal do Tutor](#10-portal-do-tutor)
11. [Configurações de IA](#11-configurações-de-ia)
12. [Multi-Clínica](#12-multi-clínica)
13. [Dúvidas Frequentes](#13-dúvidas-frequentes)

---

## 1. Primeiros Passos

### Acessar o sistema

Abra o navegador e acesse: **https://vetpro.housecloud.tec.br**

### Criar conta

1. Clique em **"Criar conta"** na tela de login
2. Preencha seu nome, e-mail e senha
3. Pronto! Seu perfil já estará criado

### Login

Entre com seu e-mail e senha cadastrados.

---

## 2. Dashboard

Ao entrar, você vê o **Dashboard** com um resumo do dia:

![Dashboard]

### Cards de resumo
- **Atendimentos de hoje** — quantos agendamentos você tem no dia
- **Sessões de fisioterapia** — quantas sessões foram registradas
- **Faturamento** — valor total dos atendimentos concluídos

### Gráficos
- **Formas de pagamento** (pizza) — distribuição de Pix, Cartão, Dinheiro
- **Sessões por dia da semana** (barras) — quais dias têm mais movimento
- **Receita diária** (linha) — evolução do faturamento no período

### Filtro de período
Use os botões no topo: **7 dias**, **30 dias** ou **Personalizado** para filtrar os dados.

### Insight do Dia (IA)
Clique no botão 💡 **Insight do Dia** para receber um resumo inteligente do seu dia de atendimentos, gerado por IA.

### Personalizar widgets
Clique em **"Personalizar"** para arrastar, ocultar ou reordenar os cards do dashboard.

---

## 3. Pacientes

### Cadastrar paciente

1. Vá em **Pacientes** no menu lateral
2. Clique em **"Novo Paciente"**
3. Preencha:
   - **Nome do animal** (obrigatório)
   - **Espécie** — ex: Canina, Felina
   - **Raça** — ex: Golden Retriever
   - **Nome do Tutor** — com autocomplete de tutores já cadastrados
   - **Contato do Tutor** — telefone para WhatsApp
   - **Endereço** — para atendimentos externos
4. Clique em **"Cadastrar"**

### Buscar pacientes

Digite no campo de busca para filtrar por **nome do animal** ou **nome do tutor**.

> ⚡ **Busca Inteligente (IA):** se você configurou um provedor de IA compatível (OpenAI ou Gemini), pode digitar em linguagem natural: *"cachorro com problema no joelho que fez laser"* — o app encontra os pacientes relacionados automaticamente.

### Ficha médica (anamnese)

Ao clicar no nome de um paciente, você acessa:
- **Sessões** — histórico de todas as sessões realizadas
- **Linha do Tempo** — evolução visual com variação de peso, fotos e notas
- **Galeria** — todas as fotos das sessões, com comparador Antes/Depois usando IA
- **Ficha Médica** — dados clínicos completos (queixa principal, histórico, alergias, vacinação, etc.)

### Gráfico de peso
Na página do paciente, um gráfico de linha mostra a evolução do peso ao longo das sessões.

---

## 4. Agenda

### Visualizar agenda

A agenda tem três modos de visualização:
| Modo | Descrição |
|------|-----------|
| **Semana** | Grade semanal com navegação entre semanas |
| **Mês** | Visão mensal completa |
| **Dia** | Lista vertical dos atendimentos do dia |

Use o toggle **Sem | Mês | Dia** para alternar.

### Criar atendimento

1. Clique em um dia/horário vazio na agenda
2. Preencha:
   - **Paciente** — selecione da lista
   - **Tipo** — Fisioterapia, Clínico ou Externo (Domiciliar)
   - **Data e hora**
3. Opcional: marque **"Repetir"** para criar sessões recorrentes
4. Clique em **"Criar"**

### Tipos de atendimento

| Tipo | Cor | Descrição |
|------|-----|-----------|
| 🔵 Fisioterapia | Azul | Sessão na clínica |
| 🟢 Clínico | Verde | Consulta geral |
| 🟠 Externo | Laranja | Atendimento domiciliar (mostra endereço + link Google Maps) |

### Finalizar atendimento

1. Clique no card do atendimento na agenda
2. Clique em **"Finalizar"**
3. No modal:
   - Confirme o **valor cobrado**
   - Selecione a **forma de pagamento** (Pix, Cartão, Dinheiro)
   - (Opcional) **Sugerir preço com IA** — clique em ✨ para o IA sugerir um valor baseado no histórico
   - **Assinatura digital** do tutor (toque ou clique para assinar)
4. Clique em **"Finalizar"**

### Filtros

Use os filtros no topo da agenda para exibir apenas:
- **Fisioterapia** / **Clínico** / **Externo**
- **Agendado** / **Em Andamento** / **Concluído**

### Lembretes

O app exibe uma notificação no navegador **15 minutos antes** de cada atendimento. Permita as notificações quando solicitado.

### Adicionar ao calendário (Google/Apple)

Clique no botão 📅 em qualquer atendimento para baixar um arquivo `.ics` — abra com Google Calendar, Apple Calendar ou Outlook.

---

## 5. Prontuário e Sessões

### Registrar sessão

Na página do paciente, clique em **"Nova Sessão"** e preencha:

| Campo | Descrição |
|-------|-----------|
| **Atendimento** | Selecione o agendamento correspondente |
| **Protocolo** | Selecione o protocolo usado (se aplicável) |
| **Anotações** | Descreva o que foi feito na sessão |
| **Notas de Evolução** | Compare com sessões anteriores |
| **Custo (R$)** | Energia, material descartável, etc. |
| **Peso (kg)** | Peso do paciente na sessão |
| **Fotos/Vídeos** | Anexe mídias da evolução |

### Áudio e Transcrição (IA)

Clique no microfone 🎤 **"Gravar Áudio"** para gravar suas anotações faladas. O app transcreve automaticamente usando IA (Whisper). Depois, clique em ✨ **"Analisar Clínica"** para a IA estruturar em Resumo, Achados e Conduta.

### Sessão por Voz Completa (IA)

Clique em 🎤 **"Sessão por Voz"** e descreva a sessão inteira falando. A IA preenche automaticamente: anotações, evolução, custo, peso e protocolo.

### Sugerir Evolução (IA)

Com as anotações preenchidas, clique em ✨ **"Sugerir com IA"** para gerar notas de evolução profissional automaticamente.

### Relatório com IA

Clique em ✨ **"Relatório com IA"** para gerar um texto em linguagem clara para o tutor — ótimo para compartilhar no WhatsApp.

### Previsão de Sessões

Clique em ✨ **"Previsão de Sessões"** para a IA estimar quantas sessões ainda são necessárias com base no histórico.

### Gráfico de Peso

O gráfico de peso na página do paciente mostra a evolução do peso ao longo do tempo.

### Comparador de Fotos Antes/Depois (IA)

Na aba **Galeria**, selecione duas fotos (Antes e Depois) e clique em **"Comparar com IA"** para o IA analisar a evolução visual entre elas.

### Relatório PDF para Tutor

Clique em **"Gerar PDF"** na página do paciente para gerar um relatório completo de evolução — inclui resumo, dados do paciente e assinatura digital. Perfeito para enviar ao tutor.

---

## 6. Equipamentos e Estoque

### Cadastrar equipamento

1. Vá em **Equipamentos** no menu
2. Clique em **"Novo Equipamento"**
3. Preencha: nome, modelo, data da última manutenção
4. Clique em **"Cadastrar"**

### Controle de Estoque (Insumos e Medicamentos)

1. Vá em **Estoque** no menu
2. Cadastre insumos (agulhas, luvas) e medicamentos com:
   - Quantidade atual e quantidade mínima (alerta)
   - Lote, validade e fornecedor
   - Unidade (ml, comprimidos, unidades)

> ⚠️ Itens com quantidade abaixo do mínimo aparecem destacados.

---

## 7. Protocolos

### Biblioteca de Protocolos

1. Vá em **Protocolos** no menu
2. Cadastre templates de tratamento:
   - **Nome** — ex: "Protocolo de Artrite"
   - **Equipamento** — selecione o aparelho usado (laser, ultrassom, etc.)
   - **Configurações** — parâmetros em JSON (intensidade, tempo, frequência)

### Usar na sessão

Ao registrar uma sessão, selecione o protocolo usado — ele fica vinculado ao histórico do paciente.

---

## 8. Receituário

### Criar prescrição

1. Vá em **Receituário** no menu
2. Clique em **"Novo Receituário"**
3. Selecione o **paciente**
4. Adicione medicamentos com:
   - Medicamento, dosagem, frequência, duração, via de administração
5. Adicione observações se necessário
6. Clique em **"Salvar"**

### Imprimir receita

Clique em **"Imprimir"** na receita — o app formata para impressão em papel A4, ocultando menus e botões.

---

## 9. Financeiro

### Acompanhamento

Vá em **Financeiro** no menu para ver:

| Indicador | Descrição |
|-----------|-----------|
| **Faturamento Hoje** | Valor dos atendimentos de hoje |
| **Faturamento no Mês** | Total do mês atual |
| **Faturamento Total** | Histórico completo |
| **Custos Totais** | Soma dos custos das sessões |
| **Margem de Lucro** | Receita - Custos |

### Gráficos
- **Formas de Pagamento** (pizza) — distribuição por Pix, Cartão, Dinheiro
- **Receita Diária** (linha) — faturamento ao longo do tempo (7/30/90 dias)

### Metas Mensais
Defina uma meta de faturamento para o mês e acompanhe o progresso com barra colorida:
- 🟢 Verde ≥ 100% da meta
- 🔵 Azul ≥ 75%
- 🟡 Amarelo ≥ 50%
- 🔴 Vermelho < 50%

### Extrato
Histórico completo de todos os atendimentos com paginação (15 por página).

### Exportar CSV
Clique em **"Exportar CSV"** para baixar o extrato em Excel/Planilhas.

---

## 10. Portal do Tutor

### Compartilhar link

Na página do paciente, clique em **"Compartilhar"** ou **"Copiar Link"** para gerar um link único.

### O que o tutor vê

O tutor **não precisa de login** — ele acessa pelo link e vê:
- ☝️ Resumo do pet (nome, espécie, tutor)
- 📅 Próximos agendamentos
- 📋 Histórico de sessões realizadas
- 🖼️ Fotos das sessões (galeria)
- 📄 Botão para baixar relatório de evolução em PDF

> Ideal para enviar pelo WhatsApp após o atendimento!

---

## 11. Configurações de IA

### Configurar provedor

1. Vá em **Configurações** no menu
2. Na seção **Provedor**, escolha:
   - **Groq** (gratuito, rápido — bom para testes)
   - **OpenAI** (recomendado — suporta tudo: chat, visão, áudio, **embeddings**)
   - **Gemini** (bom para embeddings também)
   - **Anthropic** (Claude — ótimo para análises clínicas)
   - **OpenRouter** (acesso a vários modelos)
3. Insira sua **chave de API** do provedor
4. Escolha o **modelo de chat**
5. Clique em **"Salvar"** e depois **"Testar Conexão"**

### O que a IA faz no app

| Funcionalidade | Descrição |
|---------------|-----------|
| 🎤 Transcrição de áudio | Gravação vira texto |
| 🔬 Análise clínica | IA estrutura em Resumo/Achados/Conduta |
| ✍️ Sugerir evolução | Gera notas profissionais |
| 📸 Comparar fotos | Analisa evolução visual |
| 💰 Sugerir preço | Estima valor do atendimento |
| 📈 Prever sessões | Calcula sessões restantes |
| 💡 Insight do dia | Resumo inteligente do dia |
| 🔍 Busca Inteligente | Encontra pacientes em linguagem natural |
| 📄 Relatório para tutor | Texto claro para compartilhar |

> 🔒 **Segurança:** sua chave de API fica criptografada no seu navegador. Nenhum dado passa por servidores intermediários.

### Busca Inteligente

Se você usa OpenAI ou Gemini, a **Busca Inteligente** é ativada automaticamente na página de pacientes. Digite como se fosse uma conversa:

> *"cachorro com problema no joelho que fez laser semana passada"*

O app busca por **significado**, não por palavras exatas.

Para gerar embeddings dos pacientes já cadastrados, vá em **Configurações → Busca Inteligente** e clique em **"Gerar embeddings para pacientes existentes"**.

---

## 12. Multi-Clínica

### Criar clínica

1. Vá em **Configurações → Clínica**
2. Preencha o nome da clínica
3. Pronto — agora você é o **dono** da clínica

### Convidar membros

1. Na página da clínica, clique em **"Convidar"**
2. Digite o e-mail do colega veterinário
3. Ele recebe um link por e-mail para aceitar o convite

### O que é compartilhado?
Membros da mesma clínica compartilham: pacientes, agenda, sessões, equipamentos, protocolos, financeiro.

### Permissões
Apenas o **dono** da clínica pode:
- Editar dados da clínica
- Convidar/remover membros
- Excluir dados

---

## 13. Dúvidas Frequentes

### Esqueci minha senha
Na tela de login, clique em **"Esqueci minha senha"** e siga as instruções enviadas por e-mail.

### O app funciona offline?
Sim! O app tem suporte offline básico:
- Dados em cache ficam disponíveis
- Alterações feitas offline são sincronizadas quando você voltar à internet
- Uma faixa amarela "Você está offline" aparece no topo

### Posso usar no celular?
Sim! O app é responsivo e funciona muito bem em celular e tablet. Você também pode **instalar como aplicativo**:
- **Android:** Chrome → "Adicionar à tela inicial"
- **iPhone:** Safari → Compartilhar → "Adicionar à tela de início"
- **Desktop:** Chrome → 🔒 → "Instalar VetPro"

### Como imprimir a receita?
Na página do receituário, clique em **"Imprimir"** — o app formata automaticamente para impressão.

### Preciso de internet para usar a IA?
Sim. As funcionalidades de IA (transcrição, análise, busca inteligente) exigem conexão com a internet.

### Como configuro o WhatsApp?
Vá em **Configurações → Notificações WhatsApp** e preencha:
- URL da API Evolution
- Chave de API da instância
- Nome da instância

> 💡 A instância Evolution API precisa ter o QR Code escaneado com o WhatsApp da clínica.

### Tenho mais de uma clínica?
Sim! Use o sistema **Multi-Clínica** em Configurações para criar clínicas separadas. Cada clínica tem seus próprios dados e membros.

---

> 🐾 **VetPro App** — https://vetpro.housecloud.tec.br
>
> Em caso de dúvidas, sugestões ou problemas, fale com o desenvolvedor!
