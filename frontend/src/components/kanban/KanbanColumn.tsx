import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column } from '../../store/leadStore';
import LeadCard from './LeadCard';

interface KanbanColumnProps {
  column: Column;
  onCreateLead: (columnId: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, onCreateLead }) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4"
      style={{ borderTop: `4px solid ${column.color}` }}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{column.icon || '📋'}</span>
          <h3 className="font-semibold text-gray-900">{column.name}</h3>
          <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
            {column.leads.length}
          </span>
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-3 min-h-[200px]">
        <SortableContext
          items={column.leads.map((lead) => lead.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>

        {column.leads.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Nenhum lead</p>
          </div>
        )}
      </div>

      {/* Add Lead Button */}
      <button
        onClick={() => onCreateLead(column.id)}
        className="mt-4 w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition text-sm font-medium"
      >
        + Adicionar Lead
      </button>
    </div>
  );
};

export default KanbanColumn;
