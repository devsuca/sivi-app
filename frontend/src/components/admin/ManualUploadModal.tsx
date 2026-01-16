'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';

const manualSchema = z.object({
  ficheiro: z
    .any()
    .refine((files) => files && files.length > 0, 'É necessário selecionar um ficheiro.')
    .refine((files) => files?.[0]?.type === 'application/pdf', 'O ficheiro deve ser um PDF.'),
});

type ManualFormValues = z.infer<typeof manualSchema>;

interface ManualUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManualUploadModal({ isOpen, onClose, onSuccess }: ManualUploadModalProps) {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ManualFormValues>({
    resolver: zodResolver(manualSchema),
  });

  const ficheiro = watch('ficheiro');

  const onSubmit = async (data: ManualFormValues) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('ficheiro', data.ficheiro[0]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      
      const response = await fetch(`${apiUrl}/configuracoes/manual/upload/`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Falha ao enviar o manual.');
        } catch (jsonError) {
          const errorText = await response.text();
          throw new Error(`Erro ${response.status}: ${errorText || 'Falha ao enviar o manual.'}`);
        }
      }

      toast.success('Manual do utilizador atualizado com sucesso!');
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar o manual. Tente novamente.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5" />
            Carregar Manual do Utilizador
          </DialogTitle>
          <DialogDescription>
            Selecione um novo ficheiro PDF para substituir o manual atual do sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="ficheiro">Ficheiro PDF</Label>
            <Input id="ficheiro" type="file" accept="application/pdf" {...register('ficheiro')} />
            {ficheiro?.[0] && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <FileText className="h-4 w-4" />
                <span>{ficheiro[0].name}</span>
              </div>
            )}
           {errors.ficheiro?.message && (
  <p className="text-sm text-red-500 mt-1">
    {String(errors.ficheiro.message)}
  </p>
)}

          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              Enviar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
