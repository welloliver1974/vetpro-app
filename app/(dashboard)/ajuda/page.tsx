'use client'

import { BookOpen, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const sections = [
  {
    id: 'primeiros-passos',
    title: '1. Primeiros Passos',
    content: (
      <div className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-foreground mb-1">Acessar o sistema</p>
          <p className="text-muted-foreground">Abra o navegador e acesse <strong>https://vetpro.housecloud.tec.br</strong></p>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Criar conta</p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-1">
            <li>Clique em <strong>&quot;Criar conta&quot;</strong> na tela de login</li>
            <li>Preencha seu nome, e-mail e senha</li>
            <li>Pronto! Seu perfil já estará criado</li>
          </ol>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Login</p>
          <p className="text-muted-foreground">Entre com seu e-mail e senha cadastrados.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'dashboard',
    title: '2. Dashboard',
    content: (
      <div className="space-y-3 text-sm">
        <p className="text-muted-foreground">Ao entrar, você vê o Dashboard com um resumo do dia.</p>
        <div>
          <p className="font-medium text-foreground mb-1">Cards de resumo</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li><strong>Atendimentos de hoje</strong> — quantos agendamentos você tem no dia</li>
            <li><strong>Sessões de fisioterapia</strong> — quantas sessões foram registradas</li>
            <li><strong>Faturamento</strong> — valor total dos atendimentos concluídos</li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Gráficos</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li><strong>Formas de pagamento</strong> — pizza com Pix, Cartão, Dinheiro</li>
            <li><strong>Sessões por dia</strong> — barras com os dias mais movimentados</li>
            <li><strong>Receita diária</strong> — linha com evolução do faturamento</li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Filtro de período</p>
          <p className="text-muted-foreground">Use <strong>7 dias, 30 dias</strong> ou <strong>Personalizado</strong> no topo.</p>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Insight do Dia (IA)</p>
          <p className="text-muted-foreground">Clique em 💡 <strong>Insight do Dia</strong> para um resumo inteligente do seu dia.</p>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Personalizar widgets</p>
          <p className="text-muted-foreground">Clique em <strong>Personalizar</strong> para arrastar, ocultar ou reordenar os cards.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'pacientes',
    title: '3. Pacientes',
    content: (
      <div className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-foreground mb-1">Cadastrar paciente</p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-1">
            <li>Vá em <strong>Pacientes</strong> no menu lateral</li>
            <li>Clique em <strong>Novo Paciente</strong></li>
            <li>Preencha nome do animal (obrigatório), espécie, raça, tutor, contato e endereço</li>
            <li>Clique em <strong>Cadastrar</strong></li>
          </ol>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Busca Inteligente (IA)</p>
          <p className="text-muted-foreground">Digite em linguagem natural: <em>&quot;cachorro com problema no joelho que fez laser&quot;</em> — o app encontra os pacientes relacionados automaticamente. Requer OpenAI ou Gemini configurado.</p>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Ficha médica</p>
          <p className="text-muted-foreground">Ao clicar no paciente, você vê: <strong>Sessões, Linha do Tempo, Galeria</strong> (com comparador de fotos Antes/Depois) e <strong>Ficha Médica</strong> completa (queixa, histórico, alergias, vacinação).</p>
        </div>
      </div>
    ),
  },
  {
    id: 'agenda',
    title: '4. Agenda',
    content: (
      <div className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-foreground mb-1">Visualização</p>
          <p className="text-muted-foreground">Três modos: <strong>Semana, Mês</strong> ou <strong>Dia</strong>. Use o toggle para alternar.</p>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Criar atendimento</p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-1">
            <li>Clique em um horário vazio na agenda</li>
            <li>Escolha paciente, tipo (Fisioterapia/Clínico/Externo), data e hora</li>
            <li>Marque <strong>Repetir</strong> para criar sessões recorrentes</li>
          </ol>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Tipos</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li><span className="text-blue-400">🔵 Fisioterapia</span> — na clínica</li>
            <li><span className="text-green-400">🟢 Clínico</span> — consulta geral</li>
            <li><span className="text-orange-400">🟠 Externo</span> — domiciliar (com endereço + link Maps)</li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Finalizar atendimento</p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-1">
            <li>Clique no card do atendimento e depois em <strong>Finalizar</strong></li>
            <li>Confirme o valor, forma de pagamento e assinatura digital do tutor</li>
            <li>Clique em <strong>Finalizar</strong></li>
          </ol>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Adicionar ao calendário</p>
          <p className="text-muted-foreground">Clique em 📅 para baixar arquivo .ics compatível com Google/Apple/Outlook.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'sessoes',
    title: '5. Prontuário e Sessões',
    content: (
      <div className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-foreground mb-1">Registrar sessão</p>
          <p className="text-muted-foreground">Na página do paciente, clique em <strong>Nova Sessão</strong> e preencha: atendimento, protocolo, anotações, notas de evolução, custo, peso e fotos/vídeos.</p>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Áudio e Transcrição (IA)</p>
          <p className="text-muted-foreground">Clique em 🎤 <strong>Gravar Áudio</strong> para ditar anotações. A IA transcreve automaticamente. Depois clique em ✨ <strong>Analisar Clínica</strong> para estruturar em Resumo, Achados e Conduta.</p>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Sessão por Voz Completa (IA)</p>
          <p className="text-muted-foreground">Clique em 🎤 <strong>Sessão por Voz</strong> e descreva a sessão falando. A IA preenche anotações, evolução, custo e peso automaticamente.</p>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Ferramentas de IA</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>✨ <strong>Sugerir Evolução</strong> — gera notas profissionais a partir das anotações</li>
            <li>✨ <strong>Relatório com IA</strong> — texto claro para compartilhar com o tutor</li>
            <li>✨ <strong>Previsão de Sessões</strong> — estima quantas sessões ainda são necessárias</li>
            <li>📸 <strong>Comparar Fotos</strong> — IA analisa evolução visual Antes/Depois</li>
            <li>📄 <strong>Relatório PDF</strong> — gera PDF completo com evolução + assinatura</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'equipamentos',
    title: '6. Equipamentos e Estoque',
    content: (
      <div className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-foreground mb-1">Equipamentos</p>
          <p className="text-muted-foreground">Cadastre aparelhos (laser, ultrassom, eletroestimulador) com modelo e data de manutenção.</p>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Estoque (Insumos e Medicamentos)</p>
          <p className="text-muted-foreground">Controle quantidade, lote, validade e fornecedor. Itens abaixo do mínimo são destacados.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'protocolos',
    title: '7. Protocolos',
    content: (
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">Crie templates de tratamento vinculados a equipamentos. Ex: <em>Protocolo de Artrite → Laser 808nm + Eletro 10min</em>.</p>
        <p className="text-muted-foreground">Ao registrar uma sessão, selecione o protocolo usado.</p>
      </div>
    ),
  },
  {
    id: 'receituario',
    title: '8. Receituário',
    content: (
      <div className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-foreground mb-1">Criar prescrição</p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-1">
            <li>Vá em <strong>Receituário</strong> no menu</li>
            <li>Clique em <strong>Novo Receituário</strong></li>
            <li>Selecione paciente e adicione medicamentos (dosagem, frequência, duração, via)</li>
          </ol>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Imprimir</p>
          <p className="text-muted-foreground">Clique em <strong>Imprimir</strong> para formatar em A4, ocultando menus e botões.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'financeiro',
    title: '9. Financeiro',
    content: (
      <div className="space-y-3 text-sm">
        <p className="text-muted-foreground">Acompanhe faturamento (hoje, mês, total), custos e margem de lucro.</p>
        <div>
          <p className="font-medium text-foreground mb-1">Metas Mensais</p>
          <p className="text-muted-foreground">Defina uma meta de faturamento e acompanhe o progresso com barra colorida (verde ≥ 100%, azul ≥ 75%, amarelo ≥ 50%, vermelho &lt; 50%).</p>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Exportar CSV</p>
          <p className="text-muted-foreground">Clique em <strong>Exportar CSV</strong> para baixar o extrato em Excel/Planilhas.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'portal-tutor',
    title: '10. Portal do Tutor',
    content: (
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">Na página do paciente, clique em <strong>Compartilhar</strong> ou <strong>Copiar Link</strong>.</p>
        <p className="text-muted-foreground">O tutor <strong>não precisa de login</strong> — vê resumo do pet, próximos agendamentos, sessões, fotos e PDF de evolução. Ideal para enviar no WhatsApp!</p>
      </div>
    ),
  },
  {
    id: 'config-ia',
    title: '11. Configurações de IA',
    content: (
      <div className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-foreground mb-1">Configurar provedor</p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-1">
            <li>Vá em <strong>Configurações</strong> no menu</li>
            <li>Escolha o provedor (Groq, OpenAI, Gemini, Anthropic, OpenRouter, Omniroute)</li>
            <li>Insira sua chave de API e escolha o modelo</li>
            <li>Clique em <strong>Salvar</strong> e depois <strong>Testar Conexão</strong></li>
          </ol>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Busca Inteligente</p>
          <p className="text-muted-foreground">Com OpenAI ou Gemini, a busca em pacientes entende linguagem natural. Para gerar embeddings de pacientes antigos, vá em Configurações → Busca Inteligente → <strong>Gerar embeddings para pacientes existentes</strong>.</p>
        </div>
        <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-3">
          <p className="text-xs text-amber-400">🔒 Sua chave de API fica criptografada no seu navegador. Nenhum dado passa por servidores intermediários.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'multiclinica',
    title: '12. Multi-Clínica',
    content: (
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">Em <strong>Configurações → Clínica</strong>, crie sua clínica e convite membros por e-mail.</p>
        <p className="text-muted-foreground">Membros compartilham pacientes, agenda, sessões e financeiro. Apenas o dono pode editar a clínica e gerenciar membros.</p>
      </div>
    ),
  },
  {
    id: 'faq',
    title: '13. Dúvidas Frequentes',
    content: (
      <div className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-foreground mb-1">Esqueci minha senha?</p>
          <p className="text-muted-foreground">Na tela de login, clique em <strong>Esqueci minha senha</strong>.</p>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Funciona offline?</p>
          <p className="text-muted-foreground">Sim! Dados em cache ficam disponíveis e alterações offline sincronizam automaticamente.</p>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Usar no celular?</p>
          <p className="text-muted-foreground">O app é responsivo. Dá para instalar como aplicativo pelo Chrome (Android) ou Safari (iPhone).</p>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Precisa de internet para a IA?</p>
          <p className="text-muted-foreground">Sim. Transcrição, análise clínica e busca inteligente exigem conexão.</p>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Guia completo</p>
          <p className="text-muted-foreground">
            Veja o guia detalhado no GitHub:{' '}
            <a href="https://github.com/welloliver1974/vetpro-app/blob/master/GUIA_DO_USUARIO.md"
               target="_blank"
               rel="noreferrer"
               className="text-primary hover:underline">
              GUIA_DO_USUARIO.md
            </a>
          </p>
        </div>
      </div>
    ),
  },
]

export default function AjudaPage() {
  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-primary" />
          Ajuda
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Guia rápido de como usar o VetPro. Clique em cada seção para expandir.
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0 divide-y divide-border">
          {sections.map((section) => (
            <details key={section.id} className="group">
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors list-none">
                <span className="text-sm font-medium text-card-foreground">{section.title}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180 shrink-0" />
              </summary>
              <div className="px-4 pb-4">
                {section.content}
              </div>
            </details>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Precisa de mais ajuda? Consulte o{' '}
        <a
          href="https://github.com/welloliver1974/vetpro-app/blob/master/GUIA_DO_USUARIO.md"
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          Guia do Usuário completo
        </a>
        {' '}ou fale com o desenvolvedor.
      </p>
    </div>
  )
}
