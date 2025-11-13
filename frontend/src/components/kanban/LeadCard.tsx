import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lead } from '../../store/leadStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadCardProps {
  lead: Lead;
  isDragging?: boolean;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, isDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const timeInColumn = formatDistanceToNow(new Date(lead.enteredCurrentColumnAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg shadow-sm p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition ${
        isDragging ? 'shadow-xl' : ''
      }`}
    >
      {/* Lead Name */}
      <h4 className="font-semibold text-gray-900 mb-2">{lead.name}</h4>

      {/* Contact Info */}
      <div className="space-y-1 text-sm text-gray-600 mb-3">
        {lead.phone && (
          <div className="flex items-center space-x-1">
            <span>📱</span>
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.email && (
          <div className="flex items-center space-x-1">
            <span>✉️</span>
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.company && (
          <div className="flex items-center space-x-1">
            <span>🏢</span>
            <span className="truncate">{lead.company}</span>
          </div>
        )}
      </div>

      {/* Value */}
      {lead.estimatedValue && (
        <div className="mb-3">
          <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
            💰 {formatCurrency(lead.estimatedValue)}
          </span>
        </div>
      )}

      {/* Tags */}
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {lead.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
        <span>{timeInColumn}</span>
        {lead.responsible && (
          <span className="font-medium">{lead.responsible.name}</span>
        )}
      </div>
    </div>
  );
};

export default LeadCard;
