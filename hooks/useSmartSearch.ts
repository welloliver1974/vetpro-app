'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { generateEmbedding } from '@/lib/ai/embeddings'
import type { Patient } from './usePatients'

export type SmartSearchResult = Patient & { similarity: number }

/**
 * Hook de busca inteligente por similaridade semântica.
 *
 * Gera embedding da query e busca pacientes no Supabase via pgvector.
 * Se o provedor de IA não suportar embeddings, retorna null
 * (o caller deve usar fallback para filtro tradicional).
 *
 * Só ativa quando query tem 3+ caracteres.
 */
export function useSmartSearch(query: string) {
  return useQuery<SmartSearchResult[] | null>({
    queryKey: ['smart-search', query],
    queryFn: async () => {
      if (!query || query.length < 3) return null

      try {
        // 1. Gera embedding da query usando o provedor configurado
        const embedding = await generateEmbedding(query)
        if (!embedding || embedding.length === 0) return null

        // 2. Chama a função RPC do Supabase para buscar por similaridade
        const sb = await createClient()
        const { data, error } = await sb.rpc('match_patients', {
          query_embedding: embedding,
          match_threshold: 0.4,
          match_count: 20,
        })

        if (error) throw error

        // 3. Retorna dados compatíveis com Patient (para renderizar na tabela)
        return (data || []) as SmartSearchResult[]
      } catch {
        // Fallback silencioso: retorna null e o caller usa filtro .includes()
        return null
      }
    },
    enabled: query.length >= 3,
    staleTime: 30_000, // cache de 30s para mesma query
    retry: false,
  })
}
