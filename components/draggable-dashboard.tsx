"use client"

import { useState, useEffect, useRef } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { TodayFocus } from "@/components/today-focus"
import { ExamFocus } from "@/components/exam-focus"
import { HomeCalendar } from "@/components/home-calendar"
import { SmartRecommendations } from "@/components/smart-recommendations"
import { QuickActions } from "@/components/quick-actions"

type ModuleId = "today" | "exams" | "calendar" | "recommendations" | "actions"
type ColumnId = "left" | "right"
type Layout = { left: ModuleId[]; right: ModuleId[] }

const MODULE_DEFS: { id: ModuleId; label: string; component: React.ReactNode }[] = [
  { id: "today",           label: "Tareas y TPs",      component: <TodayFocus /> },
  { id: "exams",           label: "Exámenes",          component: <ExamFocus /> },
  { id: "calendar",        label: "Calendario",        component: <HomeCalendar /> },
  { id: "recommendations", label: "Recomendaciones",   component: <SmartRecommendations /> },
  { id: "actions",         label: "Acciones Rápidas",  component: <QuickActions /> },
]

const STORAGE_KEY = "dashboard_layout_v5"

function getDefaultLayout(): Layout {
  return {
    left: ["today", "exams", "calendar"],
    right: ["recommendations", "actions"],
  }
}

function loadLayout(): Layout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultLayout()
    const parsed: Layout = JSON.parse(raw)
    const allIds = MODULE_DEFS.map(m => m.id)
    const saved = [...(parsed.left ?? []), ...(parsed.right ?? [])]
    const missing = allIds.filter(id => !saved.includes(id))
    return {
      left: [...(parsed.left ?? []).filter((id: string) => allIds.includes(id as ModuleId)), ...missing],
      right: (parsed.right ?? []).filter((id: string) => allIds.includes(id as ModuleId)),
    }
  } catch {
    return getDefaultLayout()
  }
}

// ── Droppable column ────────────────────────────────────
function DroppableColumn({
  id,
  children,
  className,
}: {
  id: ColumnId
  children: React.ReactNode
  className?: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={`${className ?? ""} transition-all duration-200 ${isOver ? "opacity-80" : ""}`}
    >
      {children}
    </div>
  )
}

// ── Drag dots indicator ─────────────────────────────────
function DragDots() {
  return (
    <div className="grid grid-cols-2 gap-[3px] w-fit">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="w-[3px] h-[3px] rounded-full bg-current" />
      ))}
    </div>
  )
}

// ── Sortable module wrapper ─────────────────────────────
function SortableModule({
  id,
  label,
  isDragging,
  children,
}: {
  id: ModuleId
  label: string
  isDragging: boolean
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.2 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <button
        {...attributes}
        {...listeners}
        aria-label={`Mover ${label}`}
        className="absolute top-0 right-0 z-10 p-1.5 cursor-grab active:cursor-grabbing text-muted-foreground/20 hover:text-muted-foreground/50 transition-colors"
      >
        <DragDots />
      </button>
      {children}
    </div>
  )
}

// ── Drag ghost ──────────────────────────────────────────
function DragGhost({ label }: { label: string }) {
  return (
    <div className="px-3 py-2 rounded border border-border/50 bg-background text-sm text-muted-foreground flex items-center gap-2 cursor-grabbing opacity-80">
      <DragDots />
      {label}
    </div>
  )
}

// ── Main component ──────────────────────────────────────
export function DraggableDashboard() {
  const [layout, setLayout] = useState<Layout>(getDefaultLayout)
  const [activeId, setActiveId] = useState<ModuleId | null>(null)
  const layoutRef = useRef(layout)

  useEffect(() => {
    setLayout(loadLayout())
  }, [])

  // Keep ref in sync so event handlers always see latest layout
  useEffect(() => {
    layoutRef.current = layout
  }, [layout])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const moduleMap = Object.fromEntries(MODULE_DEFS.map(m => [m.id, m]))

  function findColumn(id: ModuleId, l: Layout): ColumnId | null {
    if (l.left.includes(id)) return "left"
    if (l.right.includes(id)) return "right"
    return null
  }

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as ModuleId)
  }

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const dragId = active.id as ModuleId
    const overId = over.id as string

    const current = layoutRef.current
    const fromCol = findColumn(dragId, current)

    // Determine target column
    const toCol: ColumnId =
      overId === "left" || overId === "right"
        ? (overId as ColumnId)
        : (findColumn(overId as ModuleId, current) ?? "left")

    if (!fromCol || fromCol === toCol) return

    // Move item to the other column (append at end)
    setLayout(prev => ({
      left:  toCol === "left"
        ? [...prev.left.filter(id => id !== dragId), dragId]
        : prev.left.filter(id => id !== dragId),
      right: toCol === "right"
        ? [...prev.right.filter(id => id !== dragId), dragId]
        : prev.right.filter(id => id !== dragId),
    }))
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    const current = layoutRef.current

    if (!over || active.id === over.id) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
      return
    }

    const dragId = active.id as ModuleId
    const overId = over.id as string

    // Dropped on column background — already moved in onDragOver
    if (overId === "left" || overId === "right") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
      return
    }

    // Reorder within the same column
    const col = findColumn(dragId, current)
    if (!col) return
    const items = current[col]
    const oldIdx = items.indexOf(dragId)
    const newIdx = items.indexOf(overId as ModuleId)

    if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
      const next: Layout = { ...current, [col]: arrayMove(items, oldIdx, newIdx) }
      setLayout(next)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
    }
  }

  const activeModule = activeId ? moduleMap[activeId] : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="grid gap-16 lg:grid-cols-[1fr_280px]">
        {/* Left column */}
        <DroppableColumn id="left" className="space-y-10">
          <SortableContext items={layout.left} strategy={verticalListSortingStrategy}>
            {layout.left.map(id => (
              <SortableModule key={id} id={id} label={moduleMap[id].label} isDragging={activeId === id}>
                {moduleMap[id].component}
              </SortableModule>
            ))}
          </SortableContext>
        </DroppableColumn>

        {/* Right column */}
        <DroppableColumn id="right" className="space-y-10">
          <SortableContext items={layout.right} strategy={verticalListSortingStrategy}>
            {layout.right.map(id => (
              <SortableModule key={id} id={id} label={moduleMap[id].label} isDragging={activeId === id}>
                {moduleMap[id].component}
              </SortableModule>
            ))}
          </SortableContext>
        </DroppableColumn>
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
        {activeModule ? <DragGhost label={activeModule.label} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
