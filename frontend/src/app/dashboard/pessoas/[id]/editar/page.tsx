'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getVisitanteById, updateVisitante, createVisitante } from '@/services/pessoaService';
import { Visitante } from '@/types/pessoa';
import { ArrowLeft, Save, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/SearchableSelect';
import { searchRepresentante } from '@/services/searchEntidadeService';

interface PageProps { 
  params: Promise<{ id: string }> 
}

export default function EditarPessoaPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [pessoa, setPessoa] = useState<Visitante | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Visitante>>({});

  // Representative Logic
  const [repSearchQuery, setRepSearchQuery] = useState('');
  const [repSearchResults, setRepSearchResults] = useState<any[]>([]);
  const [showRepResults, setShowRepResults] = useState(false);
  const [isSearchingRep, setIsSearchingRep] = useState(false);
  const [customRepMode, setCustomRepMode] = useState(false);
  const [newRepData, setNewRepData] = useState({
    id: '',
    nome: '',
    cargo: '',
    email: '',
    telefone: '',
    documento_numero: '',
    documento_tipo: 'BI'
  });

  // Debounce representative search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (repSearchQuery && repSearchQuery.length >= 2) {
        setIsSearchingRep(true);
        try {
            const results = await searchRepresentante(repSearchQuery);
            setRepSearchResults(results);
            setShowRepResults(true);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearchingRep(false);
        }
      } else {
        setRepSearchResults([]);
        setShowRepResults(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [repSearchQuery]);

  useEffect(() => {
    if (!id) return;
    
    const fetchPessoa = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getVisitanteById(id);
        setPessoa(data);
        setFormData(data);

        // Populate Representative Data if present
        if (data.representante_details) {
            setCustomRepMode(true);
            setNewRepData({
                id: data.representante_details.id || '',
                nome: data.representante_details.nome || '',
                cargo: data.representante_details.cargo || '',
                email: data.representante_details.email || '',
                telefone: data.representante_details.telefone || '',
                documento_numero: data.representante_details.documento_numero || '',
                documento_tipo: data.representante_details.documento_tipo || 'BI'
            });
        }
      } catch (err: any) {
        console.error('Erro ao carregar pessoa:', err);
        setError('Erro ao carregar dados da pessoa. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchPessoa();
  }, [id]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    try {
      setSaving(true);
      setError(null);

      // Handle Representative Update/Creation before updating main entity
      let representanteId = formData.representante;

      if (formData.tipo_pessoa === 'coletiva' && customRepMode && newRepData.nome) {
          try {
              const repPayload = {
                  tipo_pessoa: 'singular',
                  nome: newRepData.nome,
                  documento_tipo: newRepData.documento_tipo,
                  documento_numero: newRepData.documento_numero,
                  email: newRepData.email,
                  telefone: newRepData.telefone,
                  cargo: newRepData.cargo, // If supported directly
                  observacoes: newRepData.cargo ? `Cargo: ${newRepData.cargo}` : undefined, // Fallback
                  ativo: true,
              };

              if (newRepData.id) {
                  // Update existing
                  await updateVisitante(newRepData.id, repPayload as any);
                  representanteId = newRepData.id;
                  toast.success('Dados do representante atualizados.');
              } else {
                  // Create new
                  const newRep = await createVisitante({ ...repPayload, registado_por: 1 } as any); // TODO: pass correct user ID or let backend handle
                  if (newRep && newRep.id) {
                      representanteId = newRep.id;
                      toast.success('Novo representante criado.');
                  }
              }
          } catch (repError) {
              console.error('Erro ao salvar representante:', repError);
              toast.error('Erro ao salvar dados do representante.');
              // Decide if we should stop or continue. For now, we continue but warn.
              setSaving(false);
              return;
          }
      }

      await updateVisitante(id, { ...formData, representante: representanteId });
      
      toast.success('Pessoa atualizada com sucesso!');
      router.push(`/dashboard/pessoas/${id}`);
    } catch (err: any) {
      console.error('Erro ao atualizar pessoa:', err);
      setError('Erro ao atualizar pessoa. Tente novamente.');
      toast.error('Erro ao atualizar pessoa.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <span className="text-lg text-muted-foreground">Carregando dados da pessoa...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!pessoa) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Pessoa não encontrada</h2>
          <p className="text-muted-foreground mb-4">A pessoa que você está procurando não existe ou foi removida.</p>
          <Link href="/dashboard/pessoas">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Pessoas
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/pessoas/${id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Editar Pessoa
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Atualize as informações da pessoa
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo_pessoa">Tipo de Pessoa</Label>
                  <Select
                    value={formData.tipo_pessoa || ''}
                    onValueChange={(value) => handleInputChange('tipo_pessoa', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="singular">Pessoa Singular</SelectItem>
                      <SelectItem value="coletiva">Pessoa Coletiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.tipo_pessoa === 'singular' ? (
                  <>
                    <div>
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input
                        id="nome"
                        value={formData.nome || ''}
                        onChange={(e) => handleInputChange('nome', e.target.value)}
                        placeholder="Digite o nome completo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="genero">Gênero</Label>
                      <Select
                        value={formData.genero || ''}
                        onValueChange={(value) => handleInputChange('genero', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o gênero" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Feminino</SelectItem>
                          <SelectItem value="O">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                      <Input
                        id="data_nascimento"
                        type="date"
                        value={formData.data_nascimento || ''}
                        onChange={(e) => handleInputChange('data_nascimento', e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="designacao_social">Designação Social</Label>
                      <Input
                        id="designacao_social"
                        value={formData.designacao_social || ''}
                        onChange={(e) => handleInputChange('designacao_social', e.target.value)}
                        placeholder="Digite a designação social"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nif">NIF</Label>
                      <Input
                        id="nif"
                        value={formData.nif || ''}
                        onChange={(e) => handleInputChange('nif', e.target.value)}
                        placeholder="Digite o NIF"
                      />
                    </div>
                      <div className="md:col-span-2 space-y-4 pt-4 border-t">
                        <Label>Representante Legal</Label>
                        
                        {!customRepMode ? (
                          <div className="relative">
                            <Label htmlFor="searchRepresentante" className="text-xs text-muted-foreground mb-1 block">
                              Pesquisar Representante Existente
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    id="searchRepresentante"
                                    placeholder="Digite o nome do representante..."
                                    value={repSearchQuery}
                                    onChange={(e) => setRepSearchQuery(e.target.value)}
                                />
                                <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={() => setCustomRepMode(true)}
                                >
                                    Novo
                                </Button>
                            </div>

                            {/* Representative Search Results */}
                            {showRepResults && repSearchResults.length > 0 && (
                                <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                                    {repSearchResults.map((result) => (
                                        <div
                                            key={result.id}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                            onClick={() => {
                                                setNewRepData({
                                                    id: result.id,
                                                    nome: result.nome,
                                                    cargo: result.cargo || '',
                                                    email: result.email || '',
                                                    telefone: result.telefone || '',
                                                    documento_numero: result.documento_numero || '',
                                                    documento_tipo: result.documento_tipo || 'BI'
                                                });
                                                setCustomRepMode(true);
                                                setShowRepResults(false);
                                                setRepSearchQuery('');
                                            }}
                                        >
                                            <div className="font-medium">{result.nome}</div>
                                            <div className="text-xs text-gray-500">
                                                {result.documento_numero ? `${result.documento_tipo}: ${result.documento_numero}` : 'Sem documento'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-muted/30 p-4 rounded-md space-y-4 border">
                              <div className="flex justify-between items-center">
                                  <h4 className="font-medium text-sm flex items-center gap-2">
                                      <User className="h-4 w-4" />
                                      {newRepData.id ? 'Dados do Representante (Vinculado)' : 'Novo Representante'}
                                  </h4>
                                  <Button 
                                      type="button" 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 text-xs text-red-500 hover:text-red-600"
                                      onClick={() => {
                                          setCustomRepMode(false);
                                          setNewRepData({
                                              id: '',
                                              nome: '',
                                              cargo: '',
                                              email: '',
                                              telefone: '',
                                              documento_numero: '',
                                              documento_tipo: 'BI'
                                          });
                                          handleInputChange('representante', null);
                                      }}
                                  >
                                      Remover/Alterar
                                  </Button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                      <Label htmlFor="repNome" className="text-xs">Nome Completo *</Label>
                                      <Input 
                                          id="repNome"
                                          value={newRepData.nome}
                                          onChange={(e) => setNewRepData({...newRepData, nome: e.target.value.toUpperCase()})}
                                          placeholder="Nome do representante"
                                          disabled={!!newRepData.id} // Disable if loaded from existing
                                      />
                                  </div>
                                  <div>
                                      <Label htmlFor="repCargo" className="text-xs">Cargo/Função</Label>
                                      <Input 
                                          id="repCargo"
                                          value={newRepData.cargo}
                                          onChange={(e) => setNewRepData({...newRepData, cargo: e.target.value})}
                                          placeholder="Ex: Gerente, Diretor..."
                                      />
                                  </div>
                                  <div>
                                      <Label htmlFor="repDocTipo" className="text-xs">Tipo Documento</Label>
                                      <Select
                                          value={newRepData.documento_tipo}
                                          onValueChange={(value) => setNewRepData({...newRepData, documento_tipo: value})}
                                          disabled={!!newRepData.id}
                                      >
                                          <SelectTrigger id="repDocTipo" className="h-9">
                                              <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                              <SelectItem value="BI">Bilhete</SelectItem>
                                              <SelectItem value="PASSAPORTE">Passaporte</SelectItem>
                                              <SelectItem value="CARTA">Carta</SelectItem>
                                              <SelectItem value="CARTAO_RESIDENTE">Residente</SelectItem>
                                              <SelectItem value="OUTRO">Outro</SelectItem>
                                          </SelectContent>
                                      </Select>
                                  </div>
                                  <div>
                                      <Label htmlFor="repDocNum" className="text-xs">Nº Documento</Label>
                                      <Input 
                                          id="repDocNum"
                                          value={newRepData.documento_numero}
                                          onChange={(e) => setNewRepData({...newRepData, documento_numero: e.target.value.toUpperCase()})}
                                          placeholder="Número do documento"
                                          disabled={!!newRepData.id}
                                      />
                                  </div>
                                  <div>
                                      <Label htmlFor="repEmail" className="text-xs">Email</Label>
                                      <Input 
                                          id="repEmail"
                                          value={newRepData.email}
                                          onChange={(e) => setNewRepData({...newRepData, email: e.target.value})}
                                          placeholder="email@exemplo.com"
                                      />
                                  </div>
                                  <div>
                                      <Label htmlFor="repTelefone" className="text-xs">Telefone</Label>
                                      <Input 
                                          id="repTelefone"
                                          value={newRepData.telefone}
                                          onChange={(e) => setNewRepData({...newRepData, telefone: e.target.value})}
                                          placeholder="+244..."
                                      />
                                  </div>
                              </div>
                          </div>
                        )}
                      </div>
                  </>
                )}

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Digite o email"
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone || ''}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    placeholder="Digite o telefone"
                  />
                </div>
                <div>
                  <Label htmlFor="nacionalidade">Nacionalidade</Label>
                  <Input
                    id="nacionalidade"
                    value={formData.nacionalidade || ''}
                    onChange={(e) => handleInputChange('nacionalidade', e.target.value)}
                    placeholder="Digite a nacionalidade"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="documento_tipo">Tipo de Documento</Label>
                  <Select
                    value={formData.documento_tipo || ''}
                    onValueChange={(value) => handleInputChange('documento_tipo', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BI">Bilhete de Identidade</SelectItem>
                      <SelectItem value="PASSAPORTE">Passaporte</SelectItem>
                      <SelectItem value="CARTA">Carta de Condução</SelectItem>
                      <SelectItem value="OUTRO">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="documento_numero">Número do Documento</Label>
                  <Input
                    id="documento_numero"
                    value={formData.documento_numero || ''}
                    onChange={(e) => handleInputChange('documento_numero', e.target.value)}
                    placeholder="Digite o número do documento"
                  />
                </div>
                <div>
                  <Label htmlFor="documento_emissao">Data de Emissão</Label>
                  <Input
                    id="documento_emissao"
                    type="date"
                    value={formData.documento_emissao || ''}
                    onChange={(e) => handleInputChange('documento_emissao', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="documento_validade">Data de Validade</Label>
                  <Input
                    id="documento_validade"
                    type="date"
                    value={formData.documento_validade || ''}
                    onChange={(e) => handleInputChange('documento_validade', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="provincia_nascimento">Província de Nascimento</Label>
                  <Input
                    id="provincia_nascimento"
                    value={formData.provincia_nascimento || ''}
                    onChange={(e) => handleInputChange('provincia_nascimento', e.target.value)}
                    placeholder="Digite a província de nascimento"
                  />
                </div>
                <div>
                  <Label htmlFor="estado_civil">Estado Civil</Label>
                  <Input
                    id="estado_civil"
                    value={formData.estado_civil || ''}
                    onChange={(e) => handleInputChange('estado_civil', e.target.value)}
                    placeholder="Digite o estado civil"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco || ''}
                    onChange={(e) => handleInputChange('endereco', e.target.value)}
                    placeholder="Digite o endereço completo"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Link href={`/dashboard/pessoas/${id}`}>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
