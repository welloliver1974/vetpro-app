'use client'

import { Filter } from 'lucide-react'

interface AgendaFiltersProps {
  filterTipo: string
  onFilterTipoChange: (value: string) => void
  filterStatus: string
  onFilterStatusChange: (value: string) => void
  filterPaciente: string
  onFilterPacienteChange: (value: string) => void
  onClear: () => void
}

export function AgendaFilters({
  filterTipo,
  onFilterTipoChange,
  filterStatus,
  onFilterStatusChange,
  filterPaciente,
  onFilterPacienteChange,
  onClear,
}: AgendaFiltersProps) {
  const hasActiveFilters = filterTipo || filterStatus || filterPaciente

  return (
    <div className="grid gap-2 mb-4 sm:flex sm:flex-wrap">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Filter className="h-3.5 w-3.5" /> Filtros:
      </div>

      <select
        value={filterTipo}
        onChange={(e) => onFilterTipoChange(e.target.value)}
        className="bg-muted border border-border text-foreground text-xs rounded-lg px-2 py-1.5"
      >
        <option value="">Todos os tipos</option>
        <option value="fisio">Fisioterapia</option>
        <option value="clinico">Clínico</option>
        <option value="externo">Externo</option>
      </select>

      <select
        value={filterStatus}
        onChange={(e) => onFilterStatusChange(e.target.value)}
        className="bg-muted border border-border text-foreground text-xs rounded-lg px-2 py-1.5"
      >
        <option value="">Todos os status</option>
        <option value="agendado">Agendado</option>
        <option value="em_andamento">Em andamento</option>
        <option value="concluido">Concluído</option>
      </select>

      <input
        type="text"
        value={filterPaciente}
        onChange={(e) => onFilterPacienteChange(e.target.value)}
        placeholder="Buscar paciente..."
        className="bg-muted border border-border text-foreground text-xs rounded-lg px-2 py-1.5 w-full sm:w-40 placeholder:text-muted-foreground"
      />

      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="text-xs text-primary hover:text-primary/80 px-2"
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}
