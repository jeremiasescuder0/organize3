"use client"

import { useState, useEffect } from "react"
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { TodayFocus } from "@/components/today-focus"
import { WeeklyPlan } from "@/components/weekly-plan"
import { UpcomingExams } from "@/components/upcoming-exams"
import { SmartRecommendations } from "@/components/smart-recommendations"
import { QuickActions } from "@/components/quick-actions"

type ModuleId = "today" | "weekly" | "exams" | "recommendations" | "actions"

const MODULES: { id: ModuleId; label: string; component: React.ReactNode }[] = [
  { id: "today",           label: "Enfoque de Hoy",        component: <TodayFocus /> },
  { id: "weekly",          label: "Plan Semanal",           component: <WeeklyPlan /> },
  { id: "exams",           label: "Próximos Exámenes",      component: <UpcomingExams /> },
  { id: "recommendations", label: "Recomendaciones",        component: <SmartRecommendations /> },
  { id: "actions",         label: "Acciones Rápidas",       component: <QuickActions /> },
]

const STORAGE_KEY = "dashboard_module_order"

function getDefaultOrder(): ModuleId[] {
  return MODULES.map(m => m.id)
}

function loadOrder(): ModuleId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultOrder()
    const parsed: ModuleId[] = JSON.parse(raw)
    // Ensure all current modules are present (in case new ones were added)
    const missing = getDefaultOrder().filter(id => !parsed.includes(id))
    return [...parsed.filter(id => getDefaultOrder().includes(id)), ...missing]
  } catch {
    return getDefaultOrder()
  }
}

// ── Sortable item wrapper ──────────────────────────────
function SortableModule({
  id,
  children,
  label,
  isDragging,
}: {
  id: ModuleId
  children: React.ReactNode
  label: string
  isDragging: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isOver } =
    useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        aria-label={`Mover ${label}`}
        className="absolute -left-7 top-3 z-10 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Drop indicator */}
      {isOver && (
        <div className="absolute inset-0 rounded-lg ring-2 ring-primary/50 pointer-events-none z-10" />
      )}

      {children}
    </div>
  )
}

// ── Ghost overlay ──────────────────────────────────────
function DragGhost({ label }: { label: string }) {
  return (
    <div className="px-4 py-3 rounded-lg border border-primary/50 bg-card shadow-xl text-sm font-medium text-foreground flex items-center gap-2 cursor-grabbing opacity-90">
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      {label}
    </div>
  )
}

// ── Main component ─────────────────────────────────────
export function DraggableDashboard() {
  const [order, setOrder] = useState<ModuleId[]>(getDefaultOrder)
  const [activeId, setActiveId] = useState<ModuleId | null>(null)

  useEffect(() => {
    setOrder(loadOrder())
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as ModuleId)
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const oldIndex = order.indexOf(active.id as ModuleId)
    const newIndex = order.indexOf(over.id as ModuleId)
    const next = arrayMove(order, oldIndex, newIndex)
    setOrder(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const moduleMap = Object.fromEntries(MODULES.map(m => [m.id, m]))
  const left = order.slice(0, 3)
  const right = order.slice(3)
  const activeModule = activeId ? moduleMap[activeId] : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="grid gap-6 lg:grid-cols-3 pl-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <SortableContext items={left} strategy={verticalListSortingStrategy}>
            {left.map(id => (
              <SortableModule key={id} id={id} label={moduleMap[id].label} isDragging={activeId === id}>
                {moduleMap[id].component}
              </SortableModule>
            ))}
          </SortableContext>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <SortableContext items={right} strategy={verticalListSortingStrategy}>
            {right.map(id => (
              <SortableModule key={id} id={id} label={moduleMap[id].label} isDragging={activeId === id}>
                {moduleMap[id].component}
              </SortableModule>
            ))}
          </SortableContext>
        </div>
      </div>

      <DragOverlay>
        {activeModule ? <DragGhost label={activeModule.label} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
