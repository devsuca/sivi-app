import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DSINotification } from '@/services/notificationService';
import { notificationCrudService, UpdateNotificationData } from '@/services/notificationCrudService';
import { toast } from 'sonner';
import { Calendar, Clock, User, AlertTriangle, FileText } from 'lucide-react';

interface EditNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: DSINotification | null;
  onSuccess: () => void;
}

export function EditNotificationModal({ 
  isOpen, 
  onClose, 
  notification, 
  onSuccess 
}: EditNotificationModalProps) {
  const [formData, setFormData] = useState<UpdateNotificationData>({
    status: 'pendente',
    observacoes: '',
    urgencia: 'media'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (notification) {
      setFormData({
        status: notification.status || 'pendente',
        observacoes: notification.observacoes || '',
        urgencia: notification.urgencia || 'media'
      });
    }
  }, [notification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notification) return;

    setLoading(true);
    try {
      const result = await notificationCrudService.update(notification.id, formData);
      
      if (result.success) {
        toast.success('Notificação atualizada com sucesso!');
        onSuccess();
        onClose();
      } else {
        toast.error(`Erro ao atualizar: ${result.error}`);
      }
    } catch (error) {
      toast.error('Erro ao atualizar notificação');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: keyof UpdateNotificationData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!notification) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Editar Notificação
          </DialogTitle>
          <DialogDescription>
            Atualize as informações da notificação de {notification.nome_pessoa}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações da Pessoa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">Nome:</span>
              <span className="text-sm">{notification.nome_pessoa}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">Data:</span>
              <span className="text-sm">{notification.data_visita}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">Hora:</span>
              <span className="text-sm">{notification.hora_visita}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">Urgência Atual:</span>
              <span className="text-sm capitalize">{notification.urgencia}</span>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => handleFieldChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="visualizada">Visualizada</SelectItem>
                <SelectItem value="processada">Processada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Urgência */}
          <div className="space-y-2">
            <Label htmlFor="urgencia">Urgência</Label>
            <Select 
              value={formData.urgencia} 
              onValueChange={(value) => handleFieldChange('urgencia', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a urgência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Adicione observações sobre a notificação..."
              value={formData.observacoes}
              onChange={(e) => handleFieldChange('observacoes', e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
