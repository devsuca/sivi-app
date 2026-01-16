'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { getVisitantes } from '@/services/pessoaService';
import { Visitante } from '@/types/pessoa';
import { PlusCircle, RefreshCw, Users } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from '@/components/data-table/data-table';
import { SortingState } from '@tanstack/react-table';
import { useAuth } from '@/lib/auth';
import RoleGuard, { useRolePermission, PermissionInfo } from '@/components/auth/RoleGuard';

export default function PessoasListPage() {
  const { user, isAuthenticated } = useAuth();
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [documentoFiltro, setDocumentoFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  
  // Verificar permissões - portaria, admin, recepcao podem acessar
  const allowedRoles = ['portaria', 'admin', 'recepcao', 'administrador'];
  const hasPermission = useRolePermission(allowedRoles);
  
  // Ordenação inicial por data de registro (decrescente - mais recentes primeiro)
  const initialSorting: SortingState = [
    {
      id: 'data_registo',
      desc: true, // true = decrescente (mais recentes primeiro)
    }
  ];

  useEffect(() => {
    const fetchVisitantes = async () => {
      try {
        console.log('🔍 Iniciando busca de visitantes...');
        console.log('🔍 URL da API:', process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api');
        console.log('🔍 Status de autenticação:', { isAuthenticated, user: user?.username });
        console.log('🔍 Token de acesso:', localStorage.getItem('accessToken') ? 'Presente' : 'Ausente');
        
        // Verificar se o usuário está autenticado
        if (!isAuthenticated) {
          console.warn('⚠️ Usuário não autenticado, aguardando...');
          return;
        }
        
        const data = await getVisitantes();
        
        // Garantir que data seja sempre um array válido
        const visitantesArray = Array.isArray(data) ? data : [];
        
        console.log('📊 Dados recebidos do serviço (primeiros 3):');
        console.log('📊 Total de visitantes:', visitantesArray.length);
        if (visitantesArray.length > 0) {
          visitantesArray.slice(0, 3).forEach((visitante, index) => {
            console.log(`${index + 1}. ${visitante.nome || visitante.designacao_social} - Data: ${visitante.data_registo} - ID: ${visitante.id}`);
          });
        } else {
          console.log('📊 Nenhum visitante encontrado');
        }
        
        setVisitantes(visitantesArray);
      } catch (error: any) {
        console.error('❌ Erro ao buscar visitantes:', error);
        console.error('❌ Status:', error.response?.status);
        console.error('❌ Dados da resposta:', error.response?.data);
        console.error('❌ Mensagem:', error.message);
        
        // Em caso de erro, definir array vazio para evitar problemas
        setVisitantes([]);
        
        // Mostrar toast de erro se disponível
        if (typeof window !== 'undefined' && (window as any).toast) {
          (window as any).toast.error('Erro ao carregar visitantes: ' + error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    // Só buscar dados se o usuário estiver autenticado
    if (isAuthenticated) {
      fetchVisitantes();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Função para recarregar os dados
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Recarregando visitantes...');
      const data = await getVisitantes();
      const visitantesArray = Array.isArray(data) ? data : [];
      setVisitantes(visitantesArray);
      console.log('✅ Visitantes recarregados:', visitantesArray.length);
    } catch (error: any) {
      console.error('❌ Erro ao recarregar visitantes:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const visitantesFiltrados = documentoFiltro
    ? visitantes.filter(v => v.documento_numero?.toLowerCase().includes(documentoFiltro.toLowerCase()))
    : visitantes;
  const visitantesTipoFiltrados = tipoFiltro
    ? visitantesFiltrados.filter(v => v.tipo_pessoa === tipoFiltro)
    : visitantesFiltrados;

  return (
    <DashboardLayout>
      <RoleGuard allowedRoles={allowedRoles}>
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary">Gestão de Visitantes</h1>
              <p className="text-muted-foreground text-sm mt-1">Lista dos visitantes cadastrados no sistema</p>
              <PermissionInfo allowedRoles={allowedRoles} />
            </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Recarregando...' : 'Recarregar'}
            </Button>
            <Link href="/dashboard/pessoas/novo">
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Adicionar Visitante
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        {/* Filtros */}
        <div className="mb-4 flex gap-4 items-center">
          <div>
            <label htmlFor="tipoFiltro" className="text-sm font-medium mr-2">Tipo de Pessoa:</label>
            <select
              id="tipoFiltro"
              value={tipoFiltro}
              onChange={e => setTipoFiltro(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">Todos</option>
              <option value="singular">Singular</option>
              <option value="coletiva">Coletiva</option>
            </select>
          </div>
          <div>
            <label htmlFor="documentoFiltro" className="text-sm font-medium mr-2">Filtrar por Nº Documento:</label>
            <input
              id="documentoFiltro"
              type="text"
              value={documentoFiltro}
              onChange={e => setDocumentoFiltro(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
              placeholder="Digite o número"
            />
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <span className="animate-pulse text-lg text-muted-foreground">A carregar...</span>
          </div>
        ) : visitantes.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum visitante cadastrado</h3>
            <p className="text-muted-foreground mb-6">Comece adicionando seu primeiro visitante ao sistema</p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Status da conexão:</strong> {isAuthenticated ? '✅ Conectado' : '❌ Não conectado'}</p>
                <p><strong>Total de visitantes:</strong> {visitantes.length}</p>
                <p><strong>Visitantes filtrados:</strong> {visitantesTipoFiltrados.length}</p>
                <p><strong>Última atualização:</strong> {new Date().toLocaleTimeString('pt-PT')}</p>
              </div>
            </div>
            <Link href="/dashboard/pessoas/novo">
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Adicionar Primeiro Visitante
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total de Visitantes</p>
                    <p className="text-2xl font-bold text-blue-900">{visitantes.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Singulares</p>
                    <p className="text-2xl font-bold text-green-900">
                      {visitantes.filter(v => v.tipo_pessoa === 'singular').length}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Coletivas</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {visitantes.filter(v => v.tipo_pessoa === 'coletiva').length}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Filtrados</p>
                    <p className="text-2xl font-bold text-orange-900">{visitantesTipoFiltrados.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-500" />
                </div>
              </div>
            </div>
            
            <DataTable 
              columns={columns} 
              data={visitantesTipoFiltrados} 
              initialSorting={initialSorting}
            />
          </div>
        )}
        </div>
      </RoleGuard>
    </DashboardLayout>
  );
}
