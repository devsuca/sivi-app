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
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Play, 
  Clock, 
  User, 
  BookOpen,
  ExternalLink,
  Download,
  Star
} from 'lucide-react';

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  difficulty: 'fácil' | 'médio' | 'difícil';
  thumbnail: string;
  url: string;
  instructor: string;
  rating: number;
  views: number;
}

interface VideoTutorialsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const videoTutorials: VideoTutorial[] = [
  {
    id: '1',
    title: 'Introdução ao Sistema SIVI+360°',
    description: 'Aprenda os conceitos básicos e navegação principal do sistema de visitas.',
    duration: '8:45',
    category: 'Básico',
    difficulty: 'fácil',
    thumbnail: '/api/placeholder/320/180',
    url: 'https://www.youtube.com/watch?v=example1',
    instructor: 'Equipe SIVIS',
    rating: 4.8,
    views: 1250
  },
  {
    id: '2',
    title: 'Como Agendar uma Nova Visita',
    description: 'Tutorial passo a passo para agendar visitas no sistema.',
    duration: '12:30',
    category: 'Visitas',
    difficulty: 'fácil',
    thumbnail: '/api/placeholder/320/180',
    url: 'https://www.youtube.com/watch?v=example2',
    instructor: 'Maria Silva',
    rating: 4.9,
    views: 2100
  },
  {
    id: '3',
    title: 'Gestão de Crachás e Acessos',
    description: 'Como associar, gerenciar e controlar crachás de visitantes.',
    duration: '15:20',
    category: 'Segurança',
    difficulty: 'médio',
    thumbnail: '/api/placeholder/320/180',
    url: 'https://www.youtube.com/watch?v=example3',
    instructor: 'João Santos',
    rating: 4.7,
    views: 1800
  },
  {
    id: '4',
    title: 'Relatórios e Estatísticas Avançadas',
    description: 'Criação de relatórios personalizados e análise de dados.',
    duration: '18:15',
    category: 'Relatórios',
    difficulty: 'difícil',
    thumbnail: '/api/placeholder/320/180',
    url: 'https://www.youtube.com/watch?v=example4',
    instructor: 'Ana Costa',
    rating: 4.6,
    views: 950
  },
  {
    id: '5',
    title: 'Configuração de Notificações',
    description: 'Como configurar alertas e notificações personalizadas.',
    duration: '10:45',
    category: 'Configurações',
    difficulty: 'médio',
    thumbnail: '/api/placeholder/320/180',
    url: 'https://www.youtube.com/watch?v=example5',
    instructor: 'Pedro Lima',
    rating: 4.5,
    views: 1200
  },
  {
    id: '6',
    title: 'Leitor de QR Code - Guia Completo',
    description: 'Utilização avançada do leitor de QR Code para digitalização de documentos.',
    duration: '14:30',
    category: 'Tecnologia',
    difficulty: 'médio',
    thumbnail: '/api/placeholder/320/180',
    url: 'https://www.youtube.com/watch?v=example6',
    instructor: 'Carlos Mendes',
    rating: 4.8,
    views: 1600
  }
];

const categories = ['Todos', 'Básico', 'Visitas', 'Segurança', 'Relatórios', 'Configurações', 'Tecnologia'];

export default function VideoTutorialsModal({ isOpen, onClose }: VideoTutorialsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVideos = videoTutorials.filter(video => {
    const matchesCategory = selectedCategory === 'Todos' || video.category === selectedCategory;
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'fácil': return 'bg-green-100 text-green-800 border-green-200';
      case 'médio': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'difícil': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleVideoClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Video className="h-8 w-8 text-blue-600" />
            Tutoriais em Vídeo
          </DialogTitle>
          <DialogDescription>
            Aprenda a usar o sistema SIVI+360° com nossos tutoriais em vídeo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Pesquisar tutoriais..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Grid de Vídeos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleVideoClick(video.url)}
              >
                {/* Thumbnail */}
                <div className="relative">
                  <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
                    <Play className="h-16 w-16 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge className={`text-xs ${getDifficultyColor(video.difficulty)}`}>
                      {video.difficulty}
                    </Badge>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                    {video.duration}
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-white group-hover:text-blue-600 transition-colors">
                      {video.title}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {video.category}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                    {video.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{video.instructor}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{video.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <BookOpen className="h-4 w-4" />
                      <span>{video.views} visualizações</span>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Assistir
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredVideos.length === 0 && (
            <div className="text-center py-12">
              <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
                Nenhum tutorial encontrado
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Tente ajustar os filtros ou usar termos de pesquisa diferentes.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredVideos.length} tutorial{filteredVideos.length !== 1 ? 's' : ''} encontrado{filteredVideos.length !== 1 ? 's' : ''}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Baixar Playlist
              </Button>
              <DialogClose asChild>
                <Button variant="outline">Fechar</Button>
              </DialogClose>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
