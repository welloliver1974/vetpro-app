'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, EyeOff } from 'lucide-react'
import { type WidgetId, WIDGET_SPANS } from '@/hooks/useDashboardLayout'

interface WidgetWrapperProps {
  id: WidgetId
  isEditMode: boolean
  onToggle: (id: WidgetId) => void
  children: React.ReactNode
}

export function WidgetWrapper({ id, isEditMode, onToggle, children }: WidgetWrapperProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={`relative ${WIDGET_SPANS[id]} ${isEditMode ? 'ring-2 ring-primary/30 rounded-lg' : ''}`}
    >
      {isEditMode && (
        <>
          <div className="absolute top-2 left-2 z-10 flex gap-1">
            <button
              {...attributes}
              {...listeners}
              className="p-1.5 rounded-md bg-background/80 backdrop-blur-sm border border-border cursor-grab active:cursor-grabbing text-muted-foreground hover:text-card-foreground transition-colors"
              title="Arrastar para reordenar"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => onToggle(id)}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-background/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-destructive transition-colors"
            title="Ocultar widget"
          >
            <EyeOff className="h-4 w-4" />
          </button>
        </>
      )}
      {children}
    </div>
  )
}
