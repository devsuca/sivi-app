"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getOrgaos, createOrgao, deleteOrgao, updateOrgao } from "@/services/orgaoService";
import { getEfetivosByOrgao } from "@/services/efetivoService";
import { Orgao } from "@/types/orgao";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "./columns";
import { PlusCircle, Building2, Users, MapPin, Phone, Search, Filter, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

// Componente de edição de órgão
function EditOrgaoForm({ orgao, onClose, onUpdated }: { orgao: Orgao; onClose: () => void; onUpdated: () => void }) {
  const { register, handleSubmit, formState: { isSubmitting }, setValue, watch } = useForm<Partial<Orgao>>({ 
    defaultValues: orgao 
  });
  const [efetivos, setEfetivos] = useState<Array<{ id: string; nome_completo: string }>>([]);

  useEffect(() => {
    if (orgao?.id) {
      getEfetivosByOrgao(orgao.id).then((list) => {
        setEfetivos(list.map(e => ({ id: e.id, nome_completo: e.nome_completo })));
      });
    }
  }, [orgao?.id]);

  const onSubmit = async (data: Partial<Orgao>) => {
    try {
      await updateOrgao(orgao.id, data);
      toast.success('Órgão atualizado com sucesso!');
      onUpdated();
    } catch {
      toast.error('Erro ao atualizar órgão');
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do Órgão *</Label>
          <Input 
            id="nome"
            placeholder="Ex: Direção Geral" 
            {...register("nome", { required: true })} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sigla">Sigla</Label>
          <Input 
            id="sigla"
            placeholder="Ex: DG" 
            {...register("sigla")} 
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bloco">Bloco</Label>
          <Input 
            id="bloco"
            placeholder="Ex: A, B, C" 
            {...register("bloco")} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="numero_porta">Número da Porta</Label>
          <Input 
            id="numero_porta"
            placeholder="Ex: 101, 205" 
            {...register("numero_porta")} 
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="telefone_interno">Telefone Interno</Label>
        <Input 
          id="telefone_interno"
          placeholder="Ex: 1234" 
          {...register("telefone_interno")} 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="responsavel_efetivo">Responsável</Label>
        <Select 
          onValueChange={(value) => setValue("responsavel_efetivo", value === "none" ? "" : value)}
          defaultValue="none"
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecionar responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">-- Sem responsável --</SelectItem>
            {efetivos.map(e => (
              <SelectItem key={e.id} value={e.id}>{e.nome_completo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {orgao.responsavel_nome && (
          <p className="text-xs text-muted-foreground">Atual: {orgao.responsavel_nome}</p>
        )}
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function OrgaosListPage() {
  const [orgaos, setOrgaos] = useState<Orgao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Estados para modais
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedOrgao, setSelectedOrgao] = useState<Orgao | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<Partial<Orgao>>();

  // Handlers para modais
  const handleOpenDetails = (orgao: Orgao) => {
    setSelectedOrgao(orgao);
    setOpenDetails(true);
  };

  const handleOpenEdit = (orgao: Orgao) => {
    setSelectedOrgao(orgao);
    setOpenEdit(true);
  };

  const handleOpenDelete = (orgao: Orgao) => {
    setSelectedOrgao(orgao);
    setOpenDelete(true);
  };

  const handleDelete = async () => {
    if (selectedOrgao) {
      try {
        await deleteOrgao(selectedOrgao.id);
        setOpenDelete(false);
        await refreshData();
        toast.success('Órgão excluído com sucesso!');
      } catch {
        toast.error('Erro ao excluir órgão');
      }
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const data = await getOrgaos();
      setOrgaos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Erro ao carregar órgãos:', error);
      toast.error('Erro ao carregar órgãos');
      setOrgaos([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: Partial<Orgao>) => {
    try {
      await createOrgao(data);
      setOpenCreate(false);
      reset();
      await refreshData();
      toast.success('Órgão criado com sucesso!');
    } catch (e) {
      toast.error('Erro ao criar órgão');
    }
  };

  // Filtros - com verificações de segurança
  const filteredOrgaos = Array.isArray(orgaos) ? orgaos.filter(orgao => {
    const matchesSearch = orgao.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         orgao.sigla?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         orgao.bloco?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && orgao.responsavel_nome) ||
                         (statusFilter === "inactive" && !orgao.responsavel_nome);
    
    return matchesSearch && matchesStatus;
  }) : [];

  // Estatísticas - com verificações de segurança
  const stats = {
    total: Array.isArray(orgaos) ? orgaos.length : 0,
    active: Array.isArray(orgaos) ? orgaos.filter(o => o.responsavel_nome).length : 0,
    inactive: Array.isArray(orgaos) ? orgaos.filter(o => !o.responsavel_nome).length : 0,
  };

  useEffect(() => {
    refreshData();
    
    // Event listeners para ações da tabela
    const handleDetails = (e: any) => handleOpenDetails(e.detail);
    const handleEdit = (e: any) => handleOpenEdit(e.detail);
    const handleDeleteEvent = (e: any) => handleOpenDelete(e.detail);
    
    window.addEventListener('orgao-details', handleDetails);
    window.addEventListener('orgao-edit', handleEdit);
    window.addEventListener('orgao-delete', handleDeleteEvent);
    
    return () => {
      window.removeEventListener('orgao-details', handleDetails);
      window.removeEventListener('orgao-edit', handleEdit);
      window.removeEventListener('orgao-delete', handleDeleteEvent);
    };
  }, []);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                  <Building2 className="h-8 w-8" />
                  Gestão de Órgãos
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Gerencie os órgãos e unidades organizacionais do sistema
                </p>
              </div>
              <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <PlusCircle className="h-5 w-5" />
                    Novo Órgão
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Órgão</DialogTitle>
                    <DialogDescription>
                      Preencha as informações do novo órgão
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="create-nome">Nome do Órgão *</Label>
                        <Input 
                          id="create-nome"
                          placeholder="Ex: Direção Geral" 
                          {...register("nome", { required: true })} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="create-sigla">Sigla</Label>
                        <Input 
                          id="create-sigla"
                          placeholder="Ex: DG" 
                          {...register("sigla")} 
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="create-bloco">Bloco</Label>
                        <Input 
                          id="create-bloco"
                          placeholder="Ex: A, B, C" 
                          {...register("bloco")} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="create-numero_porta">Número da Porta</Label>
                        <Input 
                          id="create-numero_porta"
                          placeholder="Ex: 101, 205" 
                          {...register("numero_porta")} 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="create-telefone_interno">Telefone Interno</Label>
                      <Input 
                        id="create-telefone_interno"
                        placeholder="Ex: 1234" 
                        {...register("telefone_interno")} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="create-responsavel_efetivo">Responsável</Label>
                      <Select 
                        onValueChange={(value) => setValue("responsavel_efetivo", value === "none" ? "" : value)}
                        defaultValue="none"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- Sem responsável --</SelectItem>
                          {/* Aqui você pode adicionar efetivos se necessário */}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Criando..." : "Criar Órgão"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Órgãos</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Órgãos Ativos</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sem Responsável</CardTitle>
                <Users className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.inactive}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Pesquisar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Nome, sigla, bloco..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="md:w-48">
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Sem Responsável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Órgãos</CardTitle>
              <CardDescription>
                {filteredOrgaos.length} de {Array.isArray(orgaos) ? orgaos.length : 0} órgãos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : !Array.isArray(filteredOrgaos) || filteredOrgaos.length === 0 ? (
                <div className="flex flex-col items-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum órgão encontrado</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm || statusFilter !== "all" 
                      ? "Tente ajustar os filtros de pesquisa" 
                      : "Comece criando seu primeiro órgão"
                    }
                  </p>
                  {!searchTerm && statusFilter === "all" && (
                    <Button onClick={() => setOpenCreate(true)}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Criar Primeiro Órgão
                    </Button>
                  )}
                </div>
              ) : (
                <DataTable columns={columns} data={filteredOrgaos} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal de Detalhes */}
        <Dialog open={openDetails} onOpenChange={setOpenDetails}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Detalhes do Órgão
              </DialogTitle>
            </DialogHeader>
            {selectedOrgao && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                    <p className="text-lg font-semibold">{selectedOrgao.nome}</p>
                  </div>
                  {selectedOrgao.sigla && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Sigla</Label>
                      <p className="text-lg font-semibold">{selectedOrgao.sigla}</p>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {selectedOrgao.bloco && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Bloco</Label>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {selectedOrgao.bloco}
                      </p>
                    </div>
                  )}
                  {selectedOrgao.numero_porta && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Porta</Label>
                      <p>{selectedOrgao.numero_porta}</p>
                    </div>
                  )}
                </div>
                
                {selectedOrgao.telefone_interno && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Telefone Interno</Label>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {selectedOrgao.telefone_interno}
                    </p>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Responsável</Label>
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {selectedOrgao.responsavel_nome || "Não atribuído"}
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDetails(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Edição */}
        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Editar Órgão</DialogTitle>
              <DialogDescription>
                Atualize as informações do órgão
              </DialogDescription>
            </DialogHeader>
            {selectedOrgao && (
              <EditOrgaoForm 
                orgao={selectedOrgao} 
                onClose={() => setOpenEdit(false)} 
                onUpdated={async () => {
                  setOpenEdit(false);
                  await refreshData();
                }} 
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Exclusão */}
        <Dialog open={openDelete} onOpenChange={setOpenDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Órgão</DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. Tem certeza que deseja excluir o órgão <strong>{selectedOrgao?.nome}</strong>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDelete(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}