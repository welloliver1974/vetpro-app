# Plano de Implementação - Comparador de Medidas e Peso com IA

Esta funcionalidade adiciona uma aba "Comparador IA" na tela de medidas corporais, permitindo ao usuário selecionar duas datas específicas para analisar todas as alterações físicas membro a membro junto com a variação de peso correspondente.

## User Review Required

> [!IMPORTANT]
> **Definição de Peso Próximo (Fallback)**
> Caso o usuário não tenha registrado o peso no dia exato da medição de circunferência (ex: mediu em um domingo mas se pesou na sexta anterior), buscaremos o peso ativo mais recente registrado até aquela data. Isso garante que a IA sempre tenha uma base de peso para realizar a análise corporal sem exigir precisão absoluta de pesagem diária.

## Proposed Changes

---

### [Componente: Server Functions]

#### [MODIFY] [medidas.functions.ts](file:///e:/Apps/fitwell/fitwellhub/src/server-fns/medidas.functions.ts)
Criaremos uma nova server function `compareMeasurementsWithAi` que receberá duas datas (`dateA` e `dateB`).
* **Autenticação**: Validação via middleware `requireSupabaseAuth`.
* **Busca de Medidas**:
  ```typescript
  const { data: measurements } = await supabase
    .from("body_measurements")
    .select("log_date, label, value_cm")
    .eq("user_id", userId)
    .in("log_date", [dateA, dateB]);
  ```
* **Busca de Pesos**:
  Para cada data (`dateA` e `dateB`), buscaremos o peso exato naquele dia. Se não houver, traremos o peso registrado mais recente até aquele dia:
  ```typescript
  // Exemplo para dateA
  const { data: weightAData } = await supabase
    .from("body_weights")
    .select("weight_kg, log_date")
    .eq("user_id", userId)
    .lte("log_date", dateA)
    .order("log_date", { ascending: false })
    .limit(1);
  ```
* **Formatação de Dados para a IA**:
  Agruparemos as medidas por membro (`label`) comparando os valores entre a Data A e a Data B.
  Exemplo de saída de texto enviada à IA:
  ```text
  ### Período de Comparação:
  - Data Base: 10/05/2026 (Peso: 80.0 kg)
  - Data Comparação: 10/06/2026 (Peso: 78.5 kg)

  ### Medidas Corporais Comparadas:
  - Cintura: de 85.0 cm (10/05) para 82.0 cm (10/06) [Diferença: -3.0 cm]
  - Braço Direito: de 36.0 cm (10/05) para 36.5 cm (10/06) [Diferença: +0.5 cm]
  - Braço Esquerdo: de 36.0 cm (10/05) para 36.2 cm (10/06) [Diferença: +0.2 cm]
  ```
* **Prompt da IA**:
  Instruir o LLaMA 3.3 70B (via Groq) a fazer o diagnóstico de recomposição corporal, perdas de gordura (focado em cintura/quadril/pochete/peso), ganhos de massa muscular (braços, ombros, peito, coxas), simetria (membros direitos vs esquerdos) e recomendações.

---

### [Componente: Telas / Rotas Frontend]

#### [MODIFY] [app.medidas.tsx](file:///e:/Apps/fitwell/fitwellhub/src/routes/app.medidas.tsx)
* **Novo Estado**:
  - `dateA`: primeira data para comparação (padrão: última data registrada).
  - `dateB`: segunda data para comparação (padrão: penúltima data registrada).
  - `comparisonAnalysis`: string contendo o retorno da IA.
  - `isComparing`: boolean de loading.
* **Extração das Datas com Medidas**:
  Para preencher os seletores (dropdowns), extrairemos todas as datas únicas que possuem medidas registradas a partir de `entries` (ordenadas da mais recente para a mais antiga).
* **Novo TabTrigger e TabsContent**:
  Adicionar a aba **"Comparador IA"** em `<TabsList>`:
  - Renderizar os dois dropdowns (`<Select>`) lado a lado para selecionar as datas A e B.
  - Exibir abaixo de cada seletor a lista rápida de todas as medidas e o peso daquele dia (com o indicador se o peso é exato ou histórico mais próximo).
  - Adicionar o botão "Comparar com IA" que dispara a chamada de rede.
  - Renderizar o resultado da comparação em um card premium integrado com suporte a markdown simples.

---

## Verification Plan

### Automated Tests
* Validar a compilação do projeto com `npm run build` para garantir que os tipos do TypeScript e as rotas do TanStack Router continuem válidos.

### Manual Verification
1. Acessar a rota `/app/medidas`.
2. Registrar medidas em duas datas diferentes para teste (ex: hoje e 7 dias atrás).
3. Acessar a nova aba **"Comparador IA"**.
4. Selecionar a Data A e a Data B.
5. Verificar se as listas de medidas de cada data são exibidas corretamente logo abaixo dos seletores.
6. Clicar no botão **"Comparar com IA"** e validar se o diagnóstico é gerado corretamente, exibindo o comparativo membro a membro e a avaliação de peso.
