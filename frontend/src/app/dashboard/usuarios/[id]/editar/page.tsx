"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getUsuarioById, updateUsuario } from "@/services/usuarioService";
import { Usuario, PerfilUsuario } from "@/types/usuario";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
const perfis = ["admin", "operador", "visitante"] as const;
export default function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [form, setForm] = useState<Partial<Usuario>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [id, setId] = useState<string>("");

  useEffect(() => {
    params.then(({ id: userId }) => {
      setId(userId);
    });
  }, [params]);

  useEffect(() => {
    if (id) {
      getUsuarioById(id).then(data => {
        setUsuario(data);
        setForm(data);
        setLoading(false);
      });
    }
  }, [id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateUsuario(id, form);
      setSuccess(true);
      setTimeout(() => router.push(`/dashboard/usuarios/${id}`), 1200);
    } catch (err) {
      setError("Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center items-center h-96">
        <span className="animate-pulse text-lg text-muted-foreground">Carregando...</span>
      </div>
    </DashboardLayout>
  );
  if (!usuario) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-96">
        <span className="text-muted-foreground text-xl">Usuário não encontrado.</span>
        <Button className="mt-6" variant="outline" onClick={() => router.back()}>Voltar</Button>
      </div>
    </DashboardLayout>
  );
  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto mt-8 bg-white rounded-xl shadow p-8">
        <h2 className="text-2xl font-bold text-primary mb-6">Editar Usuário</h2>
        {success ? (
          <div className="text-green-600 font-semibold mb-4">Alterações salvas com sucesso!</div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <input name="nome" type="text" required placeholder="Nome" className="border rounded px-3 py-2" value={form.nome || ""} onChange={handleChange} />
            <input name="email" type="email" required placeholder="Email" className="border rounded px-3 py-2" value={form.email || ""} onChange={handleChange} />
            <input name="username" type="text" required placeholder="Username" className="border rounded px-3 py-2" value={form.username || ""} onChange={handleChange} />
            <select name="perfil" required className="border rounded px-3 py-2" value={typeof form.perfil === 'object' ? form.perfil.nivel_acesso : form.perfil} onChange={handleChange}>
              {perfis.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select name="ativo" required className="border rounded px-3 py-2" value={form.ativo ? "true" : "false"} onChange={e => setForm({ ...form, ativo: e.target.value === "true" })}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
            {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
