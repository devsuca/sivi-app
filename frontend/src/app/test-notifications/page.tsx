'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import NotificationTestPanel from '@/components/notifications/NotificationTestPanel';
import NotificationCenter from '@/components/notifications/NotificationCenter';

export default function TestNotificationsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-2">
              🧪 Teste do Sistema de Notificações DSI
            </h1>
            <p className="text-blue-100">
              Teste o sistema de notificações em tempo real para usuários de portaria do Departamento de Segurança Institucional
            </p>
          </div>

          {/* Painel de Teste */}
          <NotificationTestPanel />

          {/* Centro de Notificações */}
          <NotificationCenter />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
