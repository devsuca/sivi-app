'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Mail, 
  Building, 
  Shield, 
  Calendar, 
  Edit,
  ArrowLeft,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getMe } from '@/services/userService';
import { UserProfile } from '@/types/userProfile';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function PerfilPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await getMe();
        setProfile(profileData);
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        toast.error('Erro ao carregar dados do perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const getNivelAcessoColor = (nivel: string) => {
    switch (nivel) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'portaria':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'secretaria':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'recepcao':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Erro ao carregar perfil
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Não foi possível carregar os dados do seu perfil.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Meu Perfil
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Visualize e gerencie suas informações pessoais
              </p>
            </div>
          </div>
          <Link href="/dashboard/configuracoes">
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Editar Perfil
            </Button>
          </Link>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Pessoais */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Informações Pessoais</span>
              </CardTitle>
              <CardDescription>
                Dados básicos da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Nome Completo
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {profile.nome}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Nome de Usuário
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {profile.username}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    {profile.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Status da Conta
                  </label>
                  <div className="mt-1">
                    <Badge 
                      variant={profile.is_active ? "default" : "destructive"}
                      className={profile.is_active ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}
                    >
                      {profile.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Profissionais */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Informações Profissionais</span>
              </CardTitle>
              <CardDescription>
                Dados relacionados ao seu trabalho
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Perfil de Acesso
                  </label>
                  <div className="mt-1">
                    <Badge className={getNivelAcessoColor(profile.perfil?.nivel_acesso ?? '')}>
                      <Shield className="h-3 w-3 mr-1" />
                      {profile.perfil?.nome}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Nível de Acesso
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {profile.perfil?.nivel_acesso}
                  </p>
                </div>
                {profile.orgao && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Órgão
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      {profile.orgao.nome}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar com Informações Adicionais */}
        <div className="space-y-6">
          {/* Estatísticas da Conta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Histórico da Conta</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Conta criada em
                </label>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatDate(profile.date_joined)}
                </p>
              </div>
              {profile.last_login && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Último acesso
                  </label>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatDate(profile.last_login)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/configuracoes" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Alterar Senha
                </Button>
              </Link>
              <Link href="/dashboard/configuracoes" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
