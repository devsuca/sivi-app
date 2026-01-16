"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from "@/services/usuarioService";
import { getOrgaos } from "@/services/orgaoService";
import { getPerfis } from "@/services/perfilService";
import { Usuario, PerfilUsuario, UsuarioFormData } from "@/types/usuario";
import { Orgao } from "@/types/orgao";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  PlusCircle, 
  Users, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  UserCheck, 
  UserX,
  Mail,
  Calendar,
  Building2
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

// Componente de edição de usuário
function EditUsuarioForm({ usuario, onClose, onUpdated }: { usuario: Usuario; onClose: () => void; onUpdated: () => void }) {
  const { register, handleSubmit, formState: { isSubmitting }, setValue, watch } = useForm<UsuarioFormData>({ 
    defaultValues: {
      nome: usuario.nome,
      email: usuario.email,
      username: usuario.username,
      perfil: usuario.perfil,
      orgao: usuario.orgao,
      ativo: usuario.ativo
    }
  });
  const [orgaos, setOrgaos] = useState<Orgao[]>([]);
  const [perfis, setPerfis] = useState<PerfilUsuario[]>([]);

  useEffect(() => {
    getOrgaos().then(data => {
      setOrgaos(Array.isArray(data) ? data : []);
    }).catch(error => {
      console.error('❌ Erro ao carregar órgãos:', error);
      setOrgaos([]);
    });
    
    getPerfis().then(data => {
      console.log('📋 Perfis carregados no EditForm:', data);
      setPerfis(Array.isArray(data) ? data : []);
    }).catch(error => {
      console.error('❌ Erro ao carregar perfis:', error);
      setPerfis([]);
    });
  }, []);

  const onSubmit = async (data: UsuarioFormData) => {
    try {
      await updateUsuario(usuario.id, data);
      toast.success('Usuário atualizado com sucesso!');
      onUpdated();
    } catch (error) {
      toast.error('Erro ao atualizar usuário');
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-nome">Nome *</Label>
          <Input 
            id="edit-nome"
            placeholder="Nome completo" 
            {...register("nome", { required: true })} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-email">Email *</Label>
          <Input 
            id="edit-email"
            type="email"
            placeholder="email@exemplo.com" 
            {...register("email", { required: true })} 
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-username">Username *</Label>
          <Input 
            id="edit-username"
            placeholder="Nome de usuário" 
            {...register("username", { required: true })} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-perfil">Perfil *</Label>
          <Select 
            onValueChange={(value) => setValue("perfil", Number(value))}
            defaultValue={String(usuario.perfil)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar perfil" />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(perfis) && perfis.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="edit-orgao">Órgão</Label>
        <Select 
          onValueChange={(value) => setValue("orgao", value === "none" ? "" : value)}
          defaultValue={usuario.orgao || "none"}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecionar órgão" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">-- Sem órgão --</SelectItem>
            {Array.isArray(orgaos) && orgaos.map(orgao => (
              <SelectItem key={orgao.id} value={orgao.id}>{orgao.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="edit-ativo">Status</Label>
        <Select 
          onValueChange={(value) => setValue("ativo", value === "true")}
          defaultValue={usuario.ativo ? "true" : "false"}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecionar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Ativo</SelectItem>
            <SelectItem value="false">Inativo</SelectItem>
          </SelectContent>
        </Select>
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

export default function UsuariosListPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [perfilFilter, setPerfilFilter] = useState<string>("all");
  
  // Estados para modais
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [orgaos, setOrgaos] = useState<Orgao[]>([]);
  const [perfis, setPerfis] = useState<PerfilUsuario[]>([]);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<UsuarioFormData>();

  // Handlers para modais
  const handleOpenDetails = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setOpenDetails(true);
  };

  const handleOpenEdit = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setOpenEdit(true);
  };

  const handleOpenDelete = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setOpenDelete(true);
  };

  const handleDelete = async () => {
    if (selectedUsuario) {
      try {
        await deleteUsuario(selectedUsuario.id);
        setOpenDelete(false);
        await refreshData();
        toast.success('Usuário excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir usuário');
      }
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const data = await getUsuarios();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: UsuarioFormData) => {
    try {
      await createUsuario(data);
      setOpenCreate(false);
      reset();
      await refreshData();
      toast.success('Usuário criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar usuário');
    }
  };

  // Filtros - com verificações de segurança
  const filteredUsuarios = Array.isArray(usuarios) ? usuarios.filter(usuario => {
    const matchesSearch = usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && usuario.ativo) ||
                         (statusFilter === "inactive" && !usuario.ativo);
    
    const matchesPerfil = perfilFilter === "all" || 
                         (usuario.perfil_nome && usuario.perfil_nome.toLowerCase().includes(perfilFilter.toLowerCase()));
    
    return matchesSearch && matchesStatus && matchesPerfil;
  }) : [];

  // Estatísticas - com verificações de segurança
  const stats = {
    total: Array.isArray(usuarios) ? usuarios.length : 0,
    active: Array.isArray(usuarios) ? usuarios.filter(u => u.ativo).length : 0,
    inactive: Array.isArray(usuarios) ? usuarios.filter(u => !u.ativo).length : 0,
  };

  useEffect(() => {
    refreshData();
    
    getOrgaos().then(data => {
      setOrgaos(Array.isArray(data) ? data : []);
    }).catch(error => {
      console.error('❌ Erro ao carregar órgãos:', error);
      setOrgaos([]);
    });
    
    getPerfis().then(data => {
      console.log('📋 Perfis carregados:', data);
      setPerfis(Array.isArray(data) ? data : []);
    }).catch(error => {
      console.error('❌ Erro ao carregar perfis:', error);
      setPerfis([]);
    });
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
                  <Users className="h-8 w-8" />
                  Gestão de Usuários
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Gerencie os usuários do sistema
                </p>
              </div>
              <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <PlusCircle className="h-5 w-5" />
                    Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Usuário</DialogTitle>
                    <DialogDescription>
                      Preencha as informações do novo usuário
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="create-nome">Nome *</Label>
                        <Input 
                          id="create-nome"
                          placeholder="Nome completo" 
                          {...register("nome", { required: true })} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="create-email">Email *</Label>
                        <Input 
                          id="create-email"
                          type="email"
                          placeholder="email@exemplo.com" 
                          {...register("email", { required: true })} 
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="create-username">Username *</Label>
                        <Input 
                          id="create-username"
                          placeholder="Nome de usuário" 
                          {...register("username", { required: true })} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="create-password">Senha *</Label>
                        <Input 
                          id="create-password"
                          type="password"
                          placeholder="Senha" 
                          {...register("password", { required: true })} 
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="create-perfil">Perfil *</Label>
                        <Select 
                         onValueChange={(value) => setValue("perfil", Number(value))}

                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar perfil" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(perfis) && perfis.map((p) => (
                              <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="create-orgao">Órgão</Label>
                        <Select 
                          onValueChange={(value) => setValue("orgao", value === "none" ? "" : value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar órgão" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-- Sem órgão --</SelectItem>
                            {Array.isArray(orgaos) && orgaos.map(orgao => (
                              <SelectItem key={orgao.id} value={orgao.id}>{orgao.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Criando..." : "Criar Usuário"}
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
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários Inativos</CardTitle>
                <UserX className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
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
                      placeholder="Nome, email, username..."
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
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:w-48">
                  <Label htmlFor="perfil">Perfil</Label>
                  <Select value={perfilFilter} onValueChange={setPerfilFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {Array.isArray(perfis) && perfis.filter(p => p.nome && p.nome.trim() !== '').map((p) => (
                        <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
        </div>
      </div>
            </CardContent>
          </Card>

          {/* Lista de Usuários */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuários</CardTitle>
              <CardDescription>
                {filteredUsuarios.length} de {Array.isArray(usuarios) ? usuarios.length : 0} usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
              ) : !Array.isArray(filteredUsuarios) || filteredUsuarios.length === 0 ? (
          <div className="flex flex-col items-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm || statusFilter !== "all" || perfilFilter !== "all"
                      ? "Tente ajustar os filtros de pesquisa" 
                      : "Comece criando seu primeiro usuário"
                    }
                  </p>
                  {!searchTerm && statusFilter === "all" && perfilFilter === "all" && (
                    <Button onClick={() => setOpenCreate(true)}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Criar Primeiro Usuário
                    </Button>
                  )}
          </div>
        ) : (
                <div className="space-y-4">
                  {Array.isArray(filteredUsuarios) && filteredUsuarios.map(usuario => {
              const displayName = usuario.nome || usuario.username || usuario.email;
                    const perfilDisplay = usuario.perfil_nome || 'Sem perfil';
                    const orgaoDisplay = usuario.orgao_nome || 'Sem órgão';
                    
              return (
                      <div key={usuario.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-primary">{displayName}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {usuario.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {orgaoDisplay}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(usuario.data_criacao).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={usuario.ativo ? "default" : "secondary"}>
                            {perfilDisplay}
                          </Badge>
                          <Badge variant={usuario.ativo ? "default" : "destructive"}>
                            {usuario.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDetails(usuario)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEdit(usuario)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDelete(usuario)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
              );
            })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal de Detalhes */}
        <Dialog open={openDetails} onOpenChange={setOpenDetails}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Detalhes do Usuário
              </DialogTitle>
            </DialogHeader>
            {selectedUsuario && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                    <p className="text-lg font-semibold">{selectedUsuario.nome}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Username</Label>
                    <p className="text-lg font-semibold">{selectedUsuario.username}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {selectedUsuario.email}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Perfil</Label>
                    <p className="text-lg font-semibold">{selectedUsuario.perfil_nome || 'Sem perfil'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge variant={selectedUsuario.ativo ? "default" : "destructive"}>
                      {selectedUsuario.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Órgão</Label>
                  <p className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {selectedUsuario.orgao_nome || "Não atribuído"}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Data de Criação</Label>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedUsuario.data_criacao).toLocaleString()}
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
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Atualize as informações do usuário
              </DialogDescription>
            </DialogHeader>
            {selectedUsuario && (
              <EditUsuarioForm 
                usuario={selectedUsuario} 
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
              <DialogTitle>Excluir Usuário</DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. Tem certeza que deseja excluir o usuário <strong>{selectedUsuario?.nome}</strong>?
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