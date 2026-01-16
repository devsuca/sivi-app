import { useState, useEffect } from 'react';
import { Tabs, Tab } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Visitante } from '@/types/pessoa';

interface PessoaFormProps {
  mode: 'create' | 'edit';
  id?: string;
}

export default function PessoaForm({ mode, id }: PessoaFormProps) {
  const [activeTab, setActiveTab] = useState('dados');
  const [form, setForm] = useState<Partial<Visitante>>({ ativo: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preencher dados se for edição
  useEffect(() => {
    if (mode === 'edit' && id) {
      setLoading(true);
      import('@/services/pessoaService').then(({ getVisitantes }) => {
        getVisitantes().then((data) => {
          const pessoa = data.find((v) => v.id === id);
          if (pessoa) setForm(pessoa);
          setLoading(false);
        });
      });
    }
  }, [mode, id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'create') {
        await import('@/services/pessoaService').then(({ createVisitante }) => createVisitante(form));
      } else if (mode === 'edit' && id) {
        await import('@/services/pessoaService').then(({ updateVisitante }) => updateVisitante(id, form));
      }
      // TODO: Redirecionar ou mostrar sucesso
    } catch (err: any) {
      setError('Erro ao salvar pessoa.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
      <form className="bg-white rounded-xl shadow-lg p-8 w-full max-w-xl" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-4 text-primary">{mode === 'edit' ? 'Editar Pessoa' : 'Cadastrar Pessoa'}</h2>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <Tab value="dados" label="Dados Pessoais" />
          <Tab value="endereco" label="Endereço" />
          <Tab value="documentos" label="Documentos" />
        </Tabs>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {loading ? (
          <div className="text-muted-foreground">A carregar...</div>
        ) : (
          <>
            {activeTab === 'dados' && (
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {form.tipo_pessoa === 'coletiva' ? (
                  <>
                    <div className="space-y-2">
                      <label className="font-semibold">Designação Social</label>
                      <input name="designacao_social" value={form.designacao_social || ''} onChange={handleChange} className="input" placeholder="Designação Social" required />
                    </div>
                    <div className="space-y-2">
                      <label className="font-semibold">NIF</label>
                      <input name="nif" value={form.nif || ''} onChange={handleChange} className="input" placeholder="NIF" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="font-semibold">Nome</label>
                      <input name="nome" value={form.nome || ''} onChange={handleChange} className="input" placeholder="Nome" required />
                    </div>
                    <div className="space-y-2">
                      <label className="font-semibold">Gênero</label>
                      <select name="genero" value={form.genero || ''} onChange={handleChange} className="input">
                        <option value="">Selecione o gênero</option>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                        <option value="O">Outro</option>
                      </select>
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <label className="font-semibold">Email</label>
                  <input name="email" value={form.email || ''} onChange={handleChange} className="input" placeholder="Email" />
                </div>
                <div className="space-y-2">
                  <label className="font-semibold">Telefone</label>
                  <input name="telefone" value={form.telefone || ''} onChange={handleChange} className="input" placeholder="Telefone" />
                </div>
              </div>
            )}
            {activeTab === 'endereco' && (
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="font-semibold">Endereço</label>
                  <input name="endereco" value={form.endereco || ''} onChange={handleChange} className="input" placeholder="Endereço" />
                </div>
                <div className="space-y-2">
                  <label className="font-semibold">Nacionalidade</label>
                  <input name="nacionalidade" value={form.nacionalidade || ''} onChange={handleChange} className="input" placeholder="Nacionalidade" />
                </div>
              </div>
            )}
            {activeTab === 'documentos' && (
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="font-semibold">Tipo de Documento</label>
                  <select name="documento_tipo" value={form.documento_tipo || ''} onChange={handleChange} className="input">
                    <option value="">Tipo de Documento</option>
                    <option value="BI">BI</option>
                    <option value="PASSAPORTE">Passaporte</option>
                    <option value="CARTA">Carta</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-semibold">Nº do Documento</label>
                  <input name="documento_numero" value={form.documento_numero || ''} onChange={handleChange} className="input" placeholder="Número do Documento" />
                </div>
                <div className="space-y-2">
                  <label className="font-semibold">Validade</label>
                  <input name="documento_validade" value={form.documento_validade || ''} onChange={handleChange} className="input" placeholder="Validade" type="date" />
                </div>
              </div>
            )}
          </>
        )}
        <div className="flex justify-end mt-6 gap-2">
          <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancelar</Button>
          <Button type="submit" disabled={loading}>{mode === 'create' ? 'Cadastrar' : 'Salvar'}</Button>
        </div>
      </form>
    </div>
  );
}
