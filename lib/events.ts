// Simple cross-component event bus using CustomEvent
// Components dispatch events when data changes, listeners refresh their lists

export const EVENTS = {
  TASK_ADDED: "organize:task-added",
  TASK_COMPLETED: "organize:task-completed",
  EXAM_ADDED: "organize:exam-added",
} as const

export function dispatch(event: string) {
  window.dispatchEvent(new CustomEvent(event))
}
