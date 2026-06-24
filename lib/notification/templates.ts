import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export type TemplateVars = {
  tutor: string
  paciente: string
  especie: string
  tipo: string
  data: string
  hora: string
  vet: string
  endereco: string
}

export function renderTemplate(template: string, vars: TemplateVars): string {
  return template
    .replace(/\{\{tutor\}\}/g, vars.tutor)
    .replace(/\{\{paciente\}\}/g, vars.paciente)
    .replace(/\{\{especie\}\}/g, vars.especie)
    .replace(/\{\{tipo\}\}/g, vars.tipo)
    .replace(/\{\{data\}\}/g, vars.data)
    .replace(/\{\{hora\}\}/g, vars.hora)
    .replace(/\{\{vet\}\}/g, vars.vet)
    .replace(/\{\{endereco\}\}/g, vars.endereco)
}

export function buildTemplateVars(params: {
  tutorNome: string
  pacienteNome: string
  especie: string
  tipo: 'fisio' | 'clinico' | 'externo'
  dataISO: string
  vetNome: string
  endereco: string | null
}): TemplateVars {
  const date = parseISO(params.dataISO)
  const tipoLabel = params.tipo === 'fisio' ? 'Fisioterapia'
    : params.tipo === 'externo' ? 'Externo (Domiciliar)'
    : 'Clínico'

  return {
    tutor: params.tutorNome,
    paciente: params.pacienteNome,
    especie: params.especie,
    tipo: tipoLabel,
    data: format(date, "dd/MM/yyyy", { locale: ptBR }),
    hora: format(date, "HH:mm", { locale: ptBR }),
    vet: params.vetNome,
    endereco: params.endereco || '',
  }
}
