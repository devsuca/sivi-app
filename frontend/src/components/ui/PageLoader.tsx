import { Loader2 } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/40">
      <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">Carregando...</span>
      </div>
    </div>
  );
}
