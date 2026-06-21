import { z } from 'zod'

export const patientSchema = z.object({
  nome: z.string().min(2, 'Mínimo de 2 caracteres'),
  especie: z.string().optional().default(''),
  raca: z.string().optional().default(''),
  tutor_nome: z.string().optional().default(''),
  tutor_contato: z.string().optional().default(''),
  endereco: z.string().optional().default(''),
  data_nascimento: z.string().optional().default(''),
  sexo: z.string().optional().default(''),
  peso: z.coerce.number().positive('Deve ser positivo').optional().nullable(),
  cor_pelagem: z.string().optional().default(''),
  microchip: z.string().optional().default(''),
  queixa_principal: z.string().optional().default(''),
  historico_doenca_atual: z.string().optional().default(''),
  doencas_preexistentes: z.string().optional().default(''),
  medicamentos_continuos: z.string().optional().default(''),
  historico_cirurgico: z.string().optional().default(''),
  alergias: z.string().optional().default(''),
  vacinacao: z.string().optional().default(''),
  observacoes: z.string().optional().default(''),
})

export const patientAnamneseSchema = z.object({
  queixa_principal: z.string().optional().default(''),
  historico_doenca_atual: z.string().optional().default(''),
  doencas_preexistentes: z.string().optional().default(''),
  medicamentos_continuos: z.string().optional().default(''),
  historico_cirurgico: z.string().optional().default(''),
  alergias: z.string().optional().default(''),
  vacinacao: z.string().optional().default(''),
  observacoes: z.string().optional().default(''),
  cor_pelagem: z.string().optional().default(''),
})

export const equipmentSchema = z.object({
  nome: z.string().min(2, 'Mínimo de 2 caracteres'),
  modelo: z.string().optional().default(''),
  ultima_manutencao: z.string().optional().default(''),
})

export const protocolSchema = z.object({
  nome: z.string().min(2, 'Mínimo de 2 caracteres'),
  descricao: z.string().optional(),
  equipamento_id: z.string().optional(),
  configuracoes_padrao: z.record(z.string(), z.string()).optional(),
})

export const supplySchema = z.object({
  nome: z.string().min(2, 'Mínimo de 2 caracteres'),
  tipo: z.enum(['insumo', 'medicamento']),
  quantidade: z.coerce.number().int().min(0, 'Não pode ser negativo').default(0),
  quantidade_minima: z.coerce.number().int().min(0, 'Não pode ser negativo').default(0),
  unidade: z.string().default('un'),
  lote: z.string().optional().default(''),
  validade: z.string().optional().default(''),
  fornecedor: z.string().optional().default(''),
  observacoes: z.string().optional().default(''),
})

const prescriptionItemSchema = z.object({
  medicamento: z.string().min(2, 'Mínimo de 2 caracteres'),
  dosagem: z.string().optional().default(''),
  frequencia: z.string().optional().default(''),
  duracao: z.string().optional().default(''),
  via: z.string().optional().default(''),
  observacoes: z.string().optional().default(''),
})

export const monthlyGoalSchema = z.object({
  mes: z.coerce.number().int().min(1).max(12),
  ano: z.coerce.number().int().min(2020).max(2099),
  valor_meta: z.coerce.number().min(0, 'Valor deve ser positivo'),
})

export const prescriptionSchema = z.object({
  patient_id: z.string().min(1, 'Selecione um paciente'),
  items: z.array(prescriptionItemSchema).min(1, 'Adicione pelo menos um medicamento'),
  observacoes: z.string().optional().default(''),
})

export type PatientFormData = z.infer<typeof patientSchema>
export type EquipmentFormData = z.infer<typeof equipmentSchema>
export type ProtocolFormData = z.infer<typeof protocolSchema>
export type SupplyFormData = z.infer<typeof supplySchema>
