import { chat } from './index'

export interface ParsedVoiceSession {
  notas: string | null
  notas_evolucao: string | null
  custo: number | null
  peso: number | null
  protocolo: string | null
}

export async function parseVoiceSession(
  transcript: string,
  patientName: string,
  protocolNames: string[]
): Promise<ParsedVoiceSession> {
  const prompt = `Extraia informações estruturadas desta transcrição de voz de uma sessão de fisioterapia veterinária.

Paciente: ${patientName}
Protocolos disponíveis: ${protocolNames.join(', ') || 'Nenhum'}

Transcrição:
"""
${transcript}
"""

Responda APENAS com um JSON válido, sem markdown, sem formatação extra:
{
  "notas": "descrição detalhada do que foi feito na sessão",
  "notas_evolucao": "notas de evolução e progresso observado",
  "custo": null ou número (se mencionado, sem símbolo R$),
  "peso": null ou número (se mencionado, em kg),
  "protocolo": null ou nome exato do protocolo (deve corresponder a um dos listados)
}

Se um campo não foi mencionado, use null.`

  const result = await chat(
    prompt,
    'Você é um assistente que extrai dados estruturados de transcrições clínicas veterinárias. Responda APENAS JSON válido.'
  )

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ParsedVoiceSession
    }
    return JSON.parse(result) as ParsedVoiceSession
  } catch {
    return {
      notas: result,
      notas_evolucao: null,
      custo: null,
      peso: null,
      protocolo: null,
    }
  }
}
