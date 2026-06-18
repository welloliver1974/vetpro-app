import { z } from 'zod'

export const patientSchema = z.object({
  nome: z.string().min(2, 'Mínimo de 2 caracteres'),
  especie: z.string().optional().default(''),
  raca: z.string().optional().default(''),
  tutor_nome: z.string().optional().default(''),
  tutor_contato: z.string().optional().default(''),
  endereco: z.string().optional().default(''),
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

export type PatientFormData = z.infer<typeof patientSchema>
export type EquipmentFormData = z.infer<typeof equipmentSchema>
export type ProtocolFormData = z.infer<typeof protocolSchema>
