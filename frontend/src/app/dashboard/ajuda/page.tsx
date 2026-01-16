'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  HelpCircle, 
  Search, 
  User, 
  ClipboardList, 
  BarChart2, 
  Download, 
  UploadCloud,
  BookOpen,
  Video,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  Star,
  TrendingUp,
  Shield,
  Settings,
  Users,
  FileText,
  Calendar,
  QrCode,
  Bell,
  AlertCircle,
  CheckCircle,
  Info,
  Lightbulb,
  Zap,
  Target,
  Globe
} from 'lucide-react';
import ManualUploadModal from '@/components/admin/ManualUploadModal';
import VideoTutorialsModal from '@/components/ui/VideoTutorialsModal';
import TechSupportModal from '@/components/ui/TechSupportModal';

const helpTopics = [
  {
    category: 'Gestão de Visitas',
    icon: ClipboardList,
    color: 'bg-blue-500',
    items: [
      {
        question: 'Como agendar uma nova visita?',
        answer: 'Para agendar uma nova visita, vá para o menu "Visitas" e clique em "Nova Visita". Preencha todos os campos obrigatórios, incluindo informações do visitante, motivo da visita e o órgão a ser visitado. Após preencher, clique em "Agendar Visita".',
        tags: ['básico', 'visitas'],
        difficulty: 'fácil'
      },
      {
        question: 'Como finalizar uma visita em curso?',
        answer: 'Na lista de visitas, encontre a visita com o estado "Em Curso". Na coluna de ações, clique no botão "Finalizar". Se a visita tiver um crachá associado, será necessário confirmar a devolução do mesmo.',
        tags: ['visitas', 'finalização'],
        difficulty: 'fácil'
      },
      {
        question: 'Como associar um crachá a uma visita?',
        answer: 'Na página de detalhes da visita, clique no botão "Associar Crachá". Selecione um crachá disponível na lista e confirme a associação. O estado da visita mudará para "Em Curso".',
        tags: ['crachás', 'visitas'],
        difficulty: 'médio'
      },
      {
        question: 'Como usar o leitor de QR Code?',
        answer: 'O leitor de QR Code permite digitalizar documentos de identificação automaticamente. Clique no ícone da câmera na tela de nova visita e aponte para o QR Code do documento. Os dados serão preenchidos automaticamente.',
        tags: ['qr-code', 'digitalizaçao'],
        difficulty: 'médio'
      }
    ]
  },
  {
    category: 'Gestão de Usuários',
    icon: User,
    color: 'bg-green-500',
    items: [
      {
        question: 'Como criar um novo usuário?',
        answer: 'Apenas administradores podem criar novos usuários. Se você for um administrador, vá para "Configurações" > "Usuários" e clique em "Novo Usuário". Preencha os dados e defina um perfil de acesso.',
        tags: ['admin', 'usuários'],
        difficulty: 'médio'
      },
      {
        question: 'Como alterar meu perfil ou senha?',
        answer: 'No menu do seu perfil (canto superior direito), clique em "Meu Perfil". Nesta página, você poderá atualizar suas informações pessoais e alterar sua senha.',
        tags: ['perfil', 'senha'],
        difficulty: 'fácil'
      },
      {
        question: 'Quais são os diferentes perfis de usuário?',
        answer: 'O sistema possui três perfis principais: Administrador (acesso total), Recepção (gestão de visitas) e Segurança (controle de acesso). Cada perfil tem permissões específicas.',
        tags: ['perfis', 'permissões'],
        difficulty: 'fácil'
      }
    ]
  },
  {
    category: 'Relatórios e Estatísticas',
    icon: BarChart2,
    color: 'bg-purple-500',
    items: [
      {
        question: 'Como gerar um relatório de visitas?',
        answer: 'Vá para a seção "Relatórios". Escolha o tipo de relatório que deseja gerar (ex: Visitas por Período). Preencha os filtros desejados, como intervalo de datas e órgão, e clique em "Gerar Relatório".',
        tags: ['relatórios', 'dados'],
        difficulty: 'médio'
      },
      {
        question: 'Posso exportar os dados?',
        answer: 'Sim. Na maioria das tabelas (Visitas, Usuários, etc.), você encontrará um botão "Exportar". Você pode exportar os dados para formatos como Excel e PDF.',
        tags: ['exportar', 'dados'],
        difficulty: 'fácil'
      },
      {
        question: 'Como visualizar estatísticas em tempo real?',
        answer: 'O dashboard principal mostra estatísticas em tempo real, incluindo visitas do dia, visitas em curso e gráficos de tendências. Os dados são atualizados automaticamente.',
        tags: ['dashboard', 'tempo-real'],
        difficulty: 'fácil'
      }
    ]
  },
  {
    category: 'Notificações e Alertas',
    icon: Bell,
    color: 'bg-orange-500',
    items: [
      {
        question: 'Como configurar notificações?',
        answer: 'Vá para "Configurações" > "Notificações" para personalizar quais alertas deseja receber. Você pode escolher entre notificações por email, push e SMS.',
        tags: ['notificações', 'configuração'],
        difficulty: 'médio'
      },
      {
        question: 'Como receber alertas de visitas importantes?',
        answer: 'Configure alertas para visitas VIP, visitas de longa duração ou visitas que excedem o tempo previsto. Esses alertas podem ser enviados automaticamente.',
        tags: ['alertas', 'visitas-vip'],
        difficulty: 'médio'
      }
    ]
  },
  {
    category: 'Segurança e Acesso',
    icon: Shield,
    color: 'bg-red-500',
    items: [
      {
        question: 'Como funciona o controle de acesso?',
        answer: 'O sistema registra todos os acessos e movimentações. Cada ação é logada com timestamp, usuário e detalhes da operação para auditoria completa.',
        tags: ['segurança', 'auditoria'],
        difficulty: 'médio'
      },
      {
        question: 'Como recuperar minha senha?',
        answer: 'Na tela de login, clique em "Esqueci minha senha". Digite seu email e siga as instruções enviadas para redefinir sua senha de forma segura.',
        tags: ['senha', 'recuperação'],
        difficulty: 'fácil'
      }
    ]
  },
  {
    category: 'FAQ Rápido',
    icon: Lightbulb,
    color: 'bg-orange-500',
    items: [
      {
        question: 'Como faço login no sistema?',
        answer: 'Use seu username e senha fornecidos pelo administrador. Se não lembra da senha, clique em "Esqueci minha senha" na tela de login.',
        tags: ['login', 'acesso'],
        difficulty: 'fácil'
      },
      {
        question: 'O que fazer se a página não carrega?',
        answer: 'Verifique sua conexão com a internet, limpe o cache do navegador (Ctrl+F5) ou tente em modo incógnito. Se o problema persistir, entre em contato com o suporte.',
        tags: ['problema', 'navegador'],
        difficulty: 'fácil'
      },
      {
        question: 'Como imprimir um relatório?',
        answer: 'Na página de relatórios, gere o relatório desejado e clique no botão "Imprimir" ou use Ctrl+P no seu navegador.',
        tags: ['relatório', 'impressão'],
        difficulty: 'fácil'
      },
      {
        question: 'Posso usar o sistema no celular?',
        answer: 'Sim! O sistema é responsivo e funciona em dispositivos móveis. Recomendamos usar o navegador Chrome ou Safari para melhor experiência.',
        tags: ['mobile', 'celular'],
        difficulty: 'fácil'
      },
      {
        question: 'Como alterar meu perfil?',
        answer: 'Vá para "Perfil" no menu lateral e clique em "Editar". Você pode alterar informações pessoais, mas não pode mudar seu username ou role.',
        tags: ['perfil', 'editar'],
        difficulty: 'fácil'
      }
    ]
  }
];

