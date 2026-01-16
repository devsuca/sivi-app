'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Users, FileText, Shield, Send, AlertTriangle, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { notificationService } from '@/services/notificationService';

interface DSINotificationData {
  nome_pessoa: string;
  data_visita: string;
  hora_visita: string;
  observacoes: string;
  urgencia: 'baixa' | 'media' | 'alta';
}

export default function DSINotificationForm() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<DSINotificationData>();

  const onSubmit = async (data: DSINotificationData) => {
    setIsSubmitting(true);
    
    try {
      // Enviar notificação usando o serviço
      const notification = notificationService.addNotification({
        nome_pessoa: data.nome_pessoa,
        data_visita: data.data_visita,
        hora_visita: data.hora_visita,
        observacoes: data.observacoes,
        urgencia: data.urgencia,
        enviado_por: user?.username || 'Usuário Desconhecido',
        orgao: user?.orgao?.nome || 'Órgão Desconhecido'
      });


      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Notificação enviada com sucesso para o DSI!');
      reset();
    } catch (error) {
      toast.error('Erro ao enviar notificação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Formulário */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            Dados da Visita
          </CardTitle>
          <p className="text-gray-600 text-sm mt-1">
            Preencha os dados da visita que será notificada ao DSI
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nome da Pessoa */}
            <div className="space-y-2">
              <Label htmlFor="nome_pessoa" className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-blue-600" />
                Nome da Pessoa ou Pessoas *
              </Label>
              <Input
                id="nome_pessoa"
                placeholder="Ex: João Silva Santos, Maria Fernandes..."
                {...register('nome_pessoa', { 
                  required: 'Nome da pessoa é obrigatório',
                  minLength: { value: 3, message: 'Nome deve ter pelo menos 3 caracteres' }
                })}
                className={`h-11 ${errors.nome_pessoa ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
              />
              {errors.nome_pessoa && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.nome_pessoa.message}
                </p>
              )}
            </div>

            {/* Data e Hora */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="data_visita" className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Data Prevista *
                </Label>
                <Input
                  id="data_visita"
                  type="date"
                  {...register('data_visita', { 
                    required: 'Data da visita é obrigatória',
                    validate: (value) => {
                      const selectedDate = new Date(value);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return selectedDate >= today || 'Data não pode ser anterior a hoje';
                    }
                  })}
                  className={`h-11 ${errors.data_visita ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                />
                {errors.data_visita && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.data_visita.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hora_visita" className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Hora Prevista *
                </Label>
                <Input
                  id="hora_visita"
                  type="time"
                  {...register('hora_visita', { 
                    required: 'Hora da visita é obrigatória'
                  })}
                  className={`h-11 ${errors.hora_visita ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                />
                {errors.hora_visita && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.hora_visita.message}
                  </p>
                )}
              </div>
            </div>

            {/* Urgência */}
            <div className="space-y-2">
              <Label htmlFor="urgencia" className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                Nível de Urgência *
              </Label>
              <select
                id="urgencia"
                {...register('urgencia', { required: 'Nível de urgência é obrigatório' })}
                className={`w-full h-11 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.urgencia 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:border-blue-500'
                }`}
              >
                <option value="">Selecione o nível de urgência</option>
                <option value="baixa">🟢 Baixa - Visita de rotina</option>
                <option value="media">🟡 Média - Visita importante</option>
                <option value="alta">🔴 Alta - Visita urgente</option>
              </select>
              {errors.urgencia && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.urgencia.message}
                </p>
              )}
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes" className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-blue-600" />
                Observações Adicionais
              </Label>
              <Textarea
                id="observacoes"
                placeholder="Informações adicionais sobre a visita, motivo, documentos necessários, etc."
                rows={4}
                {...register('observacoes')}
                className="focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Informações do Remetente */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Informações do Remetente</h4>
                  <div className="text-sm text-gray-600 mt-1">
                    <div><strong>Usuário:</strong> {user?.username}</div>
                    <div><strong>Órgão:</strong> {user?.orgao?.nome || 'Órgão não informado'}</div>
                    <div><strong>Data/Hora:</strong> {new Date().toLocaleString('pt-BR')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={isSubmitting}
                className="flex-1 h-11"
              >
                Limpar Formulário
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Notificação ao DSI
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
