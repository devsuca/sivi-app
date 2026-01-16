
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { createPertence } from '@/services/pertenceService';
import { getVisitas } from '@/services/visitaService';
import { getEfetivos } from '@/services/efetivoService';
import { Visita } from '@/types/visita';
import { Efetivo } from '@/types/efetivo';
import { Pertence } from '@/types/pertence';
import { Package, ArrowLeft, Save, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function NovoPertencePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Verificar permissões
  const canManagePertences = user?.role && ['admin', 'portaria', 'secretaria'].includes(user.role);
  
  // Estado do formulário
  const [form, setForm] = useState({
    descricao: '',
    tipo: '',
    quantidade: 1,
    visita: 'none',
    efetivo: 'none',
  });

  // Dados carregados
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [efetivos, setEfetivos] = useState<Efetivo[]>([]);

  const displayToast = useCallback((message: string) => {
    setShowToast(message);
    setTimeout(() => setShowToast(null), 3500);
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        setDataLoading(true);
        setDataError(null);
        
        const [visitasData, efetivosData] = await Promise.all([
          getVisitas(),
          getEfetivos()
        ]);
        
        setVisitas(visitasData);
        setEfetivos(efetivosData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setDataError('Erro ao carregar dados. Tente novamente.');
        displayToast('Erro ao carregar dados');
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [displayToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!form.descricao.trim()) {
      displayToast('Descrição é obrigatória');
      return;
    }
    
    if ((!form.visita || form.visita === 'none') && (!form.efetivo || form.efetivo === 'none')) {
      displayToast('Deve associar o pertence a uma visita ou efetivo');
      return;
    }

    setLoading(true);
    try {
      const pertenceData: Partial<Pertence> = {
        descricao: form.descricao.trim(),
        tipo: form.tipo.trim() || undefined,
        quantidade: form.quantidade,
        estado: 'em_posse',
        data_entrega: new Date().toISOString(),
        ...(form.visita && form.visita !== 'none' ? { visita: form.visita } : {}),
        ...(form.efetivo && form.efetivo !== 'none' ? { efetivo: form.efetivo } : {}),
      };

      await createPertence(pertenceData);
      displayToast('Pertence registado com sucesso!');
      
      // Redirecionar após um breve delay
      setTimeout(() => {
        router.push('/dashboard/pertences');
      }, 1500);
    } catch (error) {
      console.error("Erro ao criar pertence:", error);
      displayToast('Erro ao registar pertence');
    } finally {
      setLoading(false);
    }
  };

  // Verificar permissões primeiro
  if (!canManagePertences) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <Lock className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
                <p className="text-muted-foreground mb-4">
                  Você não tem permissão para gerenciar pertences. 
                  Apenas Administradores, Portaria e Secretaria podem acessar esta funcionalidade.
                </p>
                <Button onClick={() => router.back()}>
                  Voltar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Loading state
  if (dataLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">A carregar dados...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (dataError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Erro ao carregar dados</h3>
                <p className="text-muted-foreground mb-4">{dataError}</p>
                <Button onClick={() => window.location.reload()}>
                  Tentar novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Registar Novo Pertence</h1>
            <p className="text-muted-foreground mt-1">
              Registe um novo pertence no sistema
            </p>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium">{showToast}</span>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Informações do Pertence
            </CardTitle>
            <CardDescription>
              Preencha os dados do pertence que será registado no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="descricao" className="text-sm font-medium">
                  Descrição <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="descricao"
                  value={form.descricao}
                  onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Ex: Telemóvel, Chaves, Documentos..."
                  className="w-full"
                  required
                />
              </div>

              {/* Tipo e Quantidade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tipo" className="text-sm font-medium">
                    Tipo (Opcional)
                  </Label>
                  <Input
                    id="tipo"
                    value={form.tipo}
                    onChange={(e) => setForm(f => ({ ...f, tipo: e.target.value }))}
                    placeholder="Ex: Eletrónico, Documento, Pessoal..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantidade" className="text-sm font-medium">
                    Quantidade <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="quantidade"
                    type="number"
                    min="1"
                    value={form.quantidade}
                    onChange={(e) => setForm(f => ({ ...f, quantidade: parseInt(e.target.value) || 1 }))}
                    className="w-full"
                    required
                  />
                </div>
              </div>

              {/* Associação */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Associar a Visita
                  </Label>
                  <Select
                    value={form.visita}
                    onValueChange={(value) => setForm(f => ({ ...f, visita: value, efetivo: 'none' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma visita (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma visita</SelectItem>
                      {visitas.map((visita) => (
                        <SelectItem key={visita.id} value={visita.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              #{visita.numero}
                            </Badge>
                            <span>Visita #{visita.numero}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Associar a Efetivo
                  </Label>
                  <Select
                    value={form.efetivo}
                    onValueChange={(value) => setForm(f => ({ ...f, efetivo: value, visita: 'none' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um efetivo (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum efetivo</SelectItem>
                      {efetivos.map((efetivo) => (
                        <SelectItem key={efetivo.id} value={efetivo.id}>
                          {efetivo.nome_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Informação sobre associação */}
              {(!form.visita || form.visita === 'none') && (!form.efetivo || form.efetivo === 'none') && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Associação obrigatória
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Deve associar o pertence a uma visita ou efetivo para poder registá-lo.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || ((!form.visita || form.visita === 'none') && (!form.efetivo || form.efetivo === 'none'))}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      A registar...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Registar Pertence
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
