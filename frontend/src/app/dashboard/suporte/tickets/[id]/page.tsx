'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SupportSidebar from '@/components/support/SupportSidebar';
import SupportRouteGuard from '@/components/support/SupportRouteGuard';
import { getTicket, getTicketComments, addComment, closeTicket, assignTicket, Ticket } from '@/services/ticketService';
import { 
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  MessageSquare,
  Send,
  UserPlus,
  Star,
  FileText,
  Tag,
  RefreshCw,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTicket(parseInt(ticketId));
      setTicket(data);
    } catch (err: any) {
      console.error('Erro ao buscar ticket:', err);
      setError('Erro ao carregar ticket. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const data = await getTicketComments(parseInt(ticketId));
      setComments(data);
    } catch (err) {
      console.error('Erro ao buscar comentários:', err);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
      fetchComments();
    }
  }, [ticketId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      await addComment(parseInt(ticketId), newComment);
      setNewComment('');
      await fetchComments();
      toast.success('Comentário adicionado com sucesso!');
    } catch (err: any) {
      console.error('Erro ao adicionar comentário:', err);
      toast.error('Erro ao adicionar comentário. Tente novamente.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCloseTicket = async () => {
    try {
      setActionLoading('close');
      await closeTicket(parseInt(ticketId));
      await fetchTicket();
      toast.success('Ticket fechado com sucesso!');
    } catch (err: any) {
      console.error('Erro ao fechar ticket:', err);
      toast.error('Erro ao fechar ticket. Tente novamente.');
    } finally {
      setActionLoading(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300';
      case 'alta': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300';
      case 'média': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'baixa': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300';
      case 'em_andamento': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'fechado': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aberto': return <AlertCircle className="h-4 w-4" />;
      case 'em_andamento': return <Clock className="h-4 w-4" />;
      case 'fechado': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
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
      <SupportRouteGuard>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
          <SupportSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </SupportRouteGuard>
    );
  }

  if (error || !ticket) {
    return (
      <SupportRouteGuard>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
          <SupportSidebar />
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-96">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Ticket não encontrado
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {error || 'O ticket solicitado não foi encontrado.'}
                </p>
                <Button onClick={() => router.push('/dashboard/suporte/tickets')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar aos Tickets
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </SupportRouteGuard>
    );
  }

  return (
    <SupportRouteGuard>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <SupportSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/dashboard/suporte/tickets')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Ticket #{ticket.numero}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    {ticket.titulo}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={fetchTicket} 
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                {ticket.status !== 'fechado' && (
                  <Button 
                    onClick={handleCloseTicket}
                    disabled={actionLoading === 'close'}
                    variant="outline"
                    size="sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Fechar Ticket
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Ticket Details */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Detalhes do Ticket
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(ticket.status)} flex items-center gap-1`}>
                          {getStatusIcon(ticket.status)}
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={`${getPriorityColor(ticket.prioridade)}`}>
                          {ticket.prioridade}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {ticket.titulo}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {ticket.descricao}
                      </p>
                    </div>
                    
                    {ticket.tags && ticket.tags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Tags
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {ticket.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Comments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Comentários ({comments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Add Comment */}
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Adicione um comentário..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                      />
                      <Button 
                        onClick={handleAddComment}
                        disabled={submittingComment || !newComment.trim()}
                        className="w-full sm:w-auto"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {submittingComment ? 'Enviando...' : 'Enviar Comentário'}
                      </Button>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-4">
                      {comments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhum comentário ainda.</p>
                          <p className="text-sm">Seja o primeiro a comentar!</p>
                        </div>
                      ) : (
                        comments.map((comment, index) => (
                          <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {comment.usuario?.username || 'Usuário'}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(comment.data_criacao)}
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                              {comment.comentario}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Ticket Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações do Ticket</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Solicitante
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {ticket.solicitante.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {ticket.solicitante.email}
                        </p>
                      </div>
                    </div>

                    {ticket.atribuido_para && (
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Atribuído para
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {ticket.atribuido_para.username}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Criado em
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {formatDate(ticket.data_criacao)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Última atualização
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {formatDate(ticket.data_atualizacao)}
                        </p>
                      </div>
                    </div>

                    {ticket.data_fechamento && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Fechado em
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {formatDate(ticket.data_fechamento)}
                          </p>
                        </div>
                      </div>
                    )}

                    {ticket.satisfacao && (
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Satisfação
                          </p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${
                                  i < ticket.satisfacao! 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                            <span className="text-sm text-gray-600 dark:text-gray-300 ml-1">
                              ({ticket.satisfacao}/5)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar Ticket
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Atribuir Ticket
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      Gerar Relatório
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SupportRouteGuard>
  );
}
