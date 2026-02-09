import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function SortableItem({ id, children, className = '' }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${className}`}
      {...attributes}
    >
      <div
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="pl-8">
        {children}
      </div>
    </div>
  );
}

interface SortableListProps {
  items: Array<{ id: string; [key: string]: any }>;
  onReorder: (newItems: Array<{ id: string; [key: string]: any }>) => void;
  renderItem: (item: { id: string; [key: string]: any }, index: number) => React.ReactNode;
  className?: string;
  itemClassName?: string;
}

export function SortableList({
  items,
  onReorder,
  renderItem,
  className = '',
  itemClassName = ''
}: SortableListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);

      // Update order based on new position
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        order: index + 1
      }));

      onReorder(updatedItems);
    }

    setActiveId(null);
  };

  const activeItem = items.find((item) => item.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={className}>
          {items.map((item, index) => (
            <SortableItem
              key={item.id}
              id={item.id}
              className={itemClassName}
            >
              {renderItem(item, index)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeItem ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl opacity-50 border-2 border-blue-500">
            {renderItem(activeItem, items.findIndex(i => i.id === activeItem.id))}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
