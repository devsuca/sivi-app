"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getUsuarioById } from "@/services/usuarioService";
import { Usuario } from "@/types/usuario";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UsuarioDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = React.use(params);

  useEffect(() => {
    getUsuarioById(id).then(data => {
      setUsuario(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center items-center h-96">
        <span className="animate-pulse text-lg text-muted-foreground">Carregando detalhes...</span>
      </div>
    </DashboardLayout>
  );
  if (!usuario) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-96">
        <span className="text-muted-foreground text-xl">Usuário não encontrado.</span>
        <Button className="mt-6" variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    </DashboardLayout>
  );
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto mt-8 flex flex-col gap-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <h2 className="text-2xl font-bold text-primary">Detalhes do Usuário</h2>
        </div>
        <div className="bg-white rounded-xl shadow p-8 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="block text-xs text-muted-foreground mb-1">Nome</span>
              <span className="font-semibold text-base">{usuario.nome}</span>
            </div>
            <div>
              <span className="block text-xs text-muted-foreground mb-1">Email</span>
              <span className="font-semibold text-base">{usuario.email}</span>
            </div>
            <div>
              <span className="block text-xs text-muted-foreground mb-1">Username</span>
              <span className="font-semibold text-base">{usuario.username}</span>
            </div>
            <div>
              <span className="block text-xs text-muted-foreground mb-1">Perfil</span>
              <span className="font-semibold text-base">{typeof usuario.perfil === 'object' ? usuario.perfil.nivel_acesso : usuario.perfil}</span>
            </div>
            <div>
              <span className="block text-xs text-muted-foreground mb-1">Órgão</span>
              <span className="font-semibold text-base">{usuario.orgao || '-'}</span>
            </div>
            <div>
              <span className="block text-xs text-muted-foreground mb-1">Ativo</span>
              <span className={`font-semibold text-base ${usuario.ativo ? 'text-green-700' : 'text-red-700'}`}>{usuario.ativo ? 'Sim' : 'Não'}</span>
            </div>
            <div className="md:col-span-2">
              <span className="block text-xs text-muted-foreground mb-1">Data de Criação</span>
              <span className="font-semibold text-base">{new Date(usuario.data_criacao).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
