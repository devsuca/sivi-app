"use client";
import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { createUsuario } from "@/services/usuarioService";
import { Usuario, PerfilUsuario } from "@/types/usuario";
import { Button } from "@/components/ui/button";

const perfis = ["admin", "operador", "visitante"] as const;


export default function NovoUsuarioPage() {
  const [form, setForm] = useState<Partial<Usuario>>({ ativo: true, perfil: 2 });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await createUsuario(form);
      setSuccess(true);
    } catch (err) {
      setError("Erro ao cadastrar usuário.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto mt-8 bg-white rounded-xl shadow p-8">
        <h2 className="text-2xl font-bold text-primary mb-6">Novo Usuário</h2>
        {success ? (
          <div className="text-green-600 font-semibold mb-4">Usuário cadastrado com sucesso!</div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <input name="nome" type="text" required placeholder="Nome" className="border rounded px-3 py-2" onChange={handleChange} />
            <input name="email" type="email" required placeholder="Email" className="border rounded px-3 py-2" onChange={handleChange} />
            <input name="username" type="text" required placeholder="Username" className="border rounded px-3 py-2" onChange={handleChange} />
            <select name="perfil" required className="border rounded px-3 py-2" value={typeof form.perfil === 'object' ? form.perfil.nivel_acesso : form.perfil} onChange={handleChange}>
              {perfis.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select name="ativo" required className="border rounded px-3 py-2" value={form.ativo ? "true" : "false"} onChange={e => setForm({ ...form, ativo: e.target.value === "true" })}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Cadastrar"}</Button>
            {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
