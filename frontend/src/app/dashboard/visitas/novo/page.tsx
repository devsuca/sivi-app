'use client';

import { useState, useCallback, useEffect } from 'react';
import { AxiosError } from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createVisita } from '@/services/visitaService';
import { useDataFetching, FetchedData } from '@/hooks/useDataFetching';
import { useVisitaForm } from '@/hooks/useVisitaForm';
import VisitanteSearch from '@/components/visitas/VisitanteSearch';
import VisitaDetails from '@/components/visitas/VisitaDetails';
import AcompanhantesManager from '@/components/visitas/AcompanhantesManager';
import ViaturasManager from '@/components/visitas/ViaturasManager';
import PertencesManager from '@/components/visitas/PertencesManager';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Visitante } from '@/types/pessoa';
import { useAuth } from '@/lib/auth';

const estadoLabels: { [key: string]: string } = {
    agendada: 'Agendada',
    em_curso: 'Em Curso',
    concluida: 'Concluída',
    cancelada: 'Cancelada',
};

export default function NovaVisitaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState<{ numero: string | null } | null>(null);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [autoSelectionDone, setAutoSelectionDone] = useState(false);

  // Função de teste para simular seleção automática (disponível no console)
  const testAutoSelection = (visitanteId: string) => {
    
    // Simular parâmetros da URL
    const testUrl = new URL(window.location.href);
    testUrl.searchParams.set('visitanteId', visitanteId);
    testUrl.searchParams.set('autoSelect', 'true');
    window.history.replaceState({}, '', testUrl.toString());
    
    // Resetar o estado de seleção automática
    setAutoSelectionDone(false);
    
  };

  // Tornar a função disponível globalmente para debug
  if (typeof window !== 'undefined') {
    (window as any).testAutoSelection = testAutoSelection;
  }

  // Custom hooks for data fetching and form state management
  const { visitantes, orgaos, efetivos, setData, loading: dataLoading, error: dataError } = useDataFetching();
  const { formState, setFormField, setAcompanhantes, setViaturas, setPertences, resetForm } = useVisitaForm();

  const displayToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 4000);
  }, []);

  // Detectar parâmetros da URL para seleção automática de visitante
  useEffect(() => {
    const visitanteId = searchParams.get('visitanteId');
    const autoSelect = searchParams.get('autoSelect');
    
    if (visitanteId && autoSelect === 'true' && !autoSelectionDone) {
      
      if (visitantes.length === 0) {
        return;
      }
      
      // Verificar se o visitante existe na lista
      const visitante = visitantes.find(v => v.id === visitanteId);
      
      if (visitante) {
        try {
          setFormField('visitante', visitanteId);
          
          // Marcar que a seleção automática foi feita
          setAutoSelectionDone(true);
          
          displayToast(`Visitante "${visitante.nome}" foi selecionado automaticamente! Agora você pode continuar preenchendo os dados da visita.`, 'success');
          
          // Limpar os parâmetros da URL após a seleção
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('visitanteId');
          newUrl.searchParams.delete('autoSelect');
          window.history.replaceState({}, '', newUrl.toString());
        } catch (error) {
          displayToast('Erro ao selecionar visitante automaticamente. Tente selecionar manualmente.', 'error');
          setAutoSelectionDone(true); // Marcar como feito mesmo com erro para evitar loops
        }
      } else {
        displayToast('Visitante não encontrado na lista atual. Verifique se o visitante foi cadastrado corretamente.', 'warning');
        setAutoSelectionDone(true); // Marcar como feito para evitar tentativas repetidas
      }
    } else if (!visitanteId || !autoSelect) {
    } else if (autoSelectionDone) {
    }
  }, [visitantes, searchParams, setFormField, displayToast, autoSelectionDone]);

  const handleNewVisitorFound = (newVisitor: Visitante) => {
    setData((currentData: FetchedData) => {
      if (currentData.visitantes.some(v => v.id === newVisitor.id)) {
        return currentData;
      }
      return {
        ...currentData,
        visitantes: [newVisitor, ...currentData.visitantes]
      };
    });
    setFormField('visitante', newVisitor.id);
  };

  const handleVisitorCreated = (newVisitor: Visitante) => {
    // Adicionar o novo visitante à lista
    setData((currentData: FetchedData) => ({
      ...currentData,
      visitantes: [newVisitor, ...currentData.visitantes]
    }));
  };

  // Função corrigida para tratar seleção de efetivo
  const handleEfetivoChange = (value: string) => {
    // Salva o ID do efetivo como string
    setFormField('efetivo_visitar', value);
    
    // Busca o efetivo selecionado para preencher o órgão automaticamente
    const efetivoSelecionado = efetivos.find(e => String(e.id) === String(value));
    if (efetivoSelecionado && efetivoSelecionado.orgao) {
      setFormField('orgao', efetivoSelecionado.orgao);
    }
  };

  // Função corrigida para tratar mudanças nos campos
  const handleFieldChange = (field: keyof typeof formState, value: any) => {
    if (field === 'efetivo_visitar') {
      handleEfetivoChange(String(value));
    } else {
      setFormField(field, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Para usuários de recepção, garantir que o estado seja sempre "agendada" e o órgão seja o do usuário
    if (user?.role === 'recepcao') {
      if (formState.estado !== 'agendada') {
        setFormField('estado', 'agendada');
      }
      if (user?.orgao && formState.orgao !== String(user.orgao.id)) {
        setFormField('orgao', String(user.orgao.id));
      }
    }
    
    // Validação dos campos obrigatórios
    const missingFields: string[] = [];
    if (!formState.visitante) missingFields.push('Visitante');
    // Backend permite efetivo_visitar opcional, mas exige orgao
    if (!formState.orgao) missingFields.push('Órgão');
    if (!formState.motivo) missingFields.push('Motivo');
    
    // Validação de acompanhantes
    if ((formState.acompanhantes || []).length > 0) {
      formState.acompanhantes.forEach((a, idx) => {
        if (!a.nome) missingFields.push(`Acompanhante ${idx + 1}: Nome`);
        if (!a.documento_tipo) missingFields.push(`Acompanhante ${idx + 1}: Tipo de documento`);
        if (!a.documento_numero) missingFields.push(`Acompanhante ${idx + 1}: Número do documento`);
      });
    }
    
    if (missingFields.length > 0) {
      displayToast('Preencha os campos obrigatórios: ' + missingFields.join(', '), 'warning');
      return;
    }

    setLoading(true);
    
    try {
      // O serviço já faz sanitização; apenas passamos o estado atual
      const payload = { ...formState } as any;

      // Se for interveniente de processo, anexar essa informação nas observações para persistência
      if (payload.is_interveniente_processo) {
        const tag = `Interveniente de processo: ${payload.numero_processo || 's/ nº'}`;
        payload.observacoes = payload.observacoes
          ? `${payload.observacoes}\n${tag}`
          : tag;
      }

      const visita = await createVisita(payload);
      setShowAlert({ numero: visita.numero ? String(visita.numero) : null });
      resetForm();
      
      setTimeout(() => {
        setShowAlert(null);
        // Redirecionar para o formulário de crachás com o ID da visita criada
        if (visita && visita.id) {
          router.push(`/dashboard/crachas?visitaId=${visita.id}&autoAssign=true`);
        } else {
          router.push('/dashboard/crachas');
        }
      }, 3000);
    } catch (err) {
      let errorMsg = 'Erro ao salvar visita. Verifique os dados e tente novamente.';
      const error = err as AxiosError<any>;
      
      if (error?.response?.data) {
        const errData = error.response.data;
        if (typeof errData === 'object') {
          errorMsg = Object.entries(errData)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ');
        } else if (typeof errData === 'string') {
          errorMsg = errData;
        }
      }
      
      displayToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">A carregar dados...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (dataError) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <AlertCircle className="inline w-5 h-5 mr-2" />
          {dataError}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nova Visita</h1>
            <p className="text-gray-600 mt-2">Registe uma nova visita</p>
            {user?.role === 'recepcao' && user?.orgao && (
              <p className="text-sm text-blue-600 mt-1 font-medium">
                Órgão: {user.orgao.nome}
              </p>
            )}
          </div>
          <Badge 
            variant={
              formState.estado === 'concluida' ? 'default' : 
              formState.estado === 'em_curso' ? 'secondary' : 'outline'
            } 
            className={`text-sm ${user?.role === 'recepcao' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}`}
          >
            {estadoLabels[formState.estado] || 'Desconhecido'}
            {user?.role === 'recepcao' && (
              <span className="ml-1 text-xs">(Fixo)</span>
            )}
          </Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <VisitanteSearch 
            visitantes={visitantes} 
            selectedVisitanteId={formState.visitante}
            onVisitanteSelect={(id) => setFormField('visitante', id)}
            onVisitorFound={handleNewVisitorFound}
            onVisitorCreated={handleVisitorCreated}
            showToast={displayToast}
          />

          <VisitaDetails 
            formState={formState}
            onFieldChange={handleFieldChange}
            orgaos={orgaos} 
            efetivos={efetivos}
          />

          <AcompanhantesManager 
            initialData={formState.acompanhantes}
            onAcompanhantesChange={setAcompanhantes}
          />

          <ViaturasManager
            initialData={formState.viaturas}
            onViaturasChange={setViaturas}
          />

          {/* Pertences - apenas para usuários com permissão */}
          {user?.role && ['admin', 'portaria', 'secretaria'].includes(user.role) && (
            <PertencesManager
              initialData={formState.pertences}
              onPertencesChange={setPertences}
            />
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="min-w-24"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-24 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  A guardar...
                </>
              ) : (
                'Guardar Visita'
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg text-white animate-in slide-in-from-right-12 duration-300 ${
            showToast.type === 'success' ? 'bg-green-600' :
            showToast.type === 'error' ? 'bg-red-600' :
            showToast.type === 'warning' ? 'bg-yellow-600' :
            'bg-blue-600'
          }`}>
            {showToast.type === 'success' && <CheckCircle2 className="w-6 h-6 text-white" />}
            {showToast.type === 'error' && <AlertCircle className="w-6 h-6 text-white" />}
            {showToast.type === 'warning' && <AlertCircle className="w-6 h-6 text-white" />}
            {showToast.type === 'info' && <AlertCircle className="w-6 h-6 text-white" />}
            <span className="font-semibold">
              {showToast.type === 'success' ? 'Sucesso:' :
               showToast.type === 'error' ? 'Erro:' :
               showToast.type === 'warning' ? 'Atenção:' :
               'Info:'}
            </span>
            <span>{showToast.message}</span>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {showAlert && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 border-2 border-green-500 animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">Sucesso!</h2>
              <p className="text-gray-700 mb-6">A visita foi registada com sucesso.</p>
              <div className="bg-green-50 rounded-xl p-4 w-full mb-6">
                <p className="text-sm text-gray-600 mb-1">Número da Visita</p>
                <p className="text-3xl font-bold text-green-600 font-mono">{showAlert.numero}</p>
              </div>
              <p className="text-sm text-gray-500">A redirecionar para a lista de visitas...</p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}