import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useLeadStore } from '../../store/leadStore';
import KanbanBoard from '../../components/kanban/KanbanBoard';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { fetchKanbanBoard, isLoading } = useLeadStore();

  useEffect(() => {
    fetchKanbanBoard();
  }, [fetchKanbanBoard]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CRM Kanban</h1>
              <p className="text-sm text-gray-600">{user?.tenant.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <KanbanBoard />
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
