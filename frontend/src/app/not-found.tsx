import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Ícone e Título */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <span className="text-[12rem] font-bold text-blue-900 select-none">404</span>
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-blue-600 p-6 rounded-full shadow-xl shadow-blue-200 mb-6">
              <FileQuestion className="h-16 w-16 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Página Não Encontrada</h1>
            <p className="text-slate-600 text-lg">
              Desculpe, a página que você está procurando não existe ou foi movida.
            </p>
          </div>
        </div>

        {/* Branding SIC (Simulado) */}
        <div className="flex flex-col items-center space-y-2 py-6 border-y border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-900 rounded-sm flex items-center justify-center text-white font-bold text-xs">SIC</div>
            <span className="font-semibold text-blue-900 tracking-tight">SERVIÇO DE INVESTIGAÇÃO CRIMINAL</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">SIVIS - SISTEMA DE VISITAS INSTITUCIONAL</p>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard" passHref>
            <Button className="w-full sm:w-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 h-12 px-8">
              <Home className="h-4 w-4" />
              Ir para o Painel
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="w-full sm:w-auto flex items-center gap-2 h-12 px-8"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
        
        <p className="text-slate-400 text-sm mt-8">
          &copy; {new Date().getFullYear()} Ministério do Interior - Angola
        </p>
      </div>
    </div>
  );
}
