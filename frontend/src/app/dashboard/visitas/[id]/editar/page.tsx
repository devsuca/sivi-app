"use client";
import { useEffect, useState, use } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getVisitaById, updateVisita } from '@/services/visitaService';
import { getVisitantes } from '@/services/pessoaService';
import { getEfetivos } from '@/services/efetivoService';
import { getOrgaos } from '@/services/orgaoService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Visita } from '@/types/visita';
import { useMemo } from "react";
import { 
  ArrowLeft, 
  Save, 
  User, 
  Building, 
  Calendar, 
  Clock, 
  FileText, 
  Users, 
  Car, 
  Plus, 
  Trash2,
  Edit3,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function EditarVisitaPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js v15+: params é uma Promise, precisa usar React.use
  const { id } = use(params);
  // Funções para editar acompanhantes
  const addAcompanhante = () => {
    setForm((f: any) => ({ ...f, acompanhantes: [...(f.acompanhantes || []), { nome: '', documento_tipo: '', documento_numero: '', nacionalidade: '' }] }));
  };
  const updateAcompanhante = (idx: number, field: string, value: string) => {
    setForm((f: any) => ({ ...f, acompanhantes: f.acompanhantes.map((a: any, i: number) => i === idx ? { ...a, [field]: value } : a) }));
  };
  const removeAcompanhante = (idx: number) => {
    setForm((f: any) => ({ ...f, acompanhantes: f.acompanhantes.filter((_: any, i: number) => i !== idx) }));
  };
  // Funções para editar viaturas
  const addViatura = () => {
    setForm((f: any) => ({ ...f, viaturas: [...(f.viaturas || []), { tipo: '', marca: '', cor: '', matricula: '' }] }));
  };
  const updateViatura = (idx: number, field: string, value: string) => {
    setForm((f: any) => ({ ...f, viaturas: f.viaturas.map((v: any, i: number) => i === idx ? { ...v, [field]: value } : v) }));
  };
  const removeViatura = (idx: number) => {
    setForm((f: any) => ({ ...f, viaturas: f.viaturas.filter((_: any, i: number) => i !== idx) }));
  };
  const [form, setForm] = useState<any>({});
  const [visitantes, setVisitantes] = useState<any[]>([]);
  const [efetivos, setEfetivos] = useState<any[]>([]);
  const [orgaos, setOrgaos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Efetivos filtrados pelo órgão selecionado (compatível com id ou objeto)
  const efetivosFiltrados = useMemo(() => {
    if (!form?.orgao) return efetivos;
    return efetivos.filter((e: any) => {
      const orgId = e?.orgao && typeof e.orgao === 'object' ? String(e.orgao.id) : String(e?.orgao);
      return orgId === String(form.orgao);
    });
  }, [efetivos, form?.orgao]);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔍 Carregando dados para edição da visita:', id);
        
        const [data, visitantesData, efetivosData, orgaosData] = await Promise.all([
          getVisitaById(id),
          getVisitantes(),
          getEfetivos(),
          getOrgaos()
        ]);
        
        console.log('✅ Dados carregados:', {
          visita: data,
          visitantes: visitantesData.length,
          efetivos: efetivosData.length,
          orgaos: orgaosData.length
        });
        
        setForm({
          ...data,
          visitante: typeof data.visitante === 'object' ? data.visitante.id : data.visitante || '',
          efetivo_visitar: typeof data.efetivo_visitar === 'object' ? data.efetivo_visitar.id : data.efetivo_visitar || '',
          orgao: typeof data.orgao === 'object' ? data.orgao.id : data.orgao || '',
        });
        setVisitantes(visitantesData);
        setEfetivos(efetivosData);
        setOrgaos(orgaosData);
        setLoading(false);
      } catch (error: any) {
        console.error('❌ Erro ao carregar dados:', error);
        
        let errorMessage = 'Erro ao carregar dados da visita.';
        if (error?.response?.status === 404) {
          errorMessage = 'Visita não encontrada. Verifique se o ID está correto.';
        } else if (error?.response?.status === 403) {
          errorMessage = 'Você não tem permissão para editar esta visita.';
        } else if (error?.response?.data) {
          errorMessage = error.response.data.detail || errorMessage;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
      }
    };
    
    loadData();
  }, [id]);

  // Garantir consistência: se trocar o órgão e o efetivo não pertencer, limpar seleção de efetivo
  useEffect(() => {
    if (!form?.orgao || !form?.efetivo_visitar) return;
    const efetivoSelecionado = efetivos.find((e: any) => String(e.id) === String(form.efetivo_visitar));
    if (efetivoSelecionado) {
      const efetivoOrgaoId = efetivoSelecionado?.orgao && typeof efetivoSelecionado.orgao === 'object'
        ? String(efetivoSelecionado.orgao.id)
        : String(efetivoSelecionado?.orgao);
      if (efetivoOrgaoId !== String(form.orgao)) {
        setForm((f: any) => ({ ...f, efetivo_visitar: '' }));
      }
    }
  }, [form?.orgao, form?.efetivo_visitar, efetivos]);

  const [formErrors, setFormErrors] = useState<string[]>([]);
  
  // Função de teste para verificar o salvamento
  const testSave = () => {
    console.log('🧪 Testando salvamento da visita...');
    console.log('📋 Estado atual do formulário:', form);
    console.log('🔍 Validações:');
    console.log('- Visitante:', form.visitante ? '✅' : '❌');
    console.log('- Efetivo:', form.efetivo_visitar ? '✅' : '❌');
    console.log('- Órgão:', form.orgao ? '✅' : '❌');
    console.log('- Motivo:', form.motivo ? '✅' : '❌');
    console.log('- Viaturas válidas:', form.viaturas?.every((v: any) => v.matricula?.trim()) ? '✅' : '❌');
  };
  
  // Expor função de teste globalmente em desenvolvimento
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).testSaveVisita = testSave;
  }
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: string[] = [];
    if (!form.visitante) errors.push('Selecione o visitante.');
    if (!form.efetivo_visitar) errors.push('Selecione o efetivo a visitar.');
    if (!form.orgao) errors.push('Selecione o órgão.');
    if (!form.motivo || form.motivo.trim() === '') errors.push('Preencha o motivo da visita.');
    if (form.viaturas && form.viaturas.some((v: any) => !v.matricula || v.matricula.trim() === '')) errors.push('Preencha a matrícula de todas as viaturas.');
    setFormErrors(errors);
    if (errors.length > 0) return;
    
    setLoading(true);
    try {
      console.log('💾 Salvando alterações da visita:', { id, form });
      
      // Preparar dados para envio
      const dataToSend = {
        ...form,
        // Garantir que IDs sejam strings
        visitante: String(form.visitante),
        efetivo_visitar: String(form.efetivo_visitar),
        orgao: String(form.orgao),
        // Limpar campos vazios
        observacoes: form.observacoes?.trim() || null,
        motivo: form.motivo?.trim(),
        // Garantir que arrays existam
        acompanhantes: form.acompanhantes || [],
        viaturas: form.viaturas || [],
      };
      
      console.log('📤 Dados preparados para envio:', dataToSend);
      
      const updatedVisita = await updateVisita(id, dataToSend);
      console.log('✅ Visita atualizada com sucesso:', updatedVisita);
      
      toast.success('Visita atualizada com sucesso!');
      setTimeout(() => {
        router.push(`/dashboard/visitas/${id}`);
      }, 1000);
    } catch (error: any) {
      console.error('❌ Erro ao atualizar visita:', error);
      
      let errorMessage = 'Erro ao atualizar visita. Tente novamente.';
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const fieldErrors = Object.entries(errorData)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join(' | ');
          errorMessage = `Erro de validação: ${fieldErrors}`;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Carregando dados da visita...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>
          
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="p-4 bg-red-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Erro ao Carregar Visita</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2"
                >
                  Tentar Novamente
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Edit3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editar Visita</h1>
              <p className="text-muted-foreground">Modifique os dados da visita</p>
            </div>
          </div>
        </div>

        {/* Erros */}
        {formErrors.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-red-800">Erros encontrados:</h3>
            </div>
            <ul className="list-disc list-inside text-red-700 space-y-1">
              {formErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Principais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informações Principais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="visitante" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Visitante *
                  </Label>
                  <Select value={form.visitante || ''} onValueChange={(value) => setForm((f: any) => ({ ...f, visitante: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o visitante" />
                    </SelectTrigger>
                    <SelectContent>
                      {visitantes.map((v: any) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.nome || v.designacao_social}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="efetivo" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Efetivo a Visitar *
                  </Label>
                  <Select value={form.efetivo_visitar || ''} onValueChange={(value) => setForm((f: any) => ({ ...f, efetivo_visitar: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o efetivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {efetivosFiltrados.map((e: any) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.nome_completo || e.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgao" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Órgão *
                  </Label>
                  <Select value={form.orgao || ''} onValueChange={(value) => setForm((f: any) => ({ ...f, orgao: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o órgão" />
                    </SelectTrigger>
                    <SelectContent>
                      {orgaos.map((o: any) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Estado
                  </Label>
                  <Select value={form.estado || ''} onValueChange={(value) => setForm((f: any) => ({ ...f, estado: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agendada">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Agendada
                        </div>
                      </SelectItem>
                      <SelectItem value="em_curso">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          Em Curso
                        </div>
                      </SelectItem>
                      <SelectItem value="concluida">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Concluída
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Motivo da Visita
                </Label>
                <Input
                  id="motivo"
                  placeholder="Descreva o motivo da visita (opcional)"
                  value={form.motivo || ''}
                  onChange={e => setForm((f: any) => ({ ...f, motivo: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Observações
                </Label>
                <Textarea
                  id="observacoes"
                  placeholder="Observações adicionais sobre a visita"
                  value={form.observacoes || ''}
                  onChange={e => setForm((f: any) => ({ ...f, observacoes: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Datas e Horários */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Datas e Horários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="entrada" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Data/Hora de Entrada
                  </Label>
                  <Input
                    id="entrada"
                    type="datetime-local"
                    value={form.data_hora_entrada || ''}
                    onChange={e => setForm((f: any) => ({ ...f, data_hora_entrada: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="saida" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Data/Hora de Saída
                  </Label>
                  <Input
                    id="saida"
                    type="datetime-local"
                    value={form.data_hora_saida || ''}
                    onChange={e => setForm((f: any) => ({ ...f, data_hora_saida: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Acompanhantes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Acompanhantes
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addAcompanhante} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {form.acompanhantes && form.acompanhantes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum acompanhante adicionado</p>
                  <p className="text-sm">Clique em "Adicionar" para incluir acompanhantes</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {form.acompanhantes && form.acompanhantes.map((a: any, idx: number) => (
                    <Card key={idx} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">Acompanhante {idx + 1}</h4>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeAcompanhante(idx)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`acompanhante-nome-${idx}`}>Nome Completo</Label>
                          <Input
                            id={`acompanhante-nome-${idx}`}
                            placeholder="Nome completo do acompanhante"
                            value={a.nome}
                            onChange={e => updateAcompanhante(idx, 'nome', e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`acompanhante-doc-tipo-${idx}`}>Tipo de Documento</Label>
                            <Select value={a.documento_tipo} onValueChange={(value) => updateAcompanhante(idx, 'documento_tipo', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BI">BI</SelectItem>
                                <SelectItem value="PASSAPORTE">Passaporte</SelectItem>
                                <SelectItem value="CARTA">Carta</SelectItem>
                                <SelectItem value="OUTRO">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`acompanhante-doc-num-${idx}`}>Nº do Documento</Label>
                            <Input
                              id={`acompanhante-doc-num-${idx}`}
                              placeholder="Número do documento"
                              value={a.documento_numero}
                              onChange={e => updateAcompanhante(idx, 'documento_numero', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`acompanhante-nacionalidade-${idx}`}>Nacionalidade</Label>
                          <Select value={a.nacionalidade || 'Angola'} onValueChange={(value) => updateAcompanhante(idx, 'nacionalidade', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a nacionalidade" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Angola">Angola</SelectItem>
                              <SelectItem value="Brasil">Brasil</SelectItem>
                              <SelectItem value="Portugal">Portugal</SelectItem>
                              <SelectItem value="Moçambique">Moçambique</SelectItem>
                              <SelectItem value="Cabo Verde">Cabo Verde</SelectItem>
                              <SelectItem value="Guiné-Bissau">Guiné-Bissau</SelectItem>
                              <SelectItem value="São Tomé e Príncipe">São Tomé e Príncipe</SelectItem>
                              <SelectItem value="Timor-Leste">Timor-Leste</SelectItem>
                              <SelectItem value="Estados Unidos">Estados Unidos</SelectItem>
                              <SelectItem value="França">França</SelectItem>
                              <SelectItem value="China">China</SelectItem>
                              <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {/* Viaturas */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary" />
                  Viaturas
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addViatura} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {form.viaturas && form.viaturas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma viatura adicionada</p>
                  <p className="text-sm">Clique em "Adicionar" para incluir viaturas</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {form.viaturas && form.viaturas.map((v: any, idx: number) => (
                    <Card key={idx} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">Viatura {idx + 1}</h4>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeViatura(idx)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`viatura-tipo-${idx}`}>Tipo</Label>
                            <Input
                              id={`viatura-tipo-${idx}`}
                              placeholder="Ex: Carro, Moto, etc."
                              value={v.tipo}
                              onChange={e => updateViatura(idx, 'tipo', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`viatura-marca-${idx}`}>Marca</Label>
                            <Input
                              id={`viatura-marca-${idx}`}
                              placeholder="Ex: Toyota, Honda, etc."
                              value={v.marca}
                              onChange={e => updateViatura(idx, 'marca', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`viatura-cor-${idx}`}>Cor</Label>
                            <Input
                              id={`viatura-cor-${idx}`}
                              placeholder="Ex: Branco, Preto, etc."
                              value={v.cor}
                              onChange={e => updateViatura(idx, 'cor', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`viatura-matricula-${idx}`}>Matrícula *</Label>
                            <Input
                              id={`viatura-matricula-${idx}`}
                              placeholder="Ex: LU-00-00-00"
                              value={v.matricula}
                              onChange={e => updateViatura(idx, 'matricula', e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-between items-center pt-6 border-t">
            {/* Botão de teste em desenvolvimento */}
            {process.env.NODE_ENV === 'development' && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={testSave}
                className="flex items-center gap-2 text-xs"
              >
                🧪 Testar Salvamento
              </Button>
            )}
            
            <div className="flex gap-3 ml-auto">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()} 
                disabled={loading}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
