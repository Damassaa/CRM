import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useLeadStore, Lead } from '../../store/leadStore';
import KanbanColumn from './KanbanColumn';
import LeadCard from './LeadCard';
import CreateLeadModal from './CreateLeadModal';

const KanbanBoard: React.FC = () => {
  const { columns, moveLead } = useLeadStore();
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const lead = columns
      .flatMap((col) => col.leads)
      .find((l) => l.id === active.id);

    if (lead) {
      setActiveLead(lead);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveLead(null);
      return;
    }

    const leadId = active.id as string;
    const overId = over.id as string;

    // Check if dropped over a column
    const targetColumn = columns.find((col) => col.id === overId);

    if (targetColumn) {
      // Dropped on column - move to end of column
      moveLead(leadId, targetColumn.id);
    } else {
      // Dropped on another lead - find the column and position
      const targetLead = columns
        .flatMap((col) => col.leads)
        .find((l) => l.id === overId);

      if (targetLead) {
        moveLead(leadId, targetLead.columnId, targetLead.positionInColumn);
      }
    }

    setActiveLead(null);
  };

  const handleCreateLead = (columnId: string) => {
    setSelectedColumnId(columnId);
    setShowCreateModal(true);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          <SortableContext
            items={columns.map((col) => col.id)}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onCreateLead={handleCreateLead}
              />
            ))}
          </SortableContext>
        </div>

        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {showCreateModal && (
        <CreateLeadModal
          columnId={selectedColumnId || columns[0]?.id}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </>
  );
};

export default KanbanBoard;
