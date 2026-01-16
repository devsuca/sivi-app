
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { searchVisitanteByDocument, createVisitante } from '@/services/pessoaService';
import { getVisitasByVisitante, searchAcompanhanteByDocument, getOrgaosVisitadosByVisitante } from '@/services/visitaService';
import { Visitante } from '@/types/pessoa';
import { Search, User, QrCode, Camera } from 'lucide-react';
import QRCodeReaderFinal from '@/components/ui/QRCodeReaderFinal';
import { QRParsedData } from '@/utils/qrCodeParser';

interface VisitanteSearchProps {
  visitantes: Visitante[];
  selectedVisitanteId: string;
  onVisitanteSelect: (id: string) => void;
  onVisitorFound: (visitor: Visitante) => void;
  onVisitorCreated?: (visitor: Visitante) => void;
  showToast: (message: string) => void;
}

export default function VisitanteSearch({
  visitantes,
  selectedVisitanteId,
  onVisitanteSelect,
  onVisitorFound,
  onVisitorCreated,
  showToast
}: VisitanteSearchProps) {
  const [documentSearch, setDocumentSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [visitCount, setVisitCount] = useState<number | null>(null);
  const [orgaosVisitados, setOrgaosVisitados] = useState<{ orgao: any; quantidade: number }[]>([]);
  const [showQRReader, setShowQRReader] = useState(false);
  
  // Garantir que visitantes seja sempre um array
  const safeVisitantes = Array.isArray(visitantes) ? visitantes : [];

  const createVisitanteFromAcompanhante = async (acompanhante: any): Promise<Visitante> => {
    // Validar dados obrigatórios
    if (!acompanhante.nome || !acompanhante.documento_tipo || !acompanhante.documento_numero) {
      throw new Error('Dados do acompanhante incompletos para criar visitante');
    }
    
    const visitanteData = {
      nome: acompanhante.nome.trim(),
      documento_tipo: acompanhante.documento_tipo,
      documento_numero: acompanhante.documento_numero.trim(),
      nacionalidade: acompanhante.nacionalidade?.trim() || null,
      ativo: true,
      tipo_pessoa: 'singular' as const // Valor correto para pessoa singular
    };
    
    
    return await createVisitante(visitanteData);
  };

  const createVisitanteFromQR = async (qrData: QRParsedData): Promise<Visitante> => {
    // Validar dados obrigatórios do QR
    if (!qrData.nome_completo || !qrData.documento_numero) {
      throw new Error('Dados do QR Code incompletos para criar visitante');
    }
    
    const visitanteData = {
      nome: qrData.nome_completo.trim(),
      documento_tipo: qrData.documento_tipo || 'BI',
      documento_numero: qrData.documento_numero.trim(),
      nacionalidade: qrData.nacionalidade?.trim() || 'Angolana',
      data_nascimento: qrData.data_nascimento || undefined,
      genero: qrData.genero === 'O' ? undefined : qrData.genero,
      documento_validade: qrData.data_validade || undefined,
      ativo: true,
      tipo_pessoa: 'singular' as const
    };
    
    
    return await createVisitante(visitanteData);
  };

  const handleQRCodeScanned = async (qrData: QRParsedData) => {
    setSearching(true);
    try {
      // Primeiro, tentar buscar visitante existente pelo documento
      const visitanteExistente = await searchVisitanteByDocument(qrData.documento_numero || '');
      
      if (visitanteExistente && visitanteExistente.id) {
        // Visitante já existe, selecionar
        onVisitorFound(visitanteExistente);
        onVisitanteSelect(visitanteExistente.id);
        showToast('Visitante encontrado e selecionado via QR Code!');
        
        // Buscar quantidade de visitas e órgãos visitados
        const visitas = await getVisitasByVisitante(visitanteExistente.id);
        setVisitCount(visitas.length);
        
        // Buscar órgãos visitados
        const orgaos = await getOrgaosVisitadosByVisitante(visitanteExistente.id);
        setOrgaosVisitados(orgaos);
      } else {
        // Criar novo visitante a partir dos dados do QR
        const novoVisitante = await createVisitanteFromQR(qrData);
        onVisitorFound(novoVisitante);
        onVisitanteSelect(novoVisitante.id);
        
        if (onVisitorCreated) {
          onVisitorCreated(novoVisitante);
        }
        
        showToast('Visitante criado automaticamente a partir do QR Code!');
        setVisitCount(0); // Novo visitante
        setOrgaosVisitados([]); // Novo visitante não tem órgãos visitados
      }
      
      // Fechar o leitor QR
      setShowQRReader(false);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message ||
                          'Erro ao processar dados do QR Code';
      showToast(`Erro: ${errorMessage}`);
    } finally {
      setSearching(false);
    }
  };

  const fetchVisitCount = async (visitanteId: string) => {
    if (!visitanteId || visitanteId === 'undefined' || visitanteId === 'null') {
      setVisitCount(null);
      return;
    }
    try {
      const visitas = await getVisitasByVisitante(visitanteId);
      setVisitCount(visitas.length);
    } catch (error) {
      setVisitCount(null);
    }
  };

  useEffect(() => {
    fetchVisitCount(selectedVisitanteId);
  }, [selectedVisitanteId]);

  const handleDocumentSearch = async () => {
    if (!documentSearch.trim()) {
      showToast('Digite um número de documento para pesquisar');
      return;
    }
    
    setSearching(true);
    
    try {
      // Primeiro, buscar visitantes
      const visitante = await searchVisitanteByDocument(documentSearch.trim());
      
      if (visitante && visitante.id) {
        onVisitorFound(visitante);
        onVisitanteSelect(visitante.id);
        showToast(`✅ Visitante encontrado: ${visitante.nome || visitante.designacao_social}`);
        
        // Buscar quantidade de visitas e órgãos visitados
        try {
          const visitas = await getVisitasByVisitante(visitante.id);
          setVisitCount(visitas.length);
          
          // Buscar órgãos visitados
          const orgaos = await getOrgaosVisitadosByVisitante(visitante.id);
          setOrgaosVisitados(orgaos);
        } catch (historyError) {
          // Se falhar ao buscar histórico, não é crítico
          setVisitCount(null);
          setOrgaosVisitados([]);
        }
      } else {
        // Se não encontrou visitante, buscar acompanhantes
        try {
          const acompanhantes = await searchAcompanhanteByDocument(documentSearch.trim());
          
          if (acompanhantes && acompanhantes.length > 0) {
            const acompanhante = acompanhantes[0];
            // Criar um visitante real a partir do acompanhante
            try {
              const novoVisitante = await createVisitanteFromAcompanhante(acompanhante);
              onVisitorFound(novoVisitante);
              onVisitanteSelect(novoVisitante.id);
              if (onVisitorCreated) {
                onVisitorCreated(novoVisitante);
              }
              showToast('✅ Acompanhante encontrado e convertido em visitante!');
              setVisitCount(0); // Novo visitante não tem histórico
              setOrgaosVisitados([]); // Novo visitante não tem órgãos visitados
            } catch (createError: any) {
              const errorMessage = createError.response?.data?.detail || 
                                  createError.response?.data?.message || 
                                  'Erro ao converter acompanhante em visitante';
              showToast(`❌ Erro: ${errorMessage}`);
            }
          } else {
            showToast(`❌ Nenhum visitante ou acompanhante encontrado com o documento: ${documentSearch}`);
            setVisitCount(null);
            setOrgaosVisitados([]);
          }
        } catch (acompanhanteError) {
          showToast(`❌ Nenhum visitante ou acompanhante encontrado com o documento: ${documentSearch}`);
          setVisitCount(null);
          setOrgaosVisitados([]);
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message ||
                          'Erro ao pesquisar visitante/acompanhante';
      showToast(`❌ Erro na pesquisa: ${errorMessage}`);
      setVisitCount(null);
      setOrgaosVisitados([]);
    } finally {
      setSearching(false);
    }
  };


  const selectedVisitante = safeVisitantes.find(v => v.id === selectedVisitanteId);

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Search className="w-5 h-5" />
          Pesquisar Visitante
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Número do documento (visitante ou acompanhante)..."
              value={documentSearch}
              onChange={e => setDocumentSearch(e.target.value)}
              className="max-w-xs"
              disabled={searching}
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleDocumentSearch())}
            />
            {documentSearch && (
              <div className="text-xs text-gray-500">
                Pressione Enter ou clique em "Pesquisar" para buscar
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={handleDocumentSearch} disabled={searching || !documentSearch.trim()}>
              {searching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Pesquisando...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Pesquisar
                </>
              )}
            </Button>
            
            
            
            <Dialog open={showQRReader} onOpenChange={setShowQRReader}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" disabled={searching}>
                  <QrCode className="w-4 h-4 mr-2" />
                  Ler QR Code
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Leitor de QR Code - Documento de Identidade
                  </DialogTitle>
                </DialogHeader>
                <QRCodeReaderFinal
                  onQRCodeScanned={handleQRCodeScanned}
                  onError={(error) => showToast(`Erro no leitor QR: ${error}`)}
                  onClose={() => setShowQRReader(false)}
                  title="Escaneie o QR Code do Documento"
                  description="Posicione o QR Code do BI, Passaporte ou outro documento dentro da área de leitura"
                  showPreview={true}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Exibir visitante selecionado e badge de visitas + todos os dados relevantes */}
        {selectedVisitante && (
          <div className="bg-blue-50 rounded-xl p-4 mb-2 flex flex-col gap-2 shadow">
            <div className="flex items-center gap-4 mb-2">
              <User className="w-6 h-6 text-blue-700" />
              <span className="font-semibold text-blue-900 text-lg">{selectedVisitante.nome || selectedVisitante.designacao_social}</span>
              <Badge variant="secondary">{selectedVisitante.documento_tipo}: {selectedVisitante.documento_numero}</Badge>
            </div>
            {/* Contador visual destacado de visitas */}
            {visitCount !== null && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-700">Quantidade de visitas vinculadas:</span>
                <span className="bg-blue-600 text-white font-bold rounded-full px-4 py-2 text-xl shadow">{visitCount}</span>
                <Badge variant="default">{visitCount} visita(s) já efetuada(s)</Badge>
              </div>
            )}
            
            
            {/* Lista de órgãos visitados */}
            {orgaosVisitados.length > 0 ? (
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-700 font-medium">Órgãos visitados:</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {orgaosVisitados.length} órgão(s) diferente(s)
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {orgaosVisitados.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{item.orgao.nome}</span>
                        {item.orgao.sigla && (
                          <Badge variant="secondary" className="text-xs">{item.orgao.sigla}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{item.quantidade} visita(s)</span>
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                          {item.quantidade}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-sm">
                    ℹ️ Este visitante ainda não possui órgãos visitados registrados
                  </span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
              {selectedVisitante.nacionalidade && <div><b>Nacionalidade:</b> {selectedVisitante.nacionalidade}</div>}
              {selectedVisitante.genero && <div><b>Gênero:</b> {selectedVisitante.genero === 'M' ? 'Masculino' : selectedVisitante.genero === 'F' ? 'Feminino' : 'Outro'}</div>}
              {selectedVisitante.data_nascimento && <div><b>Data de Nascimento:</b> {selectedVisitante.data_nascimento}</div>}
              {selectedVisitante.email && <div><b>Email:</b> {selectedVisitante.email}</div>}
              {selectedVisitante.telefone && <div><b>Telefone:</b> {selectedVisitante.telefone}</div>}
              {selectedVisitante.endereco && <div><b>Endereço:</b> {selectedVisitante.endereco}</div>}
              {selectedVisitante.nif && <div><b>NIF:</b> {selectedVisitante.nif}</div>}
              {selectedVisitante.observacoes && <div><b>Observações:</b> {selectedVisitante.observacoes}</div>}
            </div>
            {selectedVisitante.foto && (
              <div className="mt-2">
                <img src={selectedVisitante.foto} alt="Foto do visitante" className="w-24 h-24 rounded-full object-cover border" />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
