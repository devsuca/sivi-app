import { useEffect, useState } from 'react';
import { Visitante } from '@/types/pessoa';
import { getVisitantes } from '@/services/pessoaService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  FileText, 
  Globe,
  ArrowLeft,
  Edit,
  Building,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PessoaDetailsProps {
  id: string;
}

export default function PessoaDetails({ id }: PessoaDetailsProps) {
  const [pessoa, setPessoa] = useState<Visitante | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchPessoa() {
      const data = await getVisitantes();
      setPessoa(data.find((v) => v.id === id) || null);
      setLoading(false);
    }
    fetchPessoa();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!pessoa) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Pessoa não encontrada
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            A pessoa que você está procurando não foi encontrada ou não existe.
          </p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTipoPessoaColor = (tipo: string) => {
    switch (tipo) {
      case 'singular':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'coletiva':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Detalhes da Pessoa
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Informações completas sobre {pessoa.tipo_pessoa === 'coletiva' ? 'a entidade' : 'a pessoa'}
            </p>
          </div>
        </div>
        <Link href={`/dashboard/pessoas/${id}/editar`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Principais */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Informações {pessoa.tipo_pessoa === 'coletiva' ? 'da Entidade' : 'Pessoais'}</span>
              </CardTitle>
              <CardDescription>
                Dados básicos {pessoa.tipo_pessoa === 'coletiva' ? 'da entidade' : 'da pessoa'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pessoa.tipo_pessoa === 'coletiva' ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Designação Social
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {pessoa.designacao_social || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        NIF
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {pessoa.nif || '-'}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Representante
                      </label>
                      {pessoa.representante_details ? (
                         <div className="mt-1 p-3 bg-muted/40 rounded-md border text-sm">
                             <div className="font-semibold text-gray-900 dark:text-white">
                                 {pessoa.representante_details.nome}
                             </div>
                             {pessoa.representante_details.documento_numero && (
                                 <div className="text-gray-600 dark:text-gray-400 mt-1">
                                     {pessoa.representante_details.documento_tipo}: {pessoa.representante_details.documento_numero}
                                 </div>
                             )}
                             {(pessoa.representante_details.email || pessoa.representante_details.telefone) && (
                                 <div className="flex gap-3 mt-1 text-gray-600 dark:text-gray-400">
                                     {pessoa.representante_details.email && <span>{pessoa.representante_details.email}</span>}
                                     {pessoa.representante_details.telefone && <span>{pessoa.representante_details.telefone}</span>}
                                 </div>
                             )}
                         </div>
                      ) : (
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {pessoa.representante || '-'}
                          </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Nome Completo
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {pessoa.nome || '-'}
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    {pessoa.email || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Telefone
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    {pessoa.telefone || '-'}
                  </p>
                </div>
                
                {pessoa.tipo_pessoa === 'singular' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Gênero
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {pessoa.genero || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Data de Nascimento
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(pessoa.data_nascimento || null)}
                      </p>
                    </div>
                  </>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Nacionalidade
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    {pessoa.nacionalidade || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </label>
                  <div className="mt-1">
                    <Badge 
                      variant={pessoa.ativo ? "default" : "destructive"}
                      className={pessoa.ativo ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}
                    >
                      {pessoa.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documentos */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Documentos</span>
              </CardTitle>
              <CardDescription>
                Informações dos documentos de identificação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Tipo de Documento
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {pessoa.documento_tipo || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Número do Documento
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {pessoa.documento_numero || '-'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Validade do Documento
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(pessoa.documento_validade || null)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          {pessoa.endereco && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Endereço</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {pessoa.endereco}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar com Informações Adicionais */}
        <div className="space-y-6">
          {/* Tipo de Pessoa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Tipo de Pessoa</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={getTipoPessoaColor(pessoa.tipo_pessoa)}>
                {pessoa.tipo_pessoa === 'singular' ? 'Pessoa Singular' : 'Pessoa Coletiva'}
              </Badge>
            </CardContent>
          </Card>

          {/* Observações */}
          {pessoa.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {pessoa.observacoes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/dashboard/pessoas/${id}/editar`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Pessoa
                </Button>
              </Link>
              <Link href="/dashboard/pessoas" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar à Lista
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
