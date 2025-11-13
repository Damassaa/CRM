import { create } from 'zustand';
import api from '../services/api';
import toast from 'react-hot-toast';

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  estimatedValue?: number;
  columnId: string;
  positionInColumn: number;
  tags: string[];
  responsible?: {
    id: string;
    name: string;
    email: string;
  };
  enteredCurrentColumnAt: string;
  createdAt: string;
}

export interface Column {
  id: string;
  name: string;
  color: string;
  icon?: string;
  position: number;
  isWinColumn: boolean;
  isLostColumn: boolean;
  leads: Lead[];
}

interface LeadState {
  columns: Column[];
  isLoading: boolean;
  fetchKanbanBoard: () => Promise<void>;
  moveLead: (leadId: string, newColumnId: string, newPosition?: number) => Promise<void>;
  createLead: (data: Partial<Lead>) => Promise<void>;
  updateLead: (leadId: string, data: Partial<Lead>) => Promise<void>;
  deleteLead: (leadId: string) => Promise<void>;
}

export const useLeadStore = create<LeadState>((set, get) => ({
  columns: [],
  isLoading: false,

  fetchKanbanBoard: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/leads/kanban');
      set({ columns: response.data.data, isLoading: false });
    } catch (error) {
      console.error('Error fetching kanban board:', error);
      set({ isLoading: false });
    }
  },

  moveLead: async (leadId: string, newColumnId: string, newPosition?: number) => {
    try {
      await api.post(`/leads/${leadId}/move`, {
        columnId: newColumnId,
        position: newPosition,
      });

      // Optimistic update
      await get().fetchKanbanBoard();
      toast.success('Lead movido com sucesso!');
    } catch (error) {
      console.error('Error moving lead:', error);
      toast.error('Erro ao mover lead');
    }
  },

  createLead: async (data: Partial<Lead>) => {
    try {
      await api.post('/leads', data);
      await get().fetchKanbanBoard();
      toast.success('Lead criado com sucesso!');
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  },

  updateLead: async (leadId: string, data: Partial<Lead>) => {
    try {
      await api.patch(`/leads/${leadId}`, data);
      await get().fetchKanbanBoard();
      toast.success('Lead atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  },

  deleteLead: async (leadId: string) => {
    try {
      await api.delete(`/leads/${leadId}`);
      await get().fetchKanbanBoard();
      toast.success('Lead deletado com sucesso!');
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Erro ao deletar lead');
    }
  },
}));
