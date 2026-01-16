'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { login as authLogin } from '@/services/authService';
import { getMe } from '@/services/userService';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Globe, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(1, { message: 'A palavra-passe é obrigatória.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailReadOnly, setEmailReadOnly] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authLogin(data);
      
      // Primeiro, salvar os tokens
      localStorage.setItem('accessToken', response.access);
      localStorage.setItem('refreshToken', response.refresh);
      
      // Aguardar um pouco para garantir que o token seja processado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Depois, buscar dados do usuário logado
      const user = await getMe();
      console.log('👤 Dados do usuário:', user);
      
      if (user) {
        localStorage.setItem('user_nome', user.nome_completo || user.nome || user.email || '');
        localStorage.setItem('user_role', user.tipo || user.role || '');
        localStorage.setItem('user_id', user.id?.toString() || '');
      }
      
      // Chamar a função de login do contexto
      login(response.access, response.refresh);
      
      // Redirecionar para dashboard específico baseado no role
      const userRole = user?.perfil?.nivel_acesso || user?.role || user?.tipo || '';
      console.log('🎯 Role do usuário:', userRole);
      let dashboardPath = '/dashboard';
      
      switch (userRole) {
        case 'admin':
          dashboardPath = '/dashboard/admin';
          break;
        case 'suporte':
          dashboardPath = '/dashboard/suporte';
          break;
        case 'portaria':
          dashboardPath = '/dashboard/portaria';
          break;
        case 'secretaria':
          dashboardPath = '/dashboard/secretaria';
          break;
        case 'recepcao':
          dashboardPath = '/dashboard/recepcao';
          break;
        default:
          dashboardPath = '/dashboard';
      }
      
      console.log('🚀 Redirecionando para:', dashboardPath);
      
      // Aguardar um pouco mais para garantir que o contexto seja atualizado
      setTimeout(() => {
        router.push(dashboardPath);
      }, 200);
      
    } catch (err: any) {
      console.error('Erro no login:', err);
      // Usar a mensagem específica do erro se disponível
      const errorMessage = err?.message || 'Email ou palavra-passe inválidos.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      {/* Left Section */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-10 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        
        <div className="text-center relative z-10">
          {/* Logo do SIC - Centralizado e Maior */}
          <div className="mx-auto mb-8 relative flex justify-center">
            <div className="w-48 h-48 flex items-center justify-center">
              <Image
                src="/sic_logo.png"
                alt="SIC Logo"
                width={160}
                height={160}
                className="object-contain"
                priority
              />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            SIVI+360º
          </h1>
          <p className="text-lg text-gray-300 mb-4">
            Sistema Integrado de Visitas
          </p>
          <div className="text-sm text-gray-400 bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
            <p>Ministério do Interior</p>
            <p className="font-semibold">Serviço de Investigação Criminal</p>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            {/* Logo para mobile - Maior e Centralizado */}
            <div className="lg:hidden mx-auto mb-6 flex justify-center">
              <div className="w-24 h-24 flex items-center justify-center">
                <Image
                  src="/sic-logo.png"
                  alt="SIC Logo"
                  width={72}
                  height={72}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Autenticação
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Insira as suas credenciais para aceder ao sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Erro de Autenticação</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    placeholder="ex: seu.email@sic.gov.ao"
                    {...register('email', {
                      onBlur: (e) => {
                        const value = e.target.value;
                        if (value && value.trim() !== '' && !value.includes('@')) {
                           setValue('email', `${value.trim()}@sic.gov.ao`, { shouldValidate: true });
                           setEmailReadOnly(true);
                        }
                      }
                    })}
                    readOnly={emailReadOnly}
                    className={emailReadOnly ? 'bg-gray-100 text-gray-600' : ''}
                    disabled={loading}
                  />
                  {emailReadOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        setEmailReadOnly(false);
                        setValue('email', '', { shouldValidate: false });
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1"
                    >
                      Alterar
                    </button>
                  )}
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2 relative">
                <Label htmlFor="password">Palavra-passe</Label>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  {...register('password')}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-2 transform -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2.5 transition-all duration-200 shadow-lg hover:shadow-xl" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Aguarde...</span>
                  </div>
                ) : (
                  'Entrar no Sistema'
                )}
              </Button>
            </form>
          </CardContent>
          
          {/* Footer do Card */}
          <div className="px-6 pb-6">
            <div className="text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="font-medium">© 2025 Serviço de Investigação Criminal</p>
              <p>Desenvolvido pelo DTTI | DDS - 2025</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
