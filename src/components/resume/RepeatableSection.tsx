import type { ReactNode } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { GripVertical, Plus, Trash2 } from 'lucide-react'

interface RepeatableItem {
  id: string
}

interface Props<T extends RepeatableItem> {
  title: string
  kicker?: string
  items: T[]
  onChange: (next: T[]) => void
  renderItem: (item: T, onItemChange: (next: T) => void, index: number) => ReactNode
  makeEmpty: () => T
  addLabel?: string
  emptyLabel?: string
  rightSlot?: ReactNode
}

export default function RepeatableSection<T extends RepeatableItem>({
  title,
  kicker,
  items,
  onChange,
  renderItem,
  makeEmpty,
  addLabel = 'Add entry',
  emptyLabel = 'No entries yet.',
  rightSlot,
}: Props<T>) {
  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result
    if (!destination || source.index === destination.index) return
    const next = [...items]
    const [moved] = next.splice(source.index, 1)
    next.splice(destination.index, 0, moved)
    onChange(next)
  }

  const handleAdd = () => {
    onChange([...items, makeEmpty()])
  }

  const handleRemove = (id: string) => {
    onChange(items.filter((i) => i.id !== id))
  }

  const handleItemChange = (id: string, next: T) => {
    onChange(items.map((i) => (i.id === id ? next : i)))
  }

  const droppableId = `repeatable-${title.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <header className="mb-5 flex items-center justify-between gap-4">
        <div>
          {kicker && (
            <p className="mb-1 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-text-muted">
              {kicker}
            </p>
          )}
          <h2 className="font-display text-xl text-text-primary">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {rightSlot}
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
          >
            <Plus className="h-3.5 w-3.5" />
            {addLabel}
          </button>
        </div>
      </header>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId={droppableId}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-3"
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(drag, snapshot) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      className={`group rounded-xl border border-border bg-background transition-shadow ${
                        snapshot.isDragging ? 'shadow-lg shadow-accent/10 border-accent/30' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2 p-4">
                        <div
                          {...drag.dragHandleProps}
                          className="mt-1 cursor-grab text-text-muted hover:text-text-secondary active:cursor-grabbing"
                          aria-label="Drag to reorder"
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          {renderItem(item, (next) => handleItemChange(item.id, next), index)}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          className="rounded-lg p-2 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                          aria-label="Remove entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-text-muted">
                  {emptyLabel}
                </p>
              ) : (
                // Tail trigger: anchor an "add another" button right below
                // the last item so the user never has to scroll up to the
                // header trigger after filling in a long entry.
                <button
                  type="button"
                  onClick={handleAdd}
                  className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 text-sm text-text-muted transition-colors hover:border-accent/60 hover:text-accent"
                >
                  <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                  {addLabel}
                </button>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </section>
  )
}
