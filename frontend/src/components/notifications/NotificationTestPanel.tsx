'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Send, 
  TestTube, 
  Zap, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  User,
  Calendar,
  MapPin,
  MessageSquare
} from 'lucide-react';
import { useNotifications } from '@/services/notificationService';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export default function NotificationTestPanel() {
  const { user } = useAuth();
  const { simulateNotification, addNotification } = useNotifications();
  const [isCreating, setIsCreating] = useState(false);
  
  // Formulário para criar notificação personalizada
  const [formData, setFormData] = useState({
    nome_pessoa: 'João Silva Santos',
    data_visita: new Date().toISOString().split('T')[0],
    hora_visita: '14:30',
    observacoes: 'Visita de teste para demonstração do sistema DSI',
    urgencia: 'media' as 'baixa' | 'media' | 'alta',
    orgao: 'DEPARTAMENTO DE SEGURANÇA INSTITUCIONAL'
  });

  // Verificar se o usuário pode testar notificações
  const canTestNotifications = user?.role === 'portaria' && 
    (user.orgao?.nome === 'DEPARTAMENTO DE SEGURANÇA INSTITUCIONAL' ||   
     user.orgao?.nome?.includes('SEGURANÇA INSTITUCIONAL'));

  const handleSimulateNotification = () => {
    try {
      const notification = simulateNotification();
      toast.success('Notificação de teste criada com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar notificação de teste');
    }
  };

  const handleCreateCustomNotification = async () => {
    if (!formData.nome_pessoa.trim()) {
      toast.error('Nome da pessoa é obrigatório');
      return;
    }

    setIsCreating(true);
    try {
      const notification = addNotification({
        nome_pessoa: formData.nome_pessoa,
        data_visita: formData.data_visita,
        hora_visita: formData.hora_visita,
        observacoes: formData.observacoes,
        urgencia: formData.urgencia,
        enviado_por: user?.username || 'test_user',
        orgao: formData.orgao
      });
      
      toast.success('Notificação personalizada criada com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar notificação personalizada');
    } finally {
      setIsCreating(false);
    }
  };

  const getUrgenciaIcon = (urgencia: string) => {
    switch (urgencia) {
      case 'alta': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'media': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'baixa': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baixa': return 'secondary';
      default: return 'secondary';
    }
  };

  if (!canTestNotifications) {
    return (
      <Card className="w-full max-w-4xl border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Bell className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Acesso Restrito ao Painel de Teste
            </h3>
            <p className="text-gray-500 mb-4">
              Este painel é exclusivo para usuários de portaria do Departamento de Segurança Institucional (DSI).
            </p>
            {user?.role === 'portaria' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-orange-800 text-sm">
                  <strong>Seu perfil atual:</strong><br />
                  Role: {user.role}<br />
                  Órgão: {user.orgao?.nome || 'Não definido'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <TestTube className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">
              Painel de Teste - Notificações DSI
            </CardTitle>
            <p className="text-green-100 text-sm mt-1">
              Teste o sistema de notificações em tempo real
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Status do Usuário */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-800">Usuário Autorizado</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-green-600" />
              <span><strong>Usuário:</strong> {user?.username}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-700 border-green-300">
                {user?.role}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span><strong>Órgão:</strong> {user?.orgao?.nome}</span>
            </div>
          </div>
        </div>

        {/* Teste Rápido */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Teste Rápido
          </h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm mb-4">
              Crie uma notificação de teste com dados pré-definidos para verificar o funcionamento do sistema.
            </p>
            <Button 
              onClick={handleSimulateNotification}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Bell className="h-4 w-4 mr-2" />
              Criar Notificação de Teste
            </Button>
          </div>
        </div>

        {/* Formulário Personalizado */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Send className="h-5 w-5 text-purple-600" />
            Notificação Personalizada
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome_pessoa">Nome da Pessoa *</Label>
              <Input
                id="nome_pessoa"
                value={formData.nome_pessoa}
                onChange={(e) => setFormData({...formData, nome_pessoa: e.target.value})}
                placeholder="Ex: João Silva Santos"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="urgencia">Urgência</Label>
              <Select 
                value={formData.urgencia} 
                onValueChange={(value: 'baixa' | 'media' | 'alta') => 
                  setFormData({...formData, urgencia: value})
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">
                    <div className="flex items-center gap-2">
                      {getUrgenciaIcon('baixa')}
                      Baixa
                    </div>
                  </SelectItem>
                  <SelectItem value="media">
                    <div className="flex items-center gap-2">
                      {getUrgenciaIcon('media')}
                      Média
                    </div>
                  </SelectItem>
                  <SelectItem value="alta">
                    <div className="flex items-center gap-2">
                      {getUrgenciaIcon('alta')}
                      Alta
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="data_visita">Data da Visita</Label>
              <Input
                id="data_visita"
                type="date"
                value={formData.data_visita}
                onChange={(e) => setFormData({...formData, data_visita: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hora_visita">Hora da Visita</Label>
              <Input
                id="hora_visita"
                type="time"
                value={formData.hora_visita}
                onChange={(e) => setFormData({...formData, hora_visita: e.target.value})}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              placeholder="Observações adicionais sobre a visita..."
              rows={3}
            />
          </div>
          
          <Button 
            onClick={handleCreateCustomNotification}
            disabled={isCreating}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isCreating ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Criar Notificação Personalizada
              </>
            )}
          </Button>
        </div>

        {/* Preview da Notificação */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-600" />
            Preview da Notificação
          </h3>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={getUrgenciaColor(formData.urgencia)}>
                {getUrgenciaIcon(formData.urgencia)}
                <span className="ml-1">{formData.urgencia.toUpperCase()}</span>
              </Badge>
              <Badge variant="outline">PENDENTE</Badge>
            </div>
            
            <h4 className="font-semibold text-lg mb-3">
              Notificação de Visita - {formData.nome_pessoa}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span><strong>Data:</strong> {formData.data_visita}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span><strong>Hora:</strong> {formData.hora_visita}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span><strong>Enviado por:</strong> {user?.username}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span><strong>Órgão:</strong> {formData.orgao}</span>
              </div>
            </div>
            
            {formData.observacoes && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-blue-800 text-sm">
                  <strong>Observações:</strong> {formData.observacoes}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
