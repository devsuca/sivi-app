'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Users, 
  UserCheck, 
  UserX,
  Building2,
  Mail,
  Phone,
  Badge,
  Shield
} from 'lucide-react';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as BadgeComponent } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Efetivo, EfetivoFormData } from '@/types/efetivo';
import { Orgao } from '@/types/orgao';
import { Usuario } from '@/types/usuario';
import { getEfetivos, createEfetivo, updateEfetivo, deleteEfetivo } from '@/services/efetivoService';
import { getOrgaos } from '@/services/orgaoService';
import { getUsuarios } from '@/services/usuarioService';

const efetivoSchema = z.object({
  nome_completo: z.string().min(1, 'Nome completo é obrigatório'),
  numero_funcional: z.string().optional(),
  tipo: z.enum(['interno', 'externo']).optional(),
  orgao: z.string().optional(),
  email: z.string()
    .email('Email inválido')
    .refine((val) => val === '' || /@sic\.gov\.ao$/i.test(val), { message: 'Email institucional deve ser do domínio sic.gov.ao' })
    .optional().or(z.literal('')),
  telefone: z.string().optional(),
  usuario: z.string().optional(),
  ativo: z.boolean().optional(),
}).refine(
  async (data) => {
    // Checar unicidade caso tenha email institucional preenchido
    if (data.email && data.email.endsWith('@sic.gov.ao')) {
      const response = await fetch('/api/checar-email-unico?email=' + data.email);
      if (response.ok) {
        const r = await response.json();
        return r.unico === true;
      }
      return false;
    }
    return true;
  }, {
    message: 'Email institucional já está em uso.',
    path: ['email'],
  }
);

type EfetivoFormValues = z.infer<typeof efetivoSchema>;

