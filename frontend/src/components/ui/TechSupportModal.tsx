'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  Clock, 
  User, 
  AlertCircle,
  CheckCircle,
  Send,
  FileText,
  Camera,
  Paperclip,
  MapPin,
  Globe,
  Headphones
} from 'lucide-react';
import { toast } from 'sonner';

interface SupportOption {
  id: string;
  title: string;
  description: string;
  icon: any;
  available: boolean;
  responseTime: string;
  contact: string;
  action: () => void;
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  category: string;
  status: 'aberto' | 'em_andamento' | 'resolvido' | 'fechado';
  createdAt: string;
}

interface TechSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const supportOptions: SupportOption[] = [
  {
    id: 'chat',
    title: 'Chat Online',
    description: 'Suporte instantâneo via chat',
    icon: MessageCircle,
    available: true,
    responseTime: 'Imediato',
    contact: 'Disponível agora',
    action: () => window.open('https://chat.sic.gov.ao', '_blank')
  },
  {
    id: 'phone',
    title: 'Telefone',
    description: 'Suporte por telefone 24/7',
    icon: Phone,
    available: true,
    responseTime: 'Imediato',
    contact: '+244 222 000 000',
    action: () => window.open('tel:+244222000000')
  },
  {
    id: 'email',
    title: 'Email',
    description: 'Suporte por email',
    icon: Mail,
    available: true,
    responseTime: '2-4 horas',
    contact: 'suporte@sic.gov.ao',
    action: () => window.open('mailto:suporte@sic.gov.ao')
  },
  {
    id: 'ticket',
    title: 'Ticket de Suporte',
    description: 'Criar um ticket de suporte',
    icon: FileText,
    available: true,
    responseTime: '4-8 horas',
    contact: 'Sistema de tickets',
    action: () => {}
  }
];

const quickSolutions = [
  {
    title: 'Esqueci minha senha',
    description: 'Como recuperar acesso à conta',
    icon: AlertCircle,
    solution: 'Clique em "Esqueci minha senha" na tela de login e siga as instruções enviadas por email.'
  },
  {
    title: 'Erro ao carregar página',
    description: 'Página não carrega ou apresenta erro',
    icon: Globe,
    solution: 'Verifique sua conexão com a internet, limpe o cache do navegador ou tente em modo incógnito.'
  },
  {
    title: 'QR Code não funciona',
    description: 'Leitor de QR Code não está funcionando',
    icon: Camera,
    solution: 'Verifique se a câmera está funcionando, permita o acesso à câmera no navegador e teste com outro QR Code.'
  },
  {
    title: 'Relatório não gera',
    description: 'Erro ao gerar relatórios',
    icon: FileText,
    solution: 'Verifique se os filtros estão corretos, tente com um período menor ou entre em contato com o administrador.'
  }
];

export default function TechSupportModal({ isOpen, onClose }: TechSupportModalProps) {
  const [activeTab, setActiveTab] = useState<'contact' | 'ticket' | 'solutions'>('contact');
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: '',
    priority: 'media' as 'baixa' | 'media' | 'alta' | 'urgente',
    category: 'geral'
  });

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      
      console.log('🔍 Enviando ticket:', {
        url: `${apiUrl}/tickets/`,
        token: token ? 'Token presente' : 'Token ausente',
        data: {
          titulo: ticketForm.subject,
          descricao: ticketForm.description,
          prioridade: ticketForm.priority,
          categoria: ticketForm.category,
          tags: []
        }
      });
      
      const response = await fetch(`${apiUrl}/tickets/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titulo: ticketForm.subject,
          descricao: ticketForm.description,
          prioridade: ticketForm.priority,
          categoria: ticketForm.category,
          tags: []
        }),
      });

      console.log('📡 Resposta do servidor:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        try {
          const data = await response.json();
          console.log('✅ Ticket criado com sucesso:', data);
          toast.success('Ticket de suporte enviado com sucesso!');
          setTicketForm({ subject: '', description: '', priority: 'media', category: 'geral' });
          onClose();
        } catch (jsonError) {
          console.log('⚠️ Erro ao parsear resposta JSON, mas status OK');
          toast.success('Ticket de suporte enviado com sucesso!');
          setTicketForm({ subject: '', description: '', priority: 'media', category: 'geral' });
          onClose();
        }
      } else {
        try {
          const errorData = await response.json();
          console.error('❌ Erro do servidor:', errorData);
          toast.error(errorData.detail || errorData.error || `Erro ${response.status}: ${response.statusText}`);
        } catch (jsonError) {
          const errorText = await response.text();
          console.error('❌ Erro ao parsear resposta de erro:', errorText);
          if (errorText.includes('<!DOCTYPE')) {
            toast.error('Servidor retornou HTML em vez de JSON. Verifique se o backend está rodando corretamente.');
          } else {
            toast.error(`Erro ${response.status}: ${response.statusText}. Detalhes: ${errorText.substring(0, 100)}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro de rede:', error);
      if (error instanceof Error) {
        toast.error(`Erro de conectividade: ${error.message}`);
      } else {
        toast.error('Ocorreu um erro de conectividade desconhecido.');
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'baixa': return 'bg-green-100 text-green-800 border-green-200';
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'alta': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'urgente': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Headphones className="h-8 w-8 text-blue-600" />
            Suporte Técnico
          </DialogTitle>
          <DialogDescription>
            Estamos aqui para ajudar você com qualquer problema ou dúvida
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'contact'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('contact')}
            >
              Contato Direto
            </button>
            <button
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'ticket'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('ticket')}
            >
              Ticket de Suporte
            </button>
            <button
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'solutions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('solutions')}
            >
              Soluções Rápidas
            </button>
          </div>

          {/* Conteúdo das Tabs */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {supportOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`p-6 rounded-lg border-2 transition-all cursor-pointer ${
                      option.available
                        ? 'border-green-200 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800'
                        : 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700'
                    }`}
                    onClick={option.action}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full ${
                        option.available ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <option.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">
                          {option.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-3">
                          {option.description}
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">
                              Resposta: {option.responseTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">
                              {option.contact}
                            </span>
                          </div>
                        </div>
                        {option.available && (
                          <Badge className="mt-3 bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Disponível
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Informações de Contato Adicionais */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <h3 className="font-semibold text-lg text-blue-800 dark:text-blue-200 mb-4">
                  Informações de Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">Endereço</p>
                      <p className="text-blue-600 dark:text-blue-300">Luanda, Angola</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">Horário</p>
                      <p className="text-blue-600 dark:text-blue-300">24/7 (Emergências)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ticket' && (
            <form onSubmit={handleTicketSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assunto
                  </label>
                  <Input
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    placeholder="Descreva brevemente o problema"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prioridade
                  </label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoria
                </label>
                <select
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="geral">Geral</option>
                  <option value="tecnico">Problema Técnico</option>
                  <option value="usuario">Dúvida de Usuário</option>
                  <option value="sistema">Problema do Sistema</option>
                  <option value="seguranca">Segurança</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição Detalhada
                </label>
                <textarea
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  placeholder="Descreva o problema em detalhes, incluindo passos para reproduzir, mensagens de erro, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                  required
                />
              </div>

              <div className="flex items-center gap-4">
                <Button type="button" variant="outline" size="sm">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Anexar Arquivo
                </Button>
                <Button type="button" variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Capturar Tela
                </Button>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Ticket
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'solutions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Soluções para Problemas Comuns
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickSolutions.map((solution, index) => (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <solution.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                          {solution.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {solution.description}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                          {solution.solution}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