const quickActions = [
  {
    title: 'Manual do Utilizador',
    description: 'Guia completo do sistema',
    icon: BookOpen,
    action: 'download',
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    title: 'Tutoriais em Vídeo',
    description: 'Aprenda com vídeos explicativos',
    icon: Video,
    action: 'videos',
    color: 'bg-green-500 hover:bg-green-600'
  },
  {
    title: 'Suporte Técnico',
    description: 'Entre em contato conosco',
    icon: MessageCircle,
    action: 'support',
    color: 'bg-purple-500 hover:bg-purple-600'
  },
  {
    title: 'FAQ Rápido',
    description: 'Perguntas mais frequentes',
    icon: Lightbulb,
    action: 'faq',
    color: 'bg-orange-500 hover:bg-orange-600'
  }
];

const contactInfo = [
  {
    type: 'Telefone',
    value: '+244 222 000 000',
    icon: Phone,
    available: '24/7'
  },
  {
    type: 'Email',
    value: 'suporte@sic.gov.ao',
    icon: Mail,
    available: 'Seg-Sex 8h-17h'
  },
  {
    type: 'Chat Online',
    value: 'Disponível agora',
    icon: MessageCircle,
    available: 'Seg-Sex 8h-17h'
  }
];

export default function AjudaPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Usar o contexto de autenticação de forma segura
  let authUser = null;
  try {
    const authContext = useAuth();
    authUser = authContext.user;
  } catch (error) {
    // Erro ao carregar contexto de autenticação
  }

  const filteredTopics = helpTopics.map(category => ({
    ...category,
    items: category.items.filter(item => {
      const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || category.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'all' || item.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    })
  })).filter(category => category.items.length > 0);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'fácil': return 'bg-green-100 text-green-800 border-green-200';
      case 'médio': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'difícil': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'download':
        window.open(`${isClient ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api') : 'http://localhost:8000/api'}/configuracoes/manual/download/`, '_blank');
        break;
      case 'videos':
        setIsVideoModalOpen(true);
        break;
      case 'support':
        setIsSupportModalOpen(true);
        break;
      case 'faq':
        // Scroll para a seção de FAQ e focar na busca
        const faqSection = document.getElementById('faq-section');
        if (faqSection) {
          faqSection.scrollIntoView({ behavior: 'smooth' });
          // Focar no campo de busca após um pequeno delay
          setTimeout(() => {
            const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
            }
          }, 500);
        }
        break;
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header Hero Section */}
          <div className="text-center mb-12">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-2xl opacity-20"></div>
              <HelpCircle className="relative mx-auto h-20 w-20 text-blue-600 mb-6" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Central de Ajuda
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Encontre respostas rápidas, tutoriais e suporte completo para o sistema SIVI+360°
            </p>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {quickActions.map((action, index) => (
              <Card 
                key={index} 
                className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                onClick={() => handleQuickAction(action.action)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex p-4 rounded-full ${action.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-white">{action.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{action.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Pesquisar tópicos, tags ou palavras-chave..."
                  className="w-full pl-12 pr-4 py-3 text-lg rounded-xl bg-white dark:bg-gray-700 shadow-sm border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todas as Categorias</option>
                  {helpTopics.map((category) => (
                    <option key={category.category} value={category.category}>
                      {category.category}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todas as Dificuldades</option>
                  <option value="fácil">Fácil</option>
                  <option value="médio">Médio</option>
                  <option value="difícil">Difícil</option>
                </select>
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          {isClient && authUser?.role === 'admin' && (
            <div className="flex justify-center mb-8">
              <Button
                size="lg"
                variant="outline"
                className="flex items-center gap-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl px-6 py-3"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <UploadCloud className="h-5 w-5" />
                Carregar Novo Manual
              </Button>
            </div>
          )}

          {/* Help Topics / FAQ */}
          <div id="faq-section">
          {filteredTopics.length > 0 ? (
            <Tabs defaultValue="all" className="space-y-8">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1">
                <TabsTrigger value="all" className="rounded-lg">Todos</TabsTrigger>
                {helpTopics.map((category) => (
                  <TabsTrigger key={category.category} value={category.category} className="rounded-lg">
                    <category.icon className="h-4 w-4 mr-2" />
                    {category.category.split(' ')[0]}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all" className="space-y-6">
                {filteredTopics.map((category) => (
                  <Card key={category.category} className="overflow-hidden shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <CardHeader className={`${category.color} bg-opacity-10 border-b border-gray-200/50 dark:border-gray-700/50`}>
                      <CardTitle className="flex items-center gap-3 text-xl text-gray-700 dark:text-gray-200">
                        <div className={`p-2 rounded-lg ${category.color} bg-opacity-20`}>
                          <category.icon className="h-6 w-6 text-white" />
                        </div>
                        {category.category}
                        <Badge variant="secondary" className="ml-auto">
                          {category.items.length} tópicos
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Accordion type="single" collapsible className="w-full">
                        {category.items.map((item, index) => (
                          <AccordionItem value={`item-${index}`} key={index} className="border-b border-gray-200/50 dark:border-gray-700/50 last:border-b-0">
                            <AccordionTrigger className="px-6 py-4 text-left font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                              <div className="flex items-center gap-3">
                                <span>{item.question}</span>
                                <div className="flex gap-2 ml-auto">
                                  <Badge className={`text-xs ${getDifficultyColor(item.difficulty)}`}>
                                    {item.difficulty}
                                  </Badge>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6 pt-2 text-gray-600 dark:text-gray-300 bg-gray-50/30 dark:bg-gray-900/30">
                              <p className="whitespace-pre-line mb-4">{item.answer}</p>
                              <div className="flex flex-wrap gap-2">
                                {item.tags.map((tag, tagIndex) => (
                                  <Badge key={tagIndex} variant="outline" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-16">
              <AlertCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                Nenhum resultado encontrado
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Tente ajustar os filtros ou usar termos de pesquisa diferentes.
              </p>
            </div>
          )}
          </div>

          {/* Contact Information */}
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Precisa de Mais Ajuda?</h2>
              <p className="text-blue-100 text-lg">Nossa equipe de suporte está pronta para ajudar você</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {contactInfo.map((contact, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex p-4 bg-white/20 rounded-full mb-4">
                    <contact.icon className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{contact.type}</h3>
                  <p className="text-blue-100 mb-2">{contact.value}</p>
                  <p className="text-sm text-blue-200">{contact.available}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ManualUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={() => {}}
        />

        <VideoTutorialsModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
        />

        <TechSupportModal
          isOpen={isSupportModalOpen}
          onClose={() => setIsSupportModalOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
}