export default function EfetivosPage() {
  const [efetivos, setEfetivos] = useState<Efetivo[]>([]);
  const [orgaos, setOrgaos] = useState<Orgao[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [orgaoFilter, setOrgaoFilter] = useState<string>('todos');
  
  // Estados para modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEfetivo, setSelectedEfetivo] = useState<Efetivo | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<EfetivoFormValues>({
    resolver: zodResolver(efetivoSchema),
    defaultValues: {
      ativo: true,
      tipo: 'interno',
    },
  });

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [efetivosData, orgaosData, usuariosData] = await Promise.all([
        getEfetivos(),
        getOrgaos(),
        getUsuarios(),
      ]);
      
      setEfetivos(Array.isArray(efetivosData) ? efetivosData : []);
      setOrgaos(Array.isArray(orgaosData) ? orgaosData : []);
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Filtros
  const filteredEfetivos = Array.isArray(efetivos) ? efetivos.filter(efetivo => {
    const matchesSearch = efetivo.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         efetivo.numero_funcional?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         efetivo.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || 
                         (statusFilter === 'ativo' && efetivo.ativo) ||
                         (statusFilter === 'inativo' && !efetivo.ativo);
    
    const matchesTipo = tipoFilter === 'todos' || efetivo.tipo === tipoFilter;
    
    const matchesOrgao = orgaoFilter === 'todos' || 
                        (efetivo.orgao && String(efetivo.orgao) === orgaoFilter);
    
    return matchesSearch && matchesStatus && matchesTipo && matchesOrgao;
  }) : [];

  // Estatísticas
  const stats = {
    total: Array.isArray(efetivos) ? efetivos.length : 0,
    ativos: Array.isArray(efetivos) ? efetivos.filter(e => e.ativo).length : 0,
    inativos: Array.isArray(efetivos) ? efetivos.filter(e => !e.ativo).length : 0,
    internos: Array.isArray(efetivos) ? efetivos.filter(e => e.tipo === 'interno').length : 0,
    externos: Array.isArray(efetivos) ? efetivos.filter(e => e.tipo === 'externo').length : 0,
  };

  // Handlers
  const handleCreate = async (data: EfetivoFormValues) => {
    try {
      const payload: EfetivoFormData = {
        ...data,
        orgao: data.orgao ? Number(data.orgao) : undefined,
        usuario: data.usuario ? Number(data.usuario) : undefined,
      };
      
      await createEfetivo(payload);
      toast.success('Efetivo criado com sucesso!');
      setIsCreateModalOpen(false);
      reset();
      loadData();
    } catch (error) {
      console.error('Erro ao criar efetivo:', error);
      toast.error('Erro ao criar efetivo');
    }
  };

  const handleEdit = async (data: EfetivoFormValues) => {
    if (!selectedEfetivo) return;
    
    try {
      const payload: EfetivoFormData = {
        ...data,
        orgao: data.orgao ? Number(data.orgao) : undefined,
        usuario: data.usuario ? Number(data.usuario) : undefined,
      };
      
      await updateEfetivo(selectedEfetivo.id, payload);
      toast.success('Efetivo atualizado com sucesso!');
      setIsEditModalOpen(false);
      setSelectedEfetivo(null);
      reset();
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar efetivo:', error);
      toast.error('Erro ao atualizar efetivo');
    }
  };

  const handleDelete = async () => {
    if (!selectedEfetivo) return;
    
    try {
      await deleteEfetivo(selectedEfetivo.id);
      toast.success('Efetivo excluído com sucesso!');
      setIsDeleteModalOpen(false);
      setSelectedEfetivo(null);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir efetivo:', error);
      toast.error('Erro ao excluir efetivo');
    }
  };

  const openEditModal = (efetivo: Efetivo) => {
    setSelectedEfetivo(efetivo);
    setValue('nome_completo', efetivo.nome_completo);
    setValue('numero_funcional', efetivo.numero_funcional || '');
    setValue('tipo', efetivo.tipo || 'interno');
    setValue('orgao', efetivo.orgao ? String(efetivo.orgao) : '');
    setValue('email', efetivo.email || '');
    setValue('telefone', efetivo.telefone || '');
    setValue('usuario', efetivo.usuario ? String(efetivo.usuario) : '');
    setValue('ativo', efetivo.ativo ?? true);
    setIsEditModalOpen(true);
  };

  const openViewModal = (efetivo: Efetivo) => {
    setSelectedEfetivo(efetivo);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (efetivo: Efetivo) => {
    setSelectedEfetivo(efetivo);
    setIsDeleteModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando efetivos...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                <Shield className="h-8 w-8" />
                Efetivos
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Gerencie o efetivo da instituição</p>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Efetivo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Efetivo</DialogTitle>
              <DialogDescription>
                Adicione um novo membro do efetivo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome_completo">Nome Completo *</Label>
                  <Input
                    id="nome_completo"
                    {...register('nome_completo')}
                    placeholder="Nome completo"
                  />
                  {errors.nome_completo && (
                    <p className="text-sm text-red-600">{errors.nome_completo.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="numero_funcional">Número Funcional</Label>
                  <Input
                    id="numero_funcional"
                    {...register('numero_funcional')}
                    placeholder="Número funcional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select onValueChange={(value) => setValue('tipo', value as 'interno' | 'externo')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interno">Interno</SelectItem>
                      <SelectItem value="externo">Externo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="orgao">Órgão</Label>
                  <Select onValueChange={(value) => setValue('orgao', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar órgão" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(orgaos) && orgaos.map((orgao) => (
                        <SelectItem key={orgao.id} value={String(orgao.id)}>
                          {orgao.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="email@exemplo.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    {...register('telefone')}
                    placeholder="Telefone"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="usuario">Usuário (Opcional)</Label>
                <Select onValueChange={(value) => setValue('usuario', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Associar usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(usuarios) && usuarios.map((usuario) => (
                      <SelectItem key={usuario.id} value={String(usuario.id)}>
                        {usuario.nome} ({usuario.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ativo"
                  {...register('ativo')}
                  className="rounded"
                />
                <Label htmlFor="ativo">Ativo</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Efetivo</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ativos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inativos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Internos</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.internos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Externos</CardTitle>
            <Badge className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.externos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nome, número de agente ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <span className="text-xs text-gray-500 ml-2">A busca filtra por Nome, Número de Agente ou Email.</span>
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="interno">Internos</SelectItem>
                  <SelectItem value="externo">Externos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="orgao">Órgão</Label>
              <Select value={orgaoFilter} onValueChange={setOrgaoFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {Array.isArray(orgaos) && orgaos.map((orgao) => (
                    <SelectItem key={orgao.id} value={String(orgao.id)}>
                      {orgao.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Efetivos</CardTitle>
          <CardDescription>
            {filteredEfetivos.length} de {stats.total} efetivos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEfetivos.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum efetivo encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'todos' || tipoFilter !== 'todos' || orgaoFilter !== 'todos'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece criando um novo efetivo.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Número Funcional</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Órgão</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEfetivos.map((efetivo) => (
                  <TableRow key={efetivo.id}>
                    <TableCell className="font-medium">{efetivo.nome_completo}</TableCell>
                    <TableCell>{efetivo.numero_funcional || '-'}</TableCell>
                    <TableCell>
                      <BadgeComponent variant={efetivo.tipo === 'interno' ? 'default' : 'secondary'}>
                        {efetivo.tipo === 'interno' ? 'Interno' : 'Externo'}
                      </BadgeComponent>
                    </TableCell>
                    <TableCell>{efetivo.orgao_nome || '-'}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {efetivo.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-3 h-3 mr-1" />
                            {efetivo.email}
                          </div>
                        )}
                        {efetivo.telefone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-3 h-3 mr-1" />
                            {efetivo.telefone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <BadgeComponent variant={efetivo.ativo ? 'default' : 'destructive'}>
                        {efetivo.ativo ? 'Ativo' : 'Inativo'}
                      </BadgeComponent>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewModal(efetivo)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(efetivo)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteModal(efetivo)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Efetivo</DialogTitle>
          </DialogHeader>
          {selectedEfetivo && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Nome Completo</Label>
                  <p className="text-gray-700">{selectedEfetivo.nome_completo}</p>
                </div>
                <div>
                  <Label className="font-semibold">Número Funcional</Label>
                  <p className="text-gray-700">{selectedEfetivo.numero_funcional || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Tipo</Label>
                  <p className="text-gray-700">
                    {selectedEfetivo.tipo === 'interno' ? 'Interno' : 'Externo'}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold">Órgão</Label>
                  <p className="text-gray-700">{selectedEfetivo.orgao_nome || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Email</Label>
                  <p className="text-gray-700">{selectedEfetivo.email || '-'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Telefone</Label>
                  <p className="text-gray-700">{selectedEfetivo.telefone || '-'}</p>
                </div>
              </div>
              <div>
                <Label className="font-semibold">Usuário Associado</Label>
                <p className="text-gray-700">{selectedEfetivo.usuario_nome || '-'}</p>
              </div>
              <div>
                <Label className="font-semibold">Status</Label>
                <BadgeComponent variant={selectedEfetivo.ativo ? 'default' : 'destructive'}>
                  {selectedEfetivo.ativo ? 'Ativo' : 'Inativo'}
                </BadgeComponent>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Efetivo</DialogTitle>
            <DialogDescription>
              Atualize as informações do efetivo
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleEdit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-nome_completo">Nome Completo *</Label>
                <Input
                  id="edit-nome_completo"
                  {...register('nome_completo')}
                  placeholder="Nome completo"
                />
                {errors.nome_completo && (
                  <p className="text-sm text-red-600">{errors.nome_completo.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-numero_funcional">Número Funcional</Label>
                <Input
                  id="edit-numero_funcional"
                  {...register('numero_funcional')}
                  placeholder="Número funcional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-tipo">Tipo</Label>
                <Select onValueChange={(value) => setValue('tipo', value as 'interno' | 'externo')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interno">Interno</SelectItem>
                    <SelectItem value="externo">Externo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-orgao">Órgão</Label>
                <Select onValueChange={(value) => setValue('orgao', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar órgão" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(orgaos) && orgaos.map((orgao) => (
                      <SelectItem key={orgao.id} value={String(orgao.id)}>
                        {orgao.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  {...register('email')}
                  placeholder="email@exemplo.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-telefone">Telefone</Label>
                <Input
                  id="edit-telefone"
                  {...register('telefone')}
                  placeholder="Telefone"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-usuario">Usuário (Opcional)</Label>
              <Select onValueChange={(value) => setValue('usuario', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Associar usuário" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(usuarios) && usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={String(usuario.id)}>
                      {usuario.nome} ({usuario.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-ativo"
                {...register('ativo')}
                className="rounded"
              />
              <Label htmlFor="edit-ativo">Ativo</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o efetivo "{selectedEfetivo?.nome_completo}"? 
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
