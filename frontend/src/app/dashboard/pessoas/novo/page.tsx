'use client';

import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createVisitante, getVisitantes, updateVisitante } from '@/services/pessoaService';
import { AlertCircle, CheckCircle2, User, FileText, MapPin, Users, QrCode, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import QRCodeReaderFinal from '@/components/ui/QRCodeReaderFinal';
import { QRParsedData } from '@/utils/qrCodeParser';
import { searchEmpresa, searchRepresentante, checkNIFExists } from '@/services/searchEntidadeService';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/SearchableSelect';


// Função para validar documento angolano
const validateAngolanDocument = (documentNumber: string, documentType: string): boolean => {
  if (!documentNumber || !documentType) return false;
  
  const cleanNumber = documentNumber.replace(/\s/g, '').toUpperCase();
  
  switch (documentType) {
    case 'BI':
      // BI angolano: formato geralmente é uma sequência de números e letras
      // Exemplo: 123456789LA041 ou similar
      return /^[0-9]{6,12}[A-Z]{2}[0-9]{3}$/.test(cleanNumber) || 
             /^[0-9]{9,12}$/.test(cleanNumber) ||
             /^[A-Z]{2}[0-9]{6,9}$/.test(cleanNumber);
    
    case 'PASSAPORTE':
      // Passaporte angolano: geralmente começa com letras seguidas de números
      return /^[A-Z]{2}[0-9]{6,8}$/.test(cleanNumber) || 
             /^[0-9]{6,9}$/.test(cleanNumber);
    
    case 'CARTA':
      // Carta de condução angolana
      return /^[0-9]{6,9}$/.test(cleanNumber) || 
             /^[A-Z]{2}[0-9]{6}$/.test(cleanNumber);
    
    case 'CARTAO_RESIDENTE':
      // Cartão de residente: aceitar números/letras com mínimo razoável
      return /^[A-Z0-9]{5,}$/.test(cleanNumber);
    
    case 'OUTRO':
      // Para outros documentos, aceitar qualquer formato não vazio
      return cleanNumber.length >= 3;
    
    default:
      return false;
  }
};

const visitanteSchema = z.object({
  tipo_pessoa: z.enum(['singular', 'coletiva']),
  // Singular
  nome: z.string().optional(),
  genero: z.enum(['M', 'F']).optional(),
  data_nascimento: z.string().optional(),
  // Coletiva - Campos básicos
  designacao_social: z.string().optional(),
  nif: z.string().optional(),
  representante: z.string().optional(),
  // Coletiva - Campos adicionais
  tipo_empresa: z.string().optional(),
  setor_atividade: z.string().optional(),
  website: z.string().optional(),
  data_constituicao: z.string().optional(),
  cargo_representante: z.string().optional(),
  // Documento
  documento_tipo: z.enum(['BI', 'PASSAPORTE', 'CARTA', 'CARTAO_RESIDENTE', 'OUTRO']).optional(),
  documento_numero: z.string().optional(),
  documento_emissao: z.string().optional(),
  documento_validade: z.string().optional(),
  provincia_nascimento: z.string().optional(),
  estado_civil: z.string().optional(),
  // Contact
  email: z.string().email('Email inválido.').optional().or(z.literal('')),
  telefone: z.string().min(1, 'Telefone é obrigatório.')
    .regex(/^\+244\s?9\d{2}-\d{3}-\d{3}$/, 'Telefone deve estar no formato +244 9xx-xxx-xxx'),
  nacionalidade: z.string().optional(),
  // Endereço BI/Documento
  provincia_bi: z.string().optional(),
  municipio_bi: z.string().optional(),
  bairro_bi: z.string().optional(),
  rua_bi: z.string().optional(),
  numero_bi: z.string().optional(),
  complemento_bi: z.string().optional(),
  // Endereço Atual
  provincia_atual: z.string().optional(),
  municipio_atual: z.string().optional(),
  bairro_atual: z.string().optional(),
  rua_atual: z.string().optional(),
  numero_atual: z.string().optional(),
  complemento_atual: z.string().optional(),
  // Legacy
  endereco: z.string().optional(),
}).refine(
  data => {
    if (data.tipo_pessoa === 'singular') {
      return !!data.nome;
    }
    return true;
  }, {
    message: 'O nome é obrigatório para pessoa singular.',
    path: ['nome'],
  }
).refine(
  async (data) => {
    if (data.email) {
      const response = await fetch('/api/checar-email-unico-visitante?email=' + data.email);
      if (response.ok) {
        const r = await response.json();
        return r.unique === true || r.unique === 'true';
      }
    }
    return true;
  }, {
    message: 'Email já está em uso.',
    path: ['email'],
  }
).refine(
  data => {
    if (data.documento_tipo && data.documento_numero) {
      return validateAngolanDocument(data.documento_numero, data.documento_tipo);
    }
    return true;
  }, {
    message: 'Número de documento inválido para o formato angolano.',
    path: ['documento_numero'],
  }
);

type VisitanteFormValues = z.infer<typeof visitanteSchema>;

export default function NovaPessoaPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VisitanteFormValues>({
    resolver: zodResolver(visitanteSchema),
  });

  const [visitantes, setVisitantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState<{ nome?: string | null } | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [showQRReader, setShowQRReader] = useState(false);

  // Função de teste para validação de datas (disponível no console)
  const testDateValidation = () => {
    const testDates = [
      '15/03/2020',
      '15-03-2020',
      '15.03.2020',
      '15032020',
      '2020-03-15',
      '20200315',
      '2020/03/15',
      'invalid-date',
      '',
      null,
      undefined,
      '32/13/2020', // Data inválida
      '2020-02-30', // Data inválida
      '2020-13-01', // Mês inválido
      '2020-00-01', // Mês inválido
      '2020-01-00', // Dia inválido
      '2020-01-32', // Dia inválido
    ];
    
    console.log('🧪 Testando validação de datas:');
    
    const isValidDate = (dateStr: string): boolean => {
      if (!dateStr || dateStr.trim() === '') return false;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return false;
      const year = date.getFullYear();
      if (year < 1900 || year > 2100) return false;
      const convertedBack = date.toISOString().split('T')[0];
      return convertedBack === dateStr;
    };
    
    const validateAndFormatDate = (dateStr: string | undefined | null): string | undefined => {
      if (!dateStr || dateStr.trim() === '') return undefined;
      
      const cleanDate = dateStr.trim();
      
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        return isValidDate(cleanDate) ? cleanDate : undefined;
      }
      
      let formatted: string | undefined;
      
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleanDate)) {
        const [day, month, year] = cleanDate.split('/');
        formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(cleanDate)) {
        const [day, month, year] = cleanDate.split('-');
        formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(cleanDate)) {
        const [day, month, year] = cleanDate.split('.');
        formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else if (/^\d{8}$/.test(cleanDate)) {
        const day = cleanDate.substring(0, 2);
        const month = cleanDate.substring(2, 4);
        const year = cleanDate.substring(4, 8);
        formatted = `${year}-${month}-${day}`;
      } else if (/^\d{8}$/.test(cleanDate) && cleanDate.substring(0, 4) > '1900') {
        const year = cleanDate.substring(0, 4);
        const month = cleanDate.substring(4, 6);
        const day = cleanDate.substring(6, 8);
        formatted = `${year}-${month}-${day}`;
      } else {
        try {
          const parsedDate = new Date(cleanDate);
          if (!isNaN(parsedDate.getTime())) {
            formatted = parsedDate.toISOString().split('T')[0];
          }
        } catch (error) {
          // Ignore
        }
      }
      
      return formatted && isValidDate(formatted) ? formatted : undefined;
    };
    
    testDates.forEach(date => {
      const result = validateAndFormatDate(date);
      const isValid = result ? isValidDate(result) : false;
      console.log(`Input: "${date}" -> Output: "${result}" (Válida: ${isValid})`);
    });
  };

  // Tornar a função disponível globalmente para debug
  if (typeof window !== 'undefined') {
    (window as any).testDateValidation = testDateValidation;
    console.log('🔧 Função de teste disponível: testDateValidation()');
  }

  const onSubmit = async (data: VisitanteFormValues) => {
    setLoading(true);
    try {
      // Função para validar se uma data é válida
      const isValidDate = (dateStr: string): boolean => {
        if (!dateStr || dateStr.trim() === '') return false;
        
        // Verificar se está no formato YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
        
        // Verificar se a data é válida
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return false;
        
        // Verificar se a data não é muito antiga ou futura
        const year = date.getFullYear();
        if (year < 1900 || year > 2100) return false;
        
        // Verificar se a data convertida de volta é igual à original
        const convertedBack = date.toISOString().split('T')[0];
        return convertedBack === dateStr;
      };

      // Função para validar e formatar datas
      const validateAndFormatDate = (dateStr: string | undefined): string | undefined => {
        console.log('🔍 Validando data:', dateStr);
        
        if (!dateStr || dateStr.trim() === '') {
          console.log('✅ Data vazia, retornando undefined');
          return undefined;
        }
        
        const cleanDate = dateStr.trim();
        console.log('🔍 Data limpa:', cleanDate);
        
        // Se já está no formato YYYY-MM-DD, validar e retornar
        if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
          if (isValidDate(cleanDate)) {
            console.log('✅ Data já no formato YYYY-MM-DD e válida:', cleanDate);
            return cleanDate;
          } else {
            console.warn('⚠️ Data no formato YYYY-MM-DD mas inválida:', cleanDate);
            return undefined;
          }
        }
        
        let formatted: string | undefined;
        
        // Se está no formato DD/MM/YYYY, converter para YYYY-MM-DD
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleanDate)) {
          const [day, month, year] = cleanDate.split('/');
          formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          console.log('✅ Data convertida de DD/MM/YYYY:', cleanDate, '->', formatted);
        }
        // Se está no formato DD-MM-YYYY, converter para YYYY-MM-DD
        else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(cleanDate)) {
          const [day, month, year] = cleanDate.split('-');
          formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          console.log('✅ Data convertida de DD-MM-YYYY:', cleanDate, '->', formatted);
        }
        // Se está no formato DD.MM.YYYY, converter para YYYY-MM-DD
        else if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(cleanDate)) {
          const [day, month, year] = cleanDate.split('.');
          formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          console.log('✅ Data convertida de DD.MM.YYYY:', cleanDate, '->', formatted);
        }
        // Se está no formato DDMMYYYY (8 dígitos), converter para YYYY-MM-DD
        else if (/^\d{8}$/.test(cleanDate)) {
          const day = cleanDate.substring(0, 2);
          const month = cleanDate.substring(2, 4);
          const year = cleanDate.substring(4, 8);
          formatted = `${year}-${month}-${day}`;
          console.log('✅ Data convertida de DDMMYYYY:', cleanDate, '->', formatted);
        }
        // Se está no formato YYYYMMDD (8 dígitos), converter para YYYY-MM-DD
        else if (/^\d{8}$/.test(cleanDate) && cleanDate.substring(0, 4) > '1900') {
          const year = cleanDate.substring(0, 4);
          const month = cleanDate.substring(4, 6);
          const day = cleanDate.substring(6, 8);
          formatted = `${year}-${month}-${day}`;
          console.log('✅ Data convertida de YYYYMMDD:', cleanDate, '->', formatted);
        }
        // Tentar usar Date.parse para formatos mais complexos
        else {
          try {
            const parsedDate = new Date(cleanDate);
            if (!isNaN(parsedDate.getTime())) {
              formatted = parsedDate.toISOString().split('T')[0];
              console.log('✅ Data convertida via Date.parse:', cleanDate, '->', formatted);
            }
          } catch (error) {
            console.warn('⚠️ Erro ao fazer parse da data:', cleanDate, error);
          }
        }
        
        // Validar a data formatada
        if (formatted && isValidDate(formatted)) {
          console.log('✅ Data formatada e válida:', formatted);
          return formatted;
        } else {
          console.warn('⚠️ Data formatada mas inválida:', formatted);
          return undefined;
        }
      };
      
      // Converter nome, designação social e nacionalidade para maiúsculo
      // E validar/formatar todas as datas
      let dataToSave: any = {
        ...data,
        nome: data.nome ? data.nome.toUpperCase().trim() : data.nome,
        designacao_social: data.designacao_social ? data.designacao_social.toUpperCase().trim() : data.designacao_social,
        nacionalidade: data.nacionalidade ? data.nacionalidade.toUpperCase().trim() : data.nacionalidade,
        data_nascimento: validateAndFormatDate(data.data_nascimento),
        documento_emissao: validateAndFormatDate(data.documento_emissao),
        documento_validade: validateAndFormatDate(data.documento_validade),
      };

      // Handle Address Construction
      const addressParts: string[] = [];
      if (sameAddress) {
        if (data.provincia_bi) addressParts.push(data.provincia_bi);
        if (data.municipio_bi) addressParts.push(data.municipio_bi);
        if (data.bairro_bi) addressParts.push(data.bairro_bi);
        if (data.rua_bi) addressParts.push(`Rua ${data.rua_bi}`);
        if (data.numero_bi) addressParts.push(`Nº ${data.numero_bi}`);
        if (data.complemento_bi) addressParts.push(data.complemento_bi);
      } else {
        if (data.provincia_atual) addressParts.push(data.provincia_atual);
        if (data.municipio_atual) addressParts.push(data.municipio_atual);
        if (data.bairro_atual) addressParts.push(data.bairro_atual);
        if (data.rua_atual) addressParts.push(`Rua ${data.rua_atual}`);
        if (data.numero_atual) addressParts.push(`Nº ${data.numero_atual}`);
      }
      if (addressParts.length > 0) {
          dataToSave.endereco = addressParts.join(', ');
      }

      // Handle New Representative Creation OR Update
      if (selectedEntityType === 'coletiva' && customRepMode) {
          // Validate required fields for Rep
          if (!newRepData.nome) {
              toast.error('O nome do representante é obrigatório');
              setLoading(false);
              return;
          }
          
          try {
             const repPayload = {
                 tipo_pessoa: 'singular',
                 nome: newRepData.nome.toUpperCase(),
                 documento_tipo: newRepData.documento_tipo,
                 documento_numero: newRepData.documento_numero,
                 email: newRepData.email,
                 telefone: newRepData.telefone,
                 // cargo: newRepData.cargo, // Se o backend aceitar campo cargo direto
                 observacoes: newRepData.cargo ? `Cargo: ${newRepData.cargo}` : undefined,
                 ativo: true,
                 registado_por: 1 
             };
             
             let repId = newRepData.id;

             if (repId) {
                // UPDATE existing representative
                console.log('Atualizando representante:', repId, repPayload);
                // Remove registado_por for update usually
                const { registado_por, ...updatePayload } = repPayload;
                await updateVisitante(repId, updatePayload as any);
                toast.success('Representante atualizado com sucesso!');
             } else {
                // CREATE new representative
                console.log('Criando representante:', repPayload);
                const repResponse = await createVisitante(repPayload as any);
                if (repResponse && repResponse.id) {
                    repId = repResponse.id;
                    toast.success('Representante criado com sucesso!');
                } else {
                    throw new Error('Falha ao criar representante');
                }
             }
             
             dataToSave.representante = repId;
          } catch (err) {
              console.error('Erro ao processar representante:', err);
              toast.error('Erro ao salvar representante legal. Verifique os dados.');
              setLoading(false);
              return;
          }
      }

      // Remover campos de data que são undefined ou string vazia
      if (dataToSave.data_nascimento === undefined || dataToSave.data_nascimento === '') {
        delete dataToSave.data_nascimento;
      }
      if (dataToSave.documento_emissao === undefined || dataToSave.documento_emissao === '') {
        delete dataToSave.documento_emissao;
      }
      if (dataToSave.documento_validade === undefined || dataToSave.documento_validade === '') {
        delete dataToSave.documento_validade;
      }
      
      console.log('💾 Dados originais do formulário:', {
        data_nascimento: data.data_nascimento,
        documento_emissao: data.documento_emissao,
        documento_validade: data.documento_validade
      });
      
      console.log('💾 Dados processados para envio:', {
        nome: dataToSave.nome,
        designacao_social: dataToSave.designacao_social,
        nacionalidade: dataToSave.nacionalidade,
        data_nascimento: dataToSave.data_nascimento,
        documento_emissao: dataToSave.documento_emissao,
        documento_validade: dataToSave.documento_validade,
        endereco: dataToSave.endereco,
        representante: dataToSave.representante
      });
      
      console.log('💾 Dados completos para envio:', dataToSave);
      
      // Log específico dos campos de data que serão enviados
      console.log('📅 Campos de data que serão enviados:', {
        'data_nascimento': dataToSave.data_nascimento,
        'documento_emissao': dataToSave.documento_emissao,
        'documento_validade': dataToSave.documento_validade,
        'tipos': {
          'data_nascimento': typeof dataToSave.data_nascimento,
          'documento_emissao': typeof dataToSave.documento_emissao,
          'documento_validade': typeof dataToSave.documento_validade
        }
      });
      
      const createdVisitante = await createVisitante(dataToSave);
      setShowAlert({ nome: dataToSave.nome || dataToSave.designacao_social || null });
      setTimeout(() => {
        setShowAlert(null);
        // Redirecionar com os dados do visitante criado para o formulário de visitas
        if (createdVisitante && createdVisitante.id) {
          router.push(`/dashboard/visitas/novo?visitanteId=${createdVisitante.id}&autoSelect=true`);
        } else {
          router.push('/dashboard/visitas/novo');
        }
      }, 2500);
    } catch (error: any) {
      let errorMsg = 'Erro ao adicionar pessoa.';
      if (error?.response?.data) {
        const errData = error.response.data;
        if (typeof errData === 'object') {
          errorMsg = Object.entries(errData)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ');
        } else if (typeof errData === 'string') {
          errorMsg = errData;
        }
        
        // Check for specific duplicate document error
        if (JSON.stringify(errData).toLowerCase().includes('documento numero already exists')) {
            errorMsg = 'Já existe uma pessoa cadastrada com este número de documento. Por favor, pesquise antes de cadastrar.';
        }
      }
      setShowToast(errorMsg);
      setTimeout(() => setShowToast(null), 3500);
    } finally {
      setLoading(false);
    }
  };

  // Carregar visitantes para opção de representante
  useEffect(() => {
    getVisitantes()
      .then(data => {
        // Garantir que sempre seja um array
        setVisitantes(Array.isArray(data) ? data : []);
      })
      .catch(error => {
        console.error('Erro ao carregar visitantes:', error);
        setVisitantes([]); // Em caso de erro, definir como array vazio
      });
  }, []);

  const handleQRCodeScanned = (qrData: QRParsedData) => {
    try {
      console.log('📋 Dados recebidos do QR Code:', qrData);
      
      // Função auxiliar para formatar data para o formato esperado pelo formulário (YYYY-MM-DD)
      const formatDateForForm = (dateStr: string): string => {
        if (!dateStr || dateStr.trim() === '') return '';
        
        const cleanDate = dateStr.trim();
        console.log('🔍 Formatando data para formulário:', cleanDate);
        
        // Se já está no formato YYYY-MM-DD, retornar como está
        if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
          console.log('✅ Data já no formato correto:', cleanDate);
          return cleanDate;
        }
        
        // Se está no formato DD/MM/YYYY, converter para YYYY-MM-DD
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleanDate)) {
          const [day, month, year] = cleanDate.split('/');
          const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          console.log('✅ Data convertida de DD/MM/YYYY:', cleanDate, '->', formatted);
          return formatted;
        }
        
        // Se está no formato DD-MM-YYYY, converter para YYYY-MM-DD
        if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(cleanDate)) {
          const [day, month, year] = cleanDate.split('-');
          const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          console.log('✅ Data convertida de DD-MM-YYYY:', cleanDate, '->', formatted);
          return formatted;
        }
        
        // Se está no formato DD.MM.YYYY, converter para YYYY-MM-DD
        if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(cleanDate)) {
          const [day, month, year] = cleanDate.split('.');
          const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          console.log('✅ Data convertida de DD.MM.YYYY:', cleanDate, '->', formatted);
          return formatted;
        }
        
        // Se está no formato DDMMYYYY (8 dígitos), converter para YYYY-MM-DD
        if (/^\d{8}$/.test(cleanDate)) {
          const day = cleanDate.substring(0, 2);
          const month = cleanDate.substring(2, 4);
          const year = cleanDate.substring(4, 8);
          const formatted = `${year}-${month}-${day}`;
          console.log('✅ Data convertida de DDMMYYYY:', cleanDate, '->', formatted);
          return formatted;
        }
        
        // Se está no formato YYYYMMDD (8 dígitos), converter para YYYY-MM-DD
        if (/^\d{8}$/.test(cleanDate) && cleanDate.substring(0, 4) > '1900') {
          const year = cleanDate.substring(0, 4);
          const month = cleanDate.substring(4, 6);
          const day = cleanDate.substring(6, 8);
          const formatted = `${year}-${month}-${day}`;
          console.log('✅ Data convertida de YYYYMMDD:', cleanDate, '->', formatted);
          return formatted;
        }
        
        // Tentar usar Date.parse para formatos mais complexos
        try {
          const parsedDate = new Date(cleanDate);
          if (!isNaN(parsedDate.getTime())) {
            const formatted = parsedDate.toISOString().split('T')[0];
            console.log('✅ Data convertida via Date.parse:', cleanDate, '->', formatted);
            return formatted;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao fazer parse da data:', cleanDate, error);
        }
        
        console.warn('⚠️ Formato de data não reconhecido, retornando string vazia:', cleanDate);
        return ''; // Retornar string vazia se não conseguir formatar
      };

      // Preencher automaticamente os campos do formulário
      console.log('🔄 Preenchendo campos do formulário...');
      
      // Nome completo
      if (qrData.nome_completo) {
        const nomeFormatado = qrData.nome_completo.toUpperCase().trim();
        setValue('nome', nomeFormatado);
        console.log('✅ Nome preenchido:', nomeFormatado);
      }
      
      // Número do documento
      if (qrData.documento_numero) {
        setValue('documento_numero', qrData.documento_numero.trim());
        console.log('✅ Número do documento preenchido:', qrData.documento_numero);
      }
      
      // Tipo do documento
      if (qrData.documento_tipo) {
        setValue('documento_tipo', qrData.documento_tipo);
        console.log('✅ Tipo do documento preenchido:', qrData.documento_tipo);
      }
      
      // Data de nascimento (formatada)
      if (qrData.data_nascimento) {
        const dataFormatada = formatDateForForm(qrData.data_nascimento);
        setValue('data_nascimento', dataFormatada);
        console.log('✅ Data de nascimento preenchida:', qrData.data_nascimento, '->', dataFormatada);
      }
      
      // Nacionalidade
      if (qrData.nacionalidade) {
        const nacionalidadeFormatada = qrData.nacionalidade.toUpperCase().trim();
        setValue('nacionalidade', nacionalidadeFormatada);
        console.log('✅ Nacionalidade preenchida:', nacionalidadeFormatada);
      }
      
      // Gênero
      if (qrData.genero) {
        // Aceitar apenas M ou F
        const g = qrData.genero === 'M' || qrData.genero === 'F' ? qrData.genero : undefined;
        if (g) setValue('genero', g);
        console.log('✅ Gênero preenchido:', qrData.genero);
      }
      
      // Data de validade do documento (formatada)
      if (qrData.data_validade) {
        const dataValidadeFormatada = formatDateForForm(qrData.data_validade);
        setValue('documento_validade', dataValidadeFormatada);
        console.log('✅ Data de validade preenchida:', qrData.data_validade, '->', dataValidadeFormatada);
      }
      
      // Data de emissão do documento (formatada)
      if (qrData.data_emissao) {
        const dataEmissaoFormatada = formatDateForForm(qrData.data_emissao);
        setValue('documento_emissao', dataEmissaoFormatada);
        console.log('✅ Data de emissão preenchida:', qrData.data_emissao, '->', dataEmissaoFormatada);
      }
      
      // Província de nascimento
      if (qrData.provincia_nascimento) {
        const provinciaFormatada = qrData.provincia_nascimento.toUpperCase().trim();
        setValue('provincia_nascimento', provinciaFormatada);
        console.log('✅ Província de nascimento preenchida:', provinciaFormatada);
      }
      
      // Estado civil
      if (qrData.estado_civil) {
        const estadoCivilFormatado = qrData.estado_civil.toUpperCase().trim();
        setValue('estado_civil', estadoCivilFormatado);
        console.log('✅ Estado civil preenchido:', estadoCivilFormatado);
      }
      
      // NIF (se disponível)
      if (qrData.nif) {
        setValue('nif', qrData.nif.trim());
        console.log('✅ NIF preenchido:', qrData.nif);
      }
      
      // Email (se disponível)
      if (qrData.email) {
        setValue('email', qrData.email.trim());
        console.log('✅ Email preenchido:', qrData.email);
      }
      
      // Telefone (se disponível)
      if (qrData.telefone) {
        setValue('telefone', qrData.telefone.trim());
        console.log('✅ Telefone preenchido:', qrData.telefone);
      }

      // Definir como entidade singular por padrão
      setValue('tipo_pessoa', 'singular');
      setSelectedEntityType('singular');
      console.log('✅ Tipo de entidade definido como: singular');

      // Fechar o leitor QR
      setShowQRReader(false);
      
      // Log de resumo dos dados preenchidos
      console.log('📊 Resumo dos dados preenchidos:', {
        nome: qrData.nome_completo,
        documento_numero: qrData.documento_numero,
        documento_tipo: qrData.documento_tipo,
        data_nascimento: qrData.data_nascimento,
        nacionalidade: qrData.nacionalidade,
        genero: qrData.genero,
        data_validade: qrData.data_validade,
        data_emissao: qrData.data_emissao,
        provincia_nascimento: qrData.provincia_nascimento,
        estado_civil: qrData.estado_civil,
        nif: qrData.nif,
        email: qrData.email,
        telefone: qrData.telefone
      });
      
      toast.success('Dados do QR Code preenchidos automaticamente!');
      
    } catch (error) {
      console.error('❌ Erro ao processar dados do QR Code:', error);
      toast.error('Erro ao processar dados do QR Code');
    }
  };

  const [activeTab, setActiveTab] = useState('dados');
  const [selectedEntityType, setSelectedEntityType] = useState<'singular' | 'coletiva' | null>(null);

  // Search States
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [companySearchResults, setCompanySearchResults] = useState<any[]>([]);
  const [showCompanyResults, setShowCompanyResults] = useState(false);
  const [isSearchingCompany, setIsSearchingCompany] = useState(false);

  const [repSearchQuery, setRepSearchQuery] = useState('');
  const [repSearchResults, setRepSearchResults] = useState<any[]>([]);
  const [showRepResults, setShowRepResults] = useState(false);
  const [isSearchingRep, setIsSearchingRep] = useState(false);
  
  // Custom Rep Mode (for creating new vs selecting existing)
  const [customRepMode, setCustomRepMode] = useState(false);
  
  // Custom Rep Data State
  const [newRepData, setNewRepData] = useState({
    id: '',
    nome: '',
    cargo: '',
    email: '',
    telefone: '',
    documento_numero: '',
    documento_tipo: 'BI'
  });
  
  // Address State
  const [sameAddress, setSameAddress] = useState(true);

  // Debounce company search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (companySearchQuery && companySearchQuery.length >= 2) {
        setIsSearchingCompany(true);
        try {
            const results = await searchEmpresa(companySearchQuery);
            setCompanySearchResults(results);
            setShowCompanyResults(true);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearchingCompany(false);
        }
      } else {
        setCompanySearchResults([]);
        setShowCompanyResults(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [companySearchQuery]);

  // Debounce representative search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (repSearchQuery && repSearchQuery.length >= 2) {
        setIsSearchingRep(true);
        try {
            const results = await searchRepresentante(repSearchQuery);
            setRepSearchResults(results);
            setShowRepResults(true);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearchingRep(false);
        }
      } else {
        setRepSearchResults([]);
        setShowRepResults(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [repSearchQuery]);
  
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Adicionar Nova Entidade</h1>
      
      {/* Card destacado para leitura QR Code - apenas para entidade singular */}
      {selectedEntityType === 'singular' && (
        <Card className="mb-6 border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <QrCode className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Leitura Rápida com QR Code</h3>
                  <p className="text-blue-800 text-sm">
                    Escaneie o QR Code do documento de identidade para preencher automaticamente os dados
                  </p>
                </div>
              </div>
              <Dialog open={showQRReader} onOpenChange={setShowQRReader}>
                <DialogTrigger asChild>
                  <Button 
                    type="button" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-medium"
                    size="lg"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Iniciar Leitura QR
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
                    onError={(error) => toast.error(`Erro no leitor QR: ${error}`)}
                    onClose={() => setShowQRReader(false)}
                    title="Escaneie o QR Code do Documento"
                    description="Posicione o QR Code do BI, Passaporte ou outro documento dentro da área de leitura"
                    showPreview={true}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Cadastro de Entidade</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Seleção do tipo de entidade */}
            {!selectedEntityType && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecione o tipo de entidade</h3>
                  <p className="text-gray-600">Escolha o tipo de entidade que deseja cadastrar</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Entidade Singular */}
                  <div 
                    className="border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200"
                    onClick={() => {
                      setSelectedEntityType('singular');
                      setValue('tipo_pessoa', 'singular');
                    }}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Entidade Singular</h4>
                      <p className="text-gray-600 text-sm mb-3">Pessoa física individual</p>
                      <div className="text-xs text-gray-500">
                        <p>• Nome completo</p>
                        <p>• Documento de identidade</p>
                        <p>• Dados pessoais</p>
                      </div>
                    </div>
                  </div>

                  {/* Entidade Coletiva */}
                  <div 
                    className="border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:border-green-300 hover:bg-green-50/30 transition-all duration-200"
                    onClick={() => {
                      setSelectedEntityType('coletiva');
                      setValue('tipo_pessoa', 'coletiva');
                    }}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-green-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Entidade Coletiva</h4>
                      <p className="text-gray-600 text-sm mb-3">Empresa ou instituição</p>
                      <div className="text-xs text-gray-500">
                        <p>• Designação social</p>
                        <p>• NIF</p>
                        <p>• Representante legal</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Formulário condicional baseado no tipo selecionado */}
            {selectedEntityType && (
              <>
                {/* Botão para voltar à seleção */}
                <div className="flex justify-start mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedEntityType(null);
                      setValue('tipo_pessoa', undefined as any);
                    }}
                    className="text-gray-600"
                  >
                    ← Alterar tipo de entidade
                  </Button>
                </div>

                {/* Abas do formulário */}
                <div className="mb-4">
                  <div className="flex gap-2 border-b">
                    {selectedEntityType === 'singular' ? (
                      // Abas para entidade singular
                      [
                        { tab: 'dados', label: 'Dados Principais', icon: User },
                        { tab: 'documentos', label: 'Documentos', icon: FileText },
                        { tab: 'endereco', label: 'Endereço', icon: MapPin }
                      ].map(({ tab, label, icon: Icon }) => (
                        <button
                          key={tab}
                          type="button"
                          className={`px-4 py-2 font-medium border-b-2 flex items-center gap-2 transition-all duration-150 ${activeTab === tab ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-primary hover:bg-accent/10'}`}
                          onClick={() => setActiveTab(tab)}
                          aria-current={activeTab === tab ? 'page' : undefined}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </button>
                      ))
                    ) : (
                      // Abas para entidade coletiva
                      [
                        { tab: 'empresa', label: 'Dados da Empresa', icon: Users },
                        { tab: 'representante', label: 'Representante Legal', icon: User },
                        { tab: 'endereco', label: 'Endereço', icon: MapPin }
                      ].map(({ tab, label, icon: Icon }) => (
                        <button
                          key={tab}
                          type="button"
                          className={`px-4 py-2 font-medium border-b-2 flex items-center gap-2 transition-all duration-150 ${activeTab === tab ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-primary hover:bg-accent/10'}`}
                          onClick={() => setActiveTab(tab)}
                          aria-current={activeTab === tab ? 'page' : undefined}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </button>
                      ))
                    )}
                  </div>
                </div>
                {/* Aba de Dados Principais (Singular) ou Dados da Empresa (Coletiva) */}
                {(activeTab === 'dados' || activeTab === 'empresa') && (
                  <div className="space-y-4 animate-fade-in">
                    
                    {/* Search Component for Company */}
                    {selectedEntityType === 'coletiva' && (
                        <div className="relative mb-6 p-4 bg-gray-50 border rounded-lg">
                            <Label className="mb-2 block font-medium">Verificar Empresa Existente</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input 
                                        placeholder="Pesquisar por Nome, NIF ou Email..." 
                                        value={companySearchQuery}
                                        onChange={(e) => setCompanySearchQuery(e.target.value)}
                                        className="w-full"
                                    />
                                    {isSearchingCompany && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Dropdown Results */}
                            {showCompanyResults && companySearchResults.length > 0 && (
                                <div className="absolute z-10 w-full max-w-[calc(100%-2rem)] bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-auto left-4">
                                    {companySearchResults.map((emp) => (
                                        <div 
                                            key={emp.id} 
                                            className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-0"
                                            onClick={() => {
                                                setValue('designacao_social', emp.designacao_social || emp.nome);
                                                setValue('nif', emp.nif);
                                                setValue('email', emp.email);
                                                setValue('telefone', emp.telefone);
                                                setValue('website', emp.website);
                                                if (emp.tipo_empresa) setValue('tipo_empresa', emp.tipo_empresa);
                                                if (emp.setor_atividade) setValue('setor_atividade', emp.setor_atividade);
                                                
                                                setShowCompanyResults(false);
                                                setCompanySearchQuery('');
                                                toast.success('Dados da empresa carregados!');
                                            }}
                                        >
                                            <p className="font-medium">{emp.designacao_social || emp.nome}</p>
                                            <div className="flex gap-2 text-xs text-gray-500">
                                                <span>NIF: {emp.nif || 'N/A'}</span>
                                                <span>•</span>
                                                <span>{emp.email || 'Sem email'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {showCompanyResults && companySearchResults.length === 0 && companySearchQuery.length >= 2 && !isSearchingCompany && (
                                <div className="absolute z-10 w-full max-w-[calc(100%-2rem)] bg-white border rounded-md shadow-lg mt-1 p-3 text-center text-gray-500 left-4 text-sm">
                                    Nenhuma empresa encontrada com estes dados.
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Entidade Singular Fields */}
                      {selectedEntityType === 'singular' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="nome">Nome Completo *</Label>
                            <Input id="nome" {...register('nome')} autoFocus placeholder="Digite o nome completo" />
                            {errors.nome && <p className="text-sm text-red-500">{errors.nome.message as string}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="genero">Gênero</Label>
                            <Select value={watch('genero')} onValueChange={value => { setValue('genero', value as 'M' | 'F'); }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o gênero" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="M">Masculino</SelectItem>
                                <SelectItem value="F">Feminino</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                            <Input id="data_nascimento" type="date" {...register('data_nascimento')} />
                          </div>
                        </>
                      )}
                      
                      {/* Entidade Coletiva Fields */}
                      {selectedEntityType === 'coletiva' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="designacao_social">Designação Social *</Label>
                            <Input id="designacao_social" {...register('designacao_social')} autoFocus placeholder="Nome da empresa ou instituição" />
                            {errors.designacao_social && <p className="text-sm text-red-500">{errors.designacao_social.message as string}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="nif">NIF</Label>
                            <Input 
                                id="nif" 
                                {...register('nif', { 
                                    onBlur: async (e) => {
                                        if (e.target.value?.length > 3) {
                                            const exists = await checkNIFExists(e.target.value);
                                            if(exists) toast.warning('Atenção: Este NIF já está cadastrado no sistema.');
                                        }
                                    }
                                })} 
                                placeholder="Número de Identificação Fiscal" 
                            />
                            {errors.nif && <p className="text-sm text-red-500">{errors.nif.message as string}</p>}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="tipo_empresa">Tipo de Empresa</Label>
                            <Select onValueChange={value => setValue('tipo_empresa', value)} value={watch('tipo_empresa') || ''}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Privada">Privada</SelectItem>
                                <SelectItem value="Publica">Pública</SelectItem>
                                <SelectItem value="Mista">Mista</SelectItem>
                                <SelectItem value="ONG">ONG</SelectItem>
                                <SelectItem value="Outro">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="setor_atividade">Setor de Atividade</Label>
                            <Input id="setor_atividade" {...register('setor_atividade')} placeholder="Ex: Tecnologia, Saúde, Comércio..." />
                          </div>
                           <div className="space-y-2">
                            <Label htmlFor="website">Website (Opcional)</Label>
                            <Input id="website" {...register('website')} placeholder="https://www.exemplo.com" />
                          </div>
                           <div className="space-y-2">
                            <Label htmlFor="data_constituicao">Data de Constituição (Opcional)</Label>
                            <Input id="data_constituicao" type="date" {...register('data_constituicao')} />
                          </div>
                        </>
                      )}
                      
                      {/* Common Fields */}
                      <div className="space-y-2">
                        <Label htmlFor="email">Email {selectedEntityType === 'coletiva' ? 'Empresarial' : ''}</Label>
                        <Input id="email" type="email" {...register('email')} placeholder="email@exemplo.com" />
                        {errors.email && <p className="text-sm text-red-500">{errors.email.message as string}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone {selectedEntityType === 'coletiva' ? 'Empresarial' : ''} *</Label>
                        <Input
                          id="telefone"
                          {...register('telefone', {
                            onChange: (e) => {
                                const raw = e.target.value.replace(/[^0-9+]/g, '');
                                let withCc = raw.startsWith('+244') ? raw : `+244${raw.replace(/^\+?244?/, '')}`;
                                const digits = withCc.replace(/\+244/, '').replace(/\D/g, '');
                                const d = digits.slice(0, 9);
                                const formatted = d.length > 0
                                  ? `+244 ${d[0] || ''}${d[1] || ''}${d[2] || ''}` +
                                    (d.length > 3 ? `-${d.slice(3, 6)}` : '') +
                                    (d.length > 6 ? `-${d.slice(6, 9)}` : '')
                                  : '+244 ';
                                setValue('telefone', formatted, { shouldValidate: true });
                            }
                          })}
                          placeholder="+244 9xx-xxx-xxx"
                        />
                        {errors.telefone && <p className="text-sm text-red-500">{errors.telefone.message as string}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nacionalidade">Nacionalidade</Label>
                        <select
                          id="nacionalidade"
                          {...register('nacionalidade')}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          defaultValue={watch('nacionalidade') || 'Angola'}
                        >
                          <option value="Angola">Angola</option>
                          <option value="Brasil">Brasil</option>
                          <option value="Portugal">Portugal</option>
                          <option value="Moçambique">Moçambique</option>
                          <option value="Cabo Verde">Cabo Verde</option>
                          <option value="Guiné-Bissau">Guiné-Bissau</option>
                          <option value="São Tomé e Príncipe">São Tomé e Príncipe</option>
                          <option value="Timor-Leste">Timor-Leste</option>
                          <option value="Estados Unidos">Estados Unidos</option>
                          <option value="França">França</option>
                          <option value="China">China</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'representante' && selectedEntityType === 'coletiva' && (
                  <div className="space-y-6 animate-fade-in">
                    
                    {/* Toggle Mode */}
                    <div className="flex gap-4 p-1 bg-gray-100/50 rounded-lg inline-flex">
                        <Button 
                            type="button" 
                            size="sm"
                            variant={!customRepMode ? 'default' : 'ghost'}
                            onClick={() => setCustomRepMode(false)}
                        >
                            <User className="w-4 h-4 mr-2" />
                            Selecionar Existente
                        </Button>
                        <Button 
                            type="button" 
                            size="sm"
                            variant={customRepMode ? 'default' : 'ghost'}
                            onClick={() => setCustomRepMode(true)}
                        >
                            <Users className="w-4 h-4 mr-2" />
                            Criar Novo
                        </Button>
                    </div>

                    {!customRepMode ? (
                        <div className="space-y-4 max-w-2xl">
                            <Label>Pesquisar Representante Legal</Label>
                            <div className="relative">
                                <div className="flex gap-2">
                                     <Input 
                                        placeholder="Pesquisar por nome do representante..."
                                        value={repSearchQuery}
                                        onChange={(e) => setRepSearchQuery(e.target.value)}
                                        className="w-full"
                                    />
                                     {isSearchingRep && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                        </div>
                                    )}
                                </div>
                               
                                {showRepResults && repSearchResults.length > 0 && (
                                    <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-auto left-0">
                                        {repSearchResults.map((rep) => (
                                            <div 
                                                key={rep.id} 
                                                className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-0"
                                                onClick={() => {
                                                    // Populate form with existing data and switch to edit mode
                                                    setNewRepData({
                                                      id: rep.id,
                                                      nome: rep.nome || '',
                                                      cargo: rep.cargo || (rep.observacoes?.includes('Cargo:') ? rep.observacoes.split('Cargo:')[1].trim() : '') || '',
                                                      email: rep.email || '',
                                                      telefone: rep.telefone || '',
                                                      documento_numero: rep.documento_numero || '',
                                                      documento_tipo: rep.documento_tipo || 'BI'
                                                    });
                                                    
                                                    setCustomRepMode(true);
                                                    setShowRepResults(false);
                                                    setRepSearchQuery('');
                                                    toast.success('Dados do representante carregados para edição');
                                                }}
                                            >
                                                <p className="font-medium">{rep.nome}</p>
                                                <p className="text-xs text-gray-500">{rep.documento_numero || 'Sem documento'}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Confirmar Seleção</Label>
                                <select 
                                    {...register('representante')} 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    defaultValue={watch('representante')}
                                >
                                    <option value="">Selecione na lista acima ou pesquise...</option>
                                    {repSearchResults.length > 0 && repSearchResults.map((v: any) => (
                                         <option key={v.id} value={v.id}>{v.nome}</option>
                                    ))}
                                    {/* Fallback for predefined list if exists */}
                                    {Array.isArray(visitantes) && visitantes.filter(v => v.tipo_pessoa === 'singular').map(v => (
                                        <option key={v.id} value={v.id}>{v.nome}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4 border p-6 rounded-lg bg-gray-50/50">
                            <div className="space-y-2">
                                <Label>Nome Completo do Representante *</Label>
                                <Input 
                                    placeholder="Nome Completo" 
                                    value={newRepData.nome}
                                    onChange={(e) => setNewRepData({...newRepData, nome: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Cargo na Empresa *</Label>
                                <Input 
                                    placeholder="Ex: Diretor(a), Gerente" 
                                    value={newRepData.cargo}
                                    onChange={(e) => setNewRepData({...newRepData, cargo: e.target.value})}
                                />
                            </div>
                             <div className="space-y-2">
                                <Label>Tipo de Documento</Label>
                                <Select 
                                    value={newRepData.documento_tipo}
                                    onValueChange={(val) => setNewRepData({...newRepData, documento_tipo: val})}
                                >
                                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BI">Bilhete de Identidade</SelectItem>
                                        <SelectItem value="PASSAPORTE">Passaporte</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Número do Documento</Label>
                                <Input 
                                    placeholder="Nº do Documento" 
                                    value={newRepData.documento_numero}
                                    onChange={(e) => setNewRepData({...newRepData, documento_numero: e.target.value})}
                                />
                            </div>
                             <div className="space-y-2">
                                <Label>Email Pessoal</Label>
                                <Input 
                                    placeholder="Email do representante" 
                                    value={newRepData.email}
                                    onChange={(e) => setNewRepData({...newRepData, email: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefone Pessoal</Label>
                                <Input 
                                    placeholder="Telefone do representante" 
                                    value={newRepData.telefone}
                                    onChange={(e) => setNewRepData({...newRepData, telefone: e.target.value})}
                                />
                            </div>
                        </div>
                    )}
                  </div>
                )}
                {/* Aba de Documentos */}
                {activeTab === 'documentos' && (
                  <div className="grid md:grid-cols-2 gap-4 animate-fade-in">
                    <div className="space-y-2">
                      <Label htmlFor="documento_tipo">Tipo de Documento</Label>
                      <Select {...register('documento_tipo')} onValueChange={value => { setValue('documento_tipo', value as 'BI' | 'PASSAPORTE' | 'CARTA' | 'CARTAO_RESIDENTE' | 'OUTRO'); }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BI">BI (Bilhete de Identidade)</SelectItem>
                          <SelectItem value="PASSAPORTE">Passaporte</SelectItem>
                          <SelectItem value="CARTA">Carta de Condução</SelectItem>
                          <SelectItem value="CARTAO_RESIDENTE">Cartão de Residente</SelectItem>
                          <SelectItem value="OUTRO">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="documento_numero">Nº do Documento</Label>
                      <Input 
                        id="documento_numero" 
                        {...register('documento_numero')} 
                        placeholder="Ex: 123456789LA041"
                        className={errors.documento_numero ? 'border-red-500' : ''}
                      />
                      {errors.documento_numero && (
                        <p className="text-sm text-red-500">{errors.documento_numero.message}</p>
                      )}
                      {watch('documento_tipo') && (
                        <div className="text-xs text-gray-600 mt-1">
                          {watch('documento_tipo') === 'BI' && (
                            <p>Formato: números + letras + números (ex: 123456789LA041)</p>
                          )}
                          {watch('documento_tipo') === 'PASSAPORTE' && (
                            <p>Formato: letras + números (ex: AN1234567)</p>
                          )}
                          {watch('documento_tipo') === 'CARTA' && (
                            <p>Formato: números ou letras + números (ex: 123456789)</p>
                          )}
                          {watch('documento_tipo') === 'OUTRO' && (
                            <p>Formato: qualquer sequência com pelo menos 3 caracteres</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="documento_emissao">Data de Emissão</Label>
                      <Input id="documento_emissao" type="date" {...register('documento_emissao')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="documento_validade">Data de Validade</Label>
                      <Input id="documento_validade" type="date" {...register('documento_validade')} />
                    </div>
                    
                    {/* Campos específicos para entidade singular */}
                    {selectedEntityType === 'singular' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="provincia_nascimento">Província de Nascimento</Label>
                          <select
                            id="provincia_nascimento"
                            {...register('provincia_nascimento')}
                            className="input w-full rounded-lg border border-gray-300 p-2 disabled:bg-gray-100 disabled:text-gray-500"
                            disabled={watch('documento_tipo') !== 'BI'}
                          >
                            {(
                              [
                                'Bengo','Benguela','Bié','Cabinda','Cuando Cubango','Cuanza Norte','Cuanza Sul','Cunene','Huambo','Huíla','Luanda','Lunda Norte','Lunda Sul','Malanje','Moxico','Namibe','Uíge','Zaire',
                                // 3 recentes
                                'Moxico Leste','Cubango','Icolo e Bengo'
                              ] as const
                            ).map((prov) => (
                              <option
                                key={prov}
                                value={prov}
                                disabled={['Moxico Leste','Cubango','Icolo e Bengo'].includes(prov) && watch('documento_tipo') !== 'BI'}
                              >
                                {prov}
                              </option>
                            ))}
                          </select>
                          {watch('documento_tipo') !== 'BI' && (
                            <p className="text-xs text-muted-foreground mt-1">Campo desabilitado. Selecione tipo de documento "BI" para escolher a província de nascimento.</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="estado_civil">Estado Civil</Label>
                          <Select value={watch('estado_civil')} onValueChange={value => setValue('estado_civil', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SOLTEIRO">Solteiro</SelectItem>
                              <SelectItem value="CASADO">Casado</SelectItem>
                              <SelectItem value="DIVORCIADO">Divorciado</SelectItem>
                              <SelectItem value="VIUVO">Viúvo</SelectItem>
                              <SelectItem value="UNIAO_FACTO">União de Facto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Aba de Endereço */}
                {activeTab === 'endereco' && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Endereço Conforme o BI/Documento */}
                    <Card className="border-gray-200 shadow-sm">
                        <CardHeader className="py-3 bg-gray-50 border-b">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Endereço Conforme o Documento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Província *</Label>
                                    <Input {...register('provincia_bi')} placeholder="Província" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Município *</Label>
                                    <Input {...register('municipio_bi')} placeholder="Município" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Bairro/Comuna *</Label>
                                    <Input {...register('bairro_bi')} placeholder="Bairro ou Comuna" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Rua</Label>
                                    <Input {...register('rua_bi')} placeholder="Nome da rua" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Número</Label>
                                    <Input {...register('numero_bi')} placeholder="Nº casa/apto" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Complemento</Label>
                                    <Input {...register('complemento_bi')} placeholder="Andar, Bloco, etc." />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Endereço Atual */}
                    <Card className="border-gray-200 shadow-sm">
                        <CardHeader className="py-3 bg-gray-50 border-b flex flex-row items-center justify-between">
                             <CardTitle className="text-base font-medium flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Endereço Atual
                            </CardTitle>
                            <div className="flex items-center space-x-2">
                                <input 
                                    type="checkbox" 
                                    id="sameAddress" 
                                    checked={sameAddress}
                                    onChange={(e) => setSameAddress(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                                />
                                <Label htmlFor="sameAddress" className="text-sm font-normal cursor-pointer text-gray-700">Mesmo endereço do documento</Label>
                            </div>
                        </CardHeader>
                        
                        {!sameAddress && (
                            <CardContent className="pt-4 animate-in slide-in-from-top-2">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Província</Label>
                                        <Input {...register('provincia_atual')} placeholder="Província" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Município</Label>
                                        <Input {...register('municipio_atual')} placeholder="Município" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Bairro/Comuna</Label>
                                        <Input {...register('bairro_atual')} placeholder="Bairro" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Rua</Label>
                                        <Input {...register('rua_atual')} placeholder="Rua" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Número</Label>
                                        <Input {...register('numero_atual')} placeholder="Nº" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Complemento</Label>
                                        <Input placeholder="Andar, Bloco, etc." />
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    <div className="space-y-2 hidden">
                      <Label htmlFor="endereco">Endereço Completo (Gerado Automaticamente)</Label>
                      <Input id="endereco" {...register('endereco')} placeholder="" />
                    </div>
                  </div>
                )}
                {/* Botões de navegação */}
                <div className="flex justify-end mt-8 gap-4 border-t pt-6">
                  <Button type="button" variant="outline" className="min-w-24" onClick={() => router.back()} disabled={loading}>
                    Cancelar
                  </Button>
                  {/* Botão "Seguinte" para primeira aba */}
                  {((selectedEntityType === 'singular' && activeTab === 'dados') || 
                    (selectedEntityType === 'coletiva' && activeTab === 'empresa')) && (
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => {
                        // Validação específica baseada no tipo de entidade
                        if (selectedEntityType === 'singular') {
                          const nome = watch('nome');
                          if (!nome || nome.trim() === '') {
                            setShowToast('Preencha o nome para continuar.');
                            setTimeout(() => setShowToast(null), 3000);
                            return;
                          }
                          setActiveTab('documentos');
                        } else if (selectedEntityType === 'coletiva') {
                          const designacao = watch('designacao_social');
                          if (!designacao || designacao.trim() === '') {
                            setShowToast('Preencha a designação social para continuar.');
                            setTimeout(() => setShowToast(null), 3000);
                            return;
                          }
                          setActiveTab('representante');
                        }
                      }}
                      disabled={loading}
                      className="min-w-24"
                    >
                      Seguinte
                    </Button>
                  )}
                  {/* Botão "Seguinte" para aba representante (coletiva) */}
                  {selectedEntityType === 'coletiva' && activeTab === 'representante' && (
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => setActiveTab('endereco')}
                      disabled={loading}
                      className="min-w-24"
                    >
                      Seguinte
                    </Button>
                  )}
                  {/* Botão "Seguinte" para aba documentos (singular) */}
                  {selectedEntityType === 'singular' && activeTab === 'documentos' && (
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => {
                        const documento_tipo = watch('documento_tipo');
                        const documento_numero = watch('documento_numero');
                        if (!documento_tipo || documento_tipo.trim() === '') {
                          setShowToast('Selecione o tipo de documento para continuar.');
                          setTimeout(() => setShowToast(null), 3000);
                          return;
                        }
                        if (!documento_numero || documento_numero.trim() === '') {
                          setShowToast('Preencha o número do documento para continuar.');
                          setTimeout(() => setShowToast(null), 3000);
                          return;
                        }
                        // Validar formato do documento angolano
                        if (!validateAngolanDocument(documento_numero, documento_tipo)) {
                          setShowToast('Número de documento inválido para o formato angolano.');
                          setTimeout(() => setShowToast(null), 3000);
                          return;
                        }
                        setActiveTab('endereco');
                      }}
                      disabled={loading}
                      className="min-w-24"
                    >
                      Seguinte
                    </Button>
                  )}
                  {/* Botão "Salvar" na última aba */}
                  {activeTab === 'endereco' && (
                    <Button type="submit" disabled={loading} className="min-w-24 bg-blue-600 hover:bg-blue-700">
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Salvando...
                        </>
                      ) : (
                        `Salvar ${selectedEntityType === 'singular' ? 'Entidade Singular' : 'Entidade Coletiva'}`
                      )}
                    </Button>
                  )}
                </div>
              </>
            )}
          </form>
          {/* Toast Notification */}
          {showToast && (
            <div className="fixed top-6 right-6 z-50">
              <div className="flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg bg-red-600 text-white animate-in slide-in-from-right-12 duration-300">
                <AlertCircle className="w-6 h-6 text-white" />
                <span className="font-semibold">Erro:</span>
                <span>{showToast}</span>
              </div>
            </div>
          )}
          {/* Success Alert */}
          {showAlert && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 border-2 border-green-500 animate-in zoom-in duration-300">
                <div className="flex flex-col items-center text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                  <h2 className="text-2xl font-bold text-green-900 mb-2">Sucesso!</h2>
                  <p className="text-gray-700 mb-6">A entidade foi adicionada com sucesso.</p>
                  <div className="bg-green-50 rounded-xl p-4 w-full mb-6">
                    <p className="text-sm text-gray-600 mb-1">Nome/Designação</p>
                    <p className="text-2xl font-bold text-green-600 font-mono">{showAlert.nome}</p>
                  </div>
                  <p className="text-sm text-gray-500">Redirecionando para criar nova visita...</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
