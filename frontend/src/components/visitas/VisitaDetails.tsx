'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { Orgao } from '@/types/orgao';
import { Efetivo } from '@/types/efetivo';
import { VisitaFormState } from '@/types/visita';
import { Calendar, Building, User, FileText, Lock } from 'lucide-react';
import { useMemo, useEffect, useState } from 'react';
import { debugFormData, debugFormState, debugSelectOptions } from '@/utils/debugForm';
import { useAuth } from '@/lib/auth';

interface VisitaDetailsProps {
  formState: VisitaFormState;
  onFieldChange: (field: keyof VisitaFormState, value: any) => void;
  orgaos: Orgao[];
  efetivos: Efetivo[];
}

const estados = [
  { value: 'agendada', label: 'Agendada', color: 'text-blue-600' },
  { value: 'em_curso', label: 'Em Curso', color: 'text-yellow-600' },
  { value: 'concluida', label: 'Concluída', color: 'text-green-600' },
];

export default function VisitaDetails({ formState, onFieldChange, orgaos, efetivos }: VisitaDetailsProps) {
  const [selectedEfetivo, setSelectedEfetivo] = useState<Efetivo | null>(null);
  const { user } = useAuth();

  // Filtrar efetivos pelo órgão selecionado (compatível com id ou objeto)
  const efetivosFiltrados = useMemo(() => {
    return efetivos.filter((e) => {
      if (!formState.orgao) return true;
      const efetivoOrgaoId = (e as any).orgao && typeof (e as any).orgao === 'object'
        ? String((e as any).orgao.id)
        : String((e as any).orgao);
      return efetivoOrgaoId === String(formState.orgao);
    });
  }, [efetivos, formState.orgao]);

  // Efetivo selecionado atualmente
  const currentEfetivo = useMemo(() =>
    efetivos.find(e => String(e.id) === String(formState.efetivo_visitar)) || null,
    [efetivos, formState.efetivo_visitar]
  );

  // Órgão selecionado atualmente
  const currentOrgao = useMemo(() =>
    orgaos.find(o => String(o.id) === String(formState.orgao)) || null,
    [orgaos, formState.orgao]
  );

  // Opções para o Combobox de efetivos (com filtro por órgão)
  const efetivoOptions = useMemo(() => {
    const options = efetivosFiltrados.map((e) => ({ 
      value: String(e.id), // Garantir que seja string
      label: e.nome_completo,
      data: e
    }));
    console.log('🟠 efetivoOptions criadas:', options);
    debugSelectOptions(options, 'Efetivos Filtrados');
    return options;
  }, [efetivosFiltrados]);

  // Debug dos dados recebidos
  useEffect(() => {
    debugFormData(orgaos, 'Órgãos');
    debugFormData(efetivos, 'Efetivos');
    debugFormState(formState);
    console.log('🕐 VisitaDetails - Data/hora entrada recebida:', formState.data_hora_entrada);
  }, [orgaos, efetivos, formState]);

  // Debug específico para mudanças no efetivo_visitar
  useEffect(() => {
    console.log('🟡 VisitaDetails - Estado do efetivo_visitar mudou:', {
      efetivo_visitar: formState.efetivo_visitar,
      tipo: typeof formState.efetivo_visitar,
      currentEfetivo: currentEfetivo,
      selectedEfetivo: selectedEfetivo
    });
  }, [formState.efetivo_visitar, currentEfetivo, selectedEfetivo]);

  // Efeito para preencher automaticamente o órgão quando um efetivo é selecionado
  useEffect(() => {
    if (currentEfetivo && currentEfetivo.orgao) {
      // Só preenche o órgão se ainda não estiver preenchido ou se for diferente
      if (!formState.orgao || String(formState.orgao) !== String(currentEfetivo.orgao)) {
        onFieldChange('orgao', currentEfetivo.orgao);
      }
      setSelectedEfetivo(currentEfetivo);
    }
  }, [currentEfetivo, formState.orgao, onFieldChange]);

  // Efeito para garantir que usuários de recepção sempre tenham estado "agendada"
  useEffect(() => {
    if (user?.role === 'recepcao' && formState.estado !== 'agendada') {
      onFieldChange('estado', 'agendada');
    }
  }, [user?.role, formState.estado, onFieldChange]);

  // Efeito para definir automaticamente o órgão do usuário para recepção
  useEffect(() => {
    if (user?.role === 'recepcao' && user?.orgao && !formState.orgao) {
      onFieldChange('orgao', user.orgao.id);
    }
  }, [user?.role, user?.orgao, formState.orgao, onFieldChange]);

  const handleEfetivoChange = (value: string) => {
    console.log('🔵 VisitaDetails - Efetivo selecionado:', value, 'tipo:', typeof value);
    // Salva o ID do efetivo como string
    onFieldChange('efetivo_visitar', value);
    // Busca o efetivo selecionado
    const efetivoSelecionado = efetivos.find(e => String(e.id) === String(value));
    console.log('🔵 VisitaDetails - Efetivo encontrado:', efetivoSelecionado);
    setSelectedEfetivo(efetivoSelecionado || null);
    // Se o efetivo tiver um órgão associado, preenche automaticamente
    if (efetivoSelecionado && efetivoSelecionado.orgao) {
      console.log('🔵 VisitaDetails - Preenchendo órgão automaticamente:', efetivoSelecionado.orgao);
      onFieldChange('orgao', efetivoSelecionado.orgao);
    }
  };

  const handleOrgaoChange = (value: string) => {
    console.log('Órgão selecionado:', value);
    onFieldChange('orgao', value);
    // Limpar seleção de efetivo se não pertencer ao órgão escolhido
    if (currentEfetivo && String(currentEfetivo.orgao) !== String(value)) {
      console.log('Limpando seleção de efetivo - não pertence ao órgão');
      onFieldChange('efetivo_visitar', '');
      setSelectedEfetivo(null);
    }
  };

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <CardTitle className="flex items-center gap-3 text-gray-900">
          <Calendar className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold">Dados da Visita</h2>
            <p className="text-sm font-normal text-gray-600 mt-1">
              Informações principais sobre a visita
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Informações do Efetivo e Órgão */}
        {(selectedEfetivo || currentOrgao) && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Informações Selecionadas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {selectedEfetivo && (
                <div>
                  <span className="text-gray-600 font-medium">Efetivo:</span>
                  <p className="text-gray-800 font-semibold">{selectedEfetivo.nome_completo}</p>
                </div>
              )}
              {currentOrgao && (
                <div>
                  <span className="text-gray-600 font-medium">Órgão:</span>
                  <p className="text-gray-800 font-semibold">{currentOrgao.nome}</p>
                  {currentOrgao.sigla && (
                    <p className="text-gray-600 text-xs">{currentOrgao.sigla}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Órgão (primeiro) */}
          <div className="space-y-2">
            <Label htmlFor="orgao" className="text-sm font-medium flex items-center gap-2">
              {user?.role === 'recepcao' ? (
                <Lock className="w-4 h-4 text-gray-500" />
              ) : (
                <Building className="w-4 h-4 text-green-600" />
              )}
              Órgão *
              {user?.role === 'recepcao' && (
                <span className="text-xs text-gray-500 ml-1">(Seu órgão)</span>
              )}
            </Label>
            <Select 
              value={String(formState.orgao || '')} 
              onValueChange={handleOrgaoChange} 
              required
              disabled={user?.role === 'recepcao'}
            >
              <SelectTrigger 
                id="orgao" 
                className={`w-full ${user?.role === 'recepcao' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <SelectValue placeholder="Selecione o órgão" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {user?.role === 'recepcao' ? (
                  // Para recepção, mostrar apenas o órgão do usuário
                  user?.orgao && (
                    <SelectItem key={user.orgao.id} value={String(user.orgao.id)}>
                      <div className="flex flex-col">
                        <span>{user.orgao.nome}</span>
                      </div>
                    </SelectItem>
                  )
                ) : (
                  // Para outros usuários, mostrar todos os órgãos
                  orgaos.map(o => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      <div className="flex flex-col">
                        <span>{o.nome}</span>
                        {o.sigla && (
                          <span className="text-xs text-gray-500">{o.sigla}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {user?.role === 'recepcao' ? (
              <p className="text-xs text-gray-500 mt-1">
                Usuários de recepção só podem agendar visitas para o seu órgão
              </p>
            ) : !formState.orgao ? (
              <p className="text-xs text-gray-500 mt-1">
                Primeiro selecione o órgão para filtrar os efetivos
              </p>
            ) : null}
          </div>

          {/* Efetivo a Visitar (depois do órgão) */}
          <div className="space-y-2">
            <Label htmlFor="efetivo_visitar" className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Efetivo a Visitar
            </Label>
            <Combobox
              options={efetivoOptions}
              value={String(formState.efetivo_visitar || '')}
              onChange={handleEfetivoChange}
              placeholder={formState.orgao ? "Selecione o efetivo..." : "Selecione primeiro o órgão"}
              searchPlaceholder="Pesquisar por nome..."
              emptyText={formState.orgao ? "Nenhum efetivo encontrado para este órgão." : "Selecione um órgão para listar efetivos."}
            />
            {!formState.efetivo_visitar && (
              <p className="text-xs text-gray-500 mt-1">
                Listando apenas efetivos do órgão selecionado
              </p>
            )}
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label htmlFor="estado" className="text-sm font-medium flex items-center gap-2">
              {user?.role === 'recepcao' ? (
                <Lock className="w-4 h-4 text-gray-500" />
              ) : (
                <FileText className="w-4 h-4 text-purple-600" />
              )}
              Estado *
              {user?.role === 'recepcao' && (
                <span className="text-xs text-gray-500 ml-1">(Apenas Agendada)</span>
              )}
            </Label>
            <Select 
              value={formState.estado} 
              onValueChange={(value) => onFieldChange('estado', value)} 
              required
              disabled={user?.role === 'recepcao'}
            >
              <SelectTrigger 
                id="estado" 
                className={`w-full ${user?.role === 'recepcao' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {estados.map(e => (
                  <SelectItem key={e.value} value={e.value} className={e.color}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {user?.role === 'recepcao' && (
              <p className="text-xs text-gray-500 mt-1">
                Usuários de recepção só podem criar visitas agendadas
              </p>
            )}
          </div>

          {/* Data/Hora Entrada */}
          <div className="space-y-2">
            <Label htmlFor="data_hora_entrada" className="text-sm font-medium">
              Data/Hora Entrada
            </Label>
            <Input
              id="data_hora_entrada"
              type="datetime-local"
              value={formState.data_hora_entrada}
              onChange={e => onFieldChange('data_hora_entrada', e.target.value)}
              className="w-full"
            />
            {!formState.data_hora_entrada && (
              <p className="text-xs text-gray-500 mt-1">
                Data e hora previstas para a entrada
              </p>
            )}
          </div>

          {/* Motivo da Visita */}
          <div className="md:col-span-2 lg:col-span-3 space-y-2">
            <Label htmlFor="motivo" className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-600" />
              Motivo da Visita
            </Label>
            <Input
              id="motivo"
              placeholder="Descreva detalhadamente o motivo da visita..."
              value={formState.motivo}
              onChange={e => onFieldChange('motivo', e.target.value)}
              className="w-full"
            />
            {!formState.motivo && (
              <p className="text-xs text-gray-500 mt-1">
                Ex: Reunião de trabalho, Entrega de documentos, Visita familiar, etc. (Campo opcional)
              </p>
            )}
          </div>

          {/* Interveniente de processo */}
          <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Visita de interveniente de processo?</Label>
              <Select
                value={String(formState.is_interveniente_processo ? 'sim' : 'nao')}
                onValueChange={(v) => onFieldChange('is_interveniente_processo', v === 'sim')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao">Não</SelectItem>
                  <SelectItem value="sim">Sim</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formState.is_interveniente_processo && (
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="numero_processo" className="text-sm font-medium">Número do Processo</Label>
                <Input
                  id="numero_processo"
                  placeholder="Ex: 1234/2025 - Secção ..."
                  value={formState.numero_processo || ''}
                  onChange={(e) => onFieldChange('numero_processo', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="md:col-span-2 lg:col-span-3 space-y-2">
            <Label htmlFor="observacoes" className="text-sm font-medium">
              Observações
            </Label>
            <textarea
              id="observacoes"
              placeholder="Informações adicionais relevantes para a visita..."
              value={formState.observacoes}
              onChange={e => onFieldChange('observacoes', e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 py-2 text-sm transition-colors resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Campo opcional para informações complementares
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {formState.efetivo_visitar && formState.orgao ? (
              <span className="text-green-600 font-medium">✓ Todos os campos obrigatórios preenchidos</span>
            ) : (
              <span className="text-orange-600">Preencha todos os campos obrigatórios (*)</span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {formState.estado && (
              <span className={`font-medium ${
                formState.estado === 'agendada' ? 'text-blue-600' :
                formState.estado === 'em_curso' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {estados.find(e => e.value === formState.estado)?.label}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}