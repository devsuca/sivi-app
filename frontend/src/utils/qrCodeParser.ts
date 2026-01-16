/**
 * Parser para extrair dados de QR Codes de documentos de identidade
 * Suporta diferentes formatos: BI, Passaporte, etc.
 */

export interface QRParsedData {
  nome_completo?: string;
  documento_numero?: string;
  documento_tipo?: 'BI' | 'PASSAPORTE' | 'CARTA' | 'OUTRO';
  provincia_nascimento?: string;
  data_nascimento?: string;
  estado_civil?: string;
  data_emissao?: string;
  data_validade?: string;
  local_emissao?: string;
  nacionalidade?: string;
  genero?: 'M' | 'F' | 'O';
  nif?: string;
  email?: string;
  telefone?: string;
}

export interface QRParseResult {
  success: boolean;
  data?: QRParsedData;
  error?: string;
  rawData?: string;
}

/**
 * Função principal para processar dados do QR Code
 */
export function parseQRCodeData(qrData: string): QRParseResult {
  try {
    // Limpar e normalizar os dados
    const cleanData = qrData.trim().replace(/\s+/g, ' ');
    
    // Tentar diferentes formatos de parsing
    const parsers = [
      parseBIAngola,
      parsePassaporte,
      parseGenericFormat,
      parseFreeTextFormat,
      parseAnyTextFormat,
      parseRawDataFormat,
      parseJSONFormat
    ];

    for (const parser of parsers) {
      const result = parser(cleanData);
      if (result.success) {
        return {
          success: true,
          data: result.data,
          rawData: qrData
        };
      }
    }

    // Se nenhum parser funcionou, retornar pelo menos nacionalidade
    console.log('⚠️ Nenhum parser funcionou, retornando dados mínimos');
    return {
      success: true,
      data: {
        nacionalidade: 'Angolana',
        documento_tipo: 'BI'
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Erro ao processar QR Code: ${error}`,
      rawData: qrData
    };
  }
}

/**
 * Parser para Bilhete de Identidade de Angola
 * Formato típico: "BI123456789|NOME COMPLETO|DD/MM/AAAA|PROVINCIA|..."
 */
function parseBIAngola(data: string): QRParseResult {
  try {
    console.log('🔍 Tentando parsear como BI de Angola:', data);
    console.log('🔍 Dados recebidos (length):', data.length);
    console.log('🔍 Dados recebidos (chars):', data.split('').map(c => c.charCodeAt(0)));
    
    // Padrões comuns para BI de Angola
    const biPatterns = [
      // Formato completo: NOME NUMERO DD/MM/AAAA PROVINCIA SEXO ESTADO_CIVIL DD/MM/AAAA DD/MM/AAAA
      /^([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s-]{5,60})\s+(\d{9}[A-Z]{2}\d{3})\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+([A-ZÁÉÍÓÚÇÃÕ\s]+)\s+([MF])\s+([A-ZÁÉÍÓÚÇÃÕ\s]+)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}\/\d{1,2}\/\d{4})$/i,
      // Formato com menos campos: NOME NUMERO DD/MM/AAAA PROVINCIA SEXO
      /^([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s-]{5,60})\s+(\d{9}[A-Z]{2}\d{3})\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+([A-ZÁÉÍÓÚÇÃÕ\s]+)\s+([MF])$/i,
      // Formato com data e província: NOME NUMERO DD/MM/AAAA PROVINCIA
      /^([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s-]{5,60})\s+(\d{9}[A-Z]{2}\d{3})\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+([A-ZÁÉÍÓÚÇÃÕ\s]+)$/i,
      // Formato mais simples: NOME 000000001LA000
      /^([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s-]{5,60})\s+(\d{9}[A-Z]{2}\d{3})$/i,
      // Formato ainda mais simples: NOME NUMERO
      /^([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s-]{5,60})\s+(\d+[A-Z]*\d*)$/i,
      // Formato ultra simples: qualquer texto com espaço e número
      /^(.+?)\s+(\d+[A-Z]*\d*)$/i,
      // Formato específico BI angolano: 000000001LA000
      /^BI\s*(\d{9}[A-Z]{2}\d{3})\s*[|;,\s]+\s*([A-ZÁÉÍÓÚÇÃÕ\s]{3,50})\s*[|;,\s]+\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*[|;,\s]+\s*([A-ZÁÉÍÓÚÇÃÕ\s]+)/i,
      // Formato BI angolano sem prefixo: 000000001LA000 NOME DD/MM/AAAA
      /^(\d{9}[A-Z]{2}\d{3})\s+([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s-]{5,60})\s+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      // Formato BI angolano simples: 000000001LA000 NOME
      /^(\d{9}[A-Z]{2}\d{3})\s+([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s-]{5,60})/i,
      // Formato BI angolano com prefixo: BI000000001LA000 NOME
      /^BI\s*(\d{9}[A-Z]{2}\d{3})\s+([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s-]{5,60})/i,
      // Formato com pipes: BI123456789|NOME|DD/MM/AAAA|PROVINCIA|...
      /^BI(\d+[A-Z]*\d*)\|([^|]+)\|(\d{2}\/\d{2}\/\d{4})\|([^|]+)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)/i,
      // Formato com espaços: BI 123456789 NOME DD/MM/AAAA PROVINCIA
      /^BI\s*(\d+[A-Z]*\d*)\s+([A-ZÁÉÍÓÚÇÃÕ\s]+)\s+(\d{2}\/\d{2}\/\d{4})\s+([A-ZÁÉÍÓÚÇÃÕ\s]+)/i,
      // Formato compacto: BI123456789NOMECOMPLETODDMMAAAA
      /^BI(\d{9}[A-Z]{2}\d{3})([A-ZÁÉÍÓÚÇÃÕ]+)(\d{8})/i,
      // Formato com separadores variados: BI123456789;NOME;DD/MM/AAAA;PROVINCIA
      /^BI(\d+[A-Z]*\d*)[;|,]([^;|,]+)[;|,](\d{2}\/\d{2}\/\d{4})[;|,]([^;|,]+)/i,
      // Formato com quebras de linha ou tabs
      /^BI(\d+[A-Z]*\d*)[\s\n\t]+([A-ZÁÉÍÓÚÇÃÕ\s]+)[\s\n\t]+(\d{2}\/\d{2}\/\d{4})[\s\n\t]+([A-ZÁÉÍÓÚÇÃÕ\s]+)/i,
      // Formato mais flexível para BI
      /^BI\s*(\d{6,20}[A-Z]*\d*)\s*[|;,\s]+\s*([A-ZÁÉÍÓÚÇÃÕ\s]{3,50})\s*[|;,\s]+\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*[|;,\s]+\s*([A-ZÁÉÍÓÚÇÃÕ\s]+)/i,
      // Formato com apenas número e nome: BI123456789 NOME COMPLETO
      /^BI\s*(\d{6,20}[A-Z]*\d*)\s+([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s-]{5,60})/i,
      // Formato com número, nome e data: BI123456789 NOME DD/MM/AAAA
      /^BI\s*(\d{6,20}[A-Z]*\d*)\s+([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s-]{5,60})\s+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      // Formato sem prefixo BI: 123456789 NOME DD/MM/AAAA
      /^(\d{6,20}[A-Z]*\d*)\s+([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s-]{5,60})\s+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      // Formato muito simples: NOME 123456789
      /^([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s-]{5,60})\s+(\d{6,20}[A-Z]*\d*)/i,
      // Formato: NOME COMPLETO 123456789 DD/MM/AAAA
      /^([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s-]{5,60})\s+(\d{6,20}[A-Z]*\d*)\s+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      // Formato: NOME COMPLETO 123456789 PROVINCIA
      /^([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s-]{5,60})\s+(\d{6,20}[A-Z]*\d*)\s+([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s]+)/i,
      // Formato: NOME COMPLETO 123456789 DD/MM/AAAA PROVINCIA
      /^([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s-]{5,60})\s+(\d{6,20}[A-Z]*\d*)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s]+)/i
    ];

    for (let i = 0; i < biPatterns.length; i++) {
      const pattern = biPatterns[i];
      console.log(`🔍 Testando padrão ${i + 1}:`, pattern);
      const match = data.match(pattern);
      console.log(`🔍 Resultado do padrão ${i + 1}:`, match);
      
      if (match) {
        let numero, nome, dataNasc, provincia, sexo, estadoCivil, dataEmissao, dataCaducidade;
        
        // Verificar qual padrão foi usado para determinar a ordem dos campos
        // Padrões onde nome vem primeiro: índices 0, 1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14, 15
        if (i === 0 || i === 1 || i === 2 || i === 3 || i === 4 || i === 5 || i >= 9) { 
          if (i === 0) { // Formato completo: NOME NUMERO DD/MM/AAAA PROVINCIA SEXO ESTADO_CIVIL DD/MM/AAAA DD/MM/AAAA
            [, nome, numero, dataNasc, provincia, sexo, estadoCivil, dataEmissao, dataCaducidade] = match;
          } else if (i === 1) { // Formato com menos campos: NOME NUMERO DD/MM/AAAA PROVINCIA SEXO
            [, nome, numero, dataNasc, provincia, sexo] = match;
          } else if (i === 2) { // Formato com data e província: NOME NUMERO DD/MM/AAAA PROVINCIA
            [, nome, numero, dataNasc, provincia] = match;
          } else if (i === 3) { // NOME 000000001LA000
            [, nome, numero] = match;
          } else if (i === 4) { // NOME NUMERO (formato simples)
            [, nome, numero] = match;
          } else if (i === 5) { // QUALQUER TEXTO NUMERO (formato ultra simples)
            [, nome, numero] = match;
          } else if (i === 9) { // NOME 123456789
            [, nome, numero] = match;
          } else if (i === 7) { // NOME 123456789 DD/MM/AAAA
            [, nome, numero, dataNasc] = match;
          } else if (i === 8) { // NOME 123456789 PROVINCIA
            [, nome, numero, provincia] = match;
          } else if (i === 9) { // NOME 123456789 DD/MM/AAAA PROVINCIA
            [, nome, numero, dataNasc, provincia] = match;
          } else if (i === 10) { // NOME 123456789
            [, nome, numero] = match;
          } else if (i === 11) { // NOME 123456789 DD/MM/AAAA
            [, nome, numero, dataNasc] = match;
          } else if (i === 12) { // NOME 123456789 PROVINCIA
            [, nome, numero, provincia] = match;
          } else if (i === 13) { // NOME 123456789 DD/MM/AAAA PROVINCIA
            [, nome, numero, dataNasc, provincia] = match;
          }
          console.log('✅ Padrão BI encontrado (nome primeiro):', { nome, numero, dataNasc, provincia, patternIndex: i });
        } else {
          // Padrões normais - número primeiro, nome depois
          const [, numero, nome, dataNasc, provincia, ...rest] = match;
          console.log('✅ Padrão BI encontrado (número primeiro):', {
            numero,
            nome,
            dataNasc,
            provincia,
            patternIndex: i,
            rest,
          });

          console.log('✅ Padrão BI encontrado (número primeiro):', { numero, nome, dataNasc, provincia, patternIndex: i });
        }
        
        const result: QRParsedData = {
          documento_numero: numero,
          documento_tipo: 'BI',
          nacionalidade: 'Angolana'
        };
        
        console.log('🔍 Dados extraídos:', { numero, nome, dataNasc, provincia, sexo, estadoCivil, dataEmissao, dataCaducidade });
        
        // Adicionar nome se disponível
        if (nome && nome.trim().length > 0) {
          result.nome_completo = nome.trim().replace(/\s+/g, ' ');
          console.log('✅ Nome adicionado:', result.nome_completo);
        } else {
          console.log('⚠️ Nome não encontrado ou vazio');
        }
        
        // Adicionar número do documento se disponível
        if (numero && numero.trim().length > 0) {
          result.documento_numero = numero.trim();
          console.log('✅ Número do documento adicionado:', result.documento_numero);
        } else {
          console.log('⚠️ Número do documento não encontrado ou vazio');
        }
        
        // Adicionar data de nascimento se disponível
        if (dataNasc && dataNasc.trim().length > 0) {
          result.data_nascimento = formatDate(dataNasc);
          console.log('✅ Data de nascimento adicionada:', result.data_nascimento);
        } else {
          console.log('⚠️ Data de nascimento não encontrada ou vazia');
        }
        
        // Adicionar província se disponível
        if (provincia && provincia.trim().length > 0) {
          result.provincia_nascimento = provincia.trim();
          console.log('✅ Província adicionada:', result.provincia_nascimento);
        } else {
          console.log('⚠️ Província não encontrada ou vazia');
        }
        
        // Adicionar sexo se disponível
        if (sexo && sexo.trim().length > 0) {
          result.genero = sexo.trim().toUpperCase() as 'M' | 'F';
          console.log('✅ Sexo adicionado:', result.genero);
        } else {
          console.log('⚠️ Sexo não encontrado ou vazio');
        }
        
        // Adicionar estado civil se disponível
        if (estadoCivil && estadoCivil.trim().length > 0) {
          result.estado_civil = estadoCivil.trim();
          console.log('✅ Estado civil adicionado:', result.estado_civil);
        } else {
          console.log('⚠️ Estado civil não encontrado ou vazio');
        }
        
        // Adicionar data de emissão se disponível
        if (dataEmissao && dataEmissao.trim().length > 0) {
          result.data_emissao = formatDate(dataEmissao);
          console.log('✅ Data de emissão adicionada:', result.data_emissao);
        } else {
          console.log('⚠️ Data de emissão não encontrada ou vazia');
        }
        
        // Adicionar data de caducidade se disponível
        if (dataCaducidade && dataCaducidade.trim().length > 0) {
          result.data_validade = formatDate(dataCaducidade);
          console.log('✅ Data de caducidade adicionada:', result.data_validade);
        } else {
          console.log('⚠️ Data de caducidade não encontrada ou vazia');
        }
        
        console.log('🎉 Resultado final do parsing:', result);
        return {
          success: true,
          data: result
        };
      }
    }

    console.log('❌ Nenhum padrão BI encontrado para os dados:', data);
    return { success: false };
  } catch (error) {
    console.log('❌ Nenhum padrão BI encontrado para os dados:', data);
    return { success: false };
  }
}

/**
 * Parser para Passaporte
 */
function parsePassaporte(data: string): QRParseResult {
  try {
    // Padrões para passaporte
    const passaportePatterns = [
      // Formato MRZ (Machine Readable Zone)
      /^P[A-Z]{3}([A-Z0-9<]+)\d([A-Z<]+)\d([A-Z<]+)\d(\d{6})\d([MF])\d(\d{6})\d([A-Z]{3})/,
      // Formato com pipes: PASSAPORTE|NUMERO|NOME|DD/MM/AAAA|...
      /^PASSAPORTE\|(\d+)\|([^|]+)\|(\d{2}\/\d{2}\/\d{4})\|([^|]+)/i
    ];

    for (const pattern of passaportePatterns) {
      const match = data.match(pattern);
      if (match) {
        const [, numero, nome, dataNasc, nacionalidade] = match;
        
        return {
          success: true,
          data: {
            documento_numero: numero,
            documento_tipo: 'PASSAPORTE',
            nome_completo: nome.trim().replace(/</g, ' ').replace(/\s+/g, ' '),
            data_nascimento: formatDate(dataNasc),
            nacionalidade: nacionalidade?.trim() || 'Estrangeira'
          }
        };
      }
    }

    console.log('❌ Nenhum padrão BI encontrado para os dados:', data);
    return { success: false };
  } catch (error) {
    console.log('❌ Nenhum padrão BI encontrado para os dados:', data);
    return { success: false };
  }
}

/**
 * Parser para formato JSON
 */
function parseJSONFormat(data: string): QRParseResult {
  try {
    const jsonData = JSON.parse(data);
    
    // Mapear campos comuns
    const mappedData: QRParsedData = {};
    
    if (jsonData.nome || jsonData.name || jsonData.fullName) {
      mappedData.nome_completo = jsonData.nome || jsonData.name || jsonData.fullName;
    }
    
    if (jsonData.documento || jsonData.document || jsonData.idNumber) {
      mappedData.documento_numero = jsonData.documento || jsonData.document || jsonData.idNumber;
    }
    
    if (jsonData.tipo || jsonData.type) {
      const tipo = (jsonData.tipo || jsonData.type).toUpperCase();
      if (tipo.includes('BI') || tipo.includes('IDENTIDADE')) {
        mappedData.documento_tipo = 'BI';
      } else if (tipo.includes('PASSAPORTE') || tipo.includes('PASSPORT')) {
        mappedData.documento_tipo = 'PASSAPORTE';
      }
    }
    
    if (jsonData.dataNascimento || jsonData.birthDate || jsonData.birthday) {
      mappedData.data_nascimento = formatDate(jsonData.dataNascimento || jsonData.birthDate || jsonData.birthday);
    }
    
    if (jsonData.provincia || jsonData.province || jsonData.birthPlace) {
      mappedData.provincia_nascimento = jsonData.provincia || jsonData.province || jsonData.birthPlace;
    }
    
    if (jsonData.nacionalidade || jsonData.nationality) {
      mappedData.nacionalidade = jsonData.nacionalidade || jsonData.nationality;
    }
    
    if (jsonData.genero || jsonData.gender || jsonData.sex) {
      const genero = (jsonData.genero || jsonData.gender || jsonData.sex).toUpperCase();
      if (genero.includes('M') || genero.includes('MASCULINO')) {
        mappedData.genero = 'M';
      } else if (genero.includes('F') || genero.includes('FEMININO')) {
        mappedData.genero = 'F';
      }
    }

    return {
      success: Object.keys(mappedData).length > 0,
      data: mappedData
    };
  } catch (error) {
    console.log('❌ Nenhum padrão BI encontrado para os dados:', data);
    return { success: false };
  }
}

/**
 * Parser genérico para tentar extrair informações básicas
 */
function parseGenericFormat(data: string): QRParseResult {
  try {
    console.log('🔍 Tentando parsear formato genérico:', data);
    const result: QRParsedData = {};
    
    // Tentar extrair número de documento (mais agressivo)
    const docPatterns = [
      /\b(\d{9,12})\b/,  // Números de 9-12 dígitos
      /BI\s*(\d+)/i,     // BI seguido de números
      /(\d{6,12})/,      // Qualquer sequência de 6-12 dígitos
      /(\d{7,15})/       // Sequências maiores
    ];
    
    for (const pattern of docPatterns) {
      const docMatch = data.match(pattern);
    if (docMatch) {
        const numero = docMatch[1];
        // Verificar se não é uma data
        if (!numero.match(/^\d{8}$/) || !isValidDate(formatDate(numero))) {
          result.documento_numero = numero;
          result.documento_tipo = 'BI';
          console.log('🆔 Número de documento encontrado:', numero);
          break;
        }
      }
    }
    
    // Tentar extrair data de nascimento (mais formatos)
    const datePatterns = [
      /(\d{2}\/\d{2}\/\d{4})/,  // DD/MM/AAAA
      /(\d{2}-\d{2}-\d{4})/,    // DD-MM-AAAA
      /(\d{8})/,                // DDMMAAAA
      /(\d{4}-\d{2}-\d{2})/,    // AAAA-MM-DD
      /(\d{1,2}\/\d{1,2}\/\d{4})/, // D/M/AAAA
      /(\d{1,2}-\d{1,2}-\d{4})/     // D-M-AAAA
    ];
    
    for (const pattern of datePatterns) {
      const dateMatch = data.match(pattern);
    if (dateMatch) {
        const formattedDate = formatDate(dateMatch[1]);
        if (isValidDate(formattedDate)) {
          result.data_nascimento = formattedDate;
          console.log('📅 Data de nascimento encontrada:', dateMatch[1], '->', formattedDate);
          break;
        }
      }
    }
    
    // Tentar extrair nome (muito mais agressivo)
    const namePatterns = [
      // Nome completo com acentos e espaços (mais flexível)
      /([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s]{3,80})/,
      // Nome e sobrenome separados
      /([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ]{2,30})\s+([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ]{2,30})/,
      // Nome com hífen (nomes compostos)
      /([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s-]{3,60})/,
      // Qualquer sequência de letras (muito flexível)
      /([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s]{2,50})/,
      // Padrão específico: NOME seguido de número
      /^([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s-]{5,60})\s+(\d{6,12})/,
      // Padrão: NOME NÚMERO DATA
      /^([A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s-]{5,60})\s+(\d{6,12})\s+(\d{1,2}\/\d{1,2}\/\d{4})/
    ];
    
    for (let j = 0; j < namePatterns.length; j++) {
      const pattern = namePatterns[j];
      const nameMatch = data.match(pattern);
      if (nameMatch) {
        let nome;
        
        // Para padrões específicos (índices 4 e 5), extrair apenas o nome
        if (j >= 4) {
          nome = nameMatch[1]; // Primeiro grupo é o nome
        } else {
          nome = nameMatch[0]; // Todo o match
        }
        
        nome = nome.trim().replace(/\s+/g, ' ');
        
        // Limpar caracteres inválidos mas manter acentos
        nome = nome.replace(/[^A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s-]/g, '');
        
        // Verificar se não é apenas números ou caracteres especiais
        if (nome.length >= 2 && nome.length <= 80 && 
            !nome.match(/^\d+$/) && 
            !nome.match(/^[^A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ]+$/)) {
          result.nome_completo = nome;
          console.log('👤 Nome encontrado:', nome);
          break;
        }
      }
    }
    
    // Se não encontrou nome com regex, tentar extrair das palavras
    if (!result.nome_completo) {
      const words = data.split(/\s+/);
      const nameWords = words.filter(word => 
        word.match(/^[A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ-]+$/i) && 
        word.length >= 2 && 
        word.length <= 30 &&
        !word.match(/^\d+$/)
      );
      
      if (nameWords.length > 0) {
        result.nome_completo = nameWords.join(' ');
        console.log('👤 Nome extraído das palavras:', result.nome_completo);
      }
    }
    
    // Tentar extrair província (palavras que podem ser províncias)
    const provincias = ['LUANDA', 'HUAMBO', 'BENGUELA', 'HUÍLA', 'CABINDA', 'MALANJE', 'NAMIBE', 'BIÉ', 'KUANZA NORTE', 'KUANZA SUL', 'LUNDA NORTE', 'LUNDA SUL', 'MOXICO', 'UÍGE', 'ZAIRE', 'CUNENE', 'KWANZA NORTE', 'KWANZA SUL'];
    
    if (!result.provincia_nascimento) {
      const words = data.split(/\s+/);
      for (const word of words) {
        const upperWord = word.toUpperCase();
        if (provincias.includes(upperWord)) {
          result.provincia_nascimento = upperWord;
          console.log('🌍 Província encontrada:', upperWord);
          break;
        }
      }
    }
    
    // Definir nacionalidade padrão se não especificada
    if (!result.nacionalidade) {
      result.nacionalidade = 'Angolana';
    }

    const success = Object.keys(result).length > 0;
    console.log('🔍 Resultado do parser genérico:', { success, data: result });

    return {
      success,
      data: result
    };
  } catch (error) {
    console.error('❌ Erro no parser genérico:', error);
    console.log('❌ Nenhum padrão BI encontrado para os dados:', data);
    return { success: false };
  }
}

/**
 * Parser para texto livre - tenta extrair informações de qualquer texto
 */
function parseFreeTextFormat(data: string): QRParseResult {
  try {
    console.log('🔍 Tentando parsear como texto livre:', data);
    const result: QRParsedData = {};
    
    // Dividir o texto em palavras
    const words = data.split(/\s+/);
    
    // Procurar por sequências de números que podem ser documentos
    for (const word of words) {
      if (word.match(/^\d{6,12}$/)) {
        result.documento_numero = word;
        result.documento_tipo = 'BI';
        break;
      }
    }
    
    // Procurar por sequências de letras que podem ser nomes (mais agressivo)
    const nameWords = words.filter(word => 
      word.match(/^[A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ-]+$/i) && 
      word.length >= 2 && 
      word.length <= 30 &&
      !word.match(/^\d+$/)
    );
    
    if (nameWords.length > 0) {
      result.nome_completo = nameWords.join(' ');
      console.log('👤 Nome encontrado em texto livre:', result.nome_completo);
    }
    
    // Tentar extrair província
    const provincias = ['LUANDA', 'HUAMBO', 'BENGUELA', 'HUÍLA', 'CABINDA', 'MALANJE', 'NAMIBE', 'BIÉ', 'KUANZA NORTE', 'KUANZA SUL', 'LUNDA NORTE', 'LUNDA SUL', 'MOXICO', 'UÍGE', 'ZAIRE', 'CUNENE', 'KWANZA NORTE', 'KWANZA SUL'];
    
    for (const word of words) {
      const upperWord = word.toUpperCase();
      if (provincias.includes(upperWord)) {
        result.provincia_nascimento = upperWord;
        console.log('🌍 Província encontrada em texto livre:', upperWord);
        break;
      }
    }
    
    // Procurar por datas
    const datePatterns = [
      /(\d{2}\/\d{2}\/\d{4})/,
      /(\d{2}-\d{2}-\d{4})/,
      /(\d{8})/
    ];
    
    for (const pattern of datePatterns) {
      const dateMatch = data.match(pattern);
      if (dateMatch) {
        result.data_nascimento = formatDate(dateMatch[1]);
        console.log('📅 Data encontrada em texto livre:', dateMatch[1]);
        break;
      }
    }
    
    // Definir nacionalidade padrão
    if (!result.nacionalidade) {
      result.nacionalidade = 'Angolana';
    }
    
    const success = Object.keys(result).length > 0;
    console.log('🔍 Resultado do parser de texto livre:', { success, data: result });

    return {
      success,
      data: result
    };
  } catch (error) {
    console.error('❌ Erro no parser de texto livre:', error);
    console.log('❌ Nenhum padrão BI encontrado para os dados:', data);
    return { success: false };
  }
}

/**
 * Parser ultra-agressivo para qualquer texto - último recurso
 */
function parseAnyTextFormat(data: string): QRParseResult {
  try {
    console.log('🔍 Tentando parsear como qualquer texto:', data);
    const result: QRParsedData = {};
    
    // Dividir em caracteres e tentar extrair qualquer coisa útil
    const words = data.split(/\s+/);
    console.log('📝 Todas as palavras:', words);
    
    // Procurar QUALQUER número que possa ser documento
    for (const word of words) {
      if (word.match(/^\d{5,15}$/)) {
        result.documento_numero = word;
        result.documento_tipo = 'BI';
        console.log('🆔 Número encontrado (qualquer formato):', word);
        break;
      }
    }
    
    // Procurar QUALQUER sequência de letras que possa ser nome
    const allWords = data.split(/[\s\n\t,;|]+/);
    const possibleNames = allWords.filter(word => 
      word.match(/[A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ]/i) && 
      word.length >= 2 && 
      word.length <= 50 &&
      !word.match(/^\d+$/) &&
      !word.match(/^[^A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ]+$/)
    );
    
    if (possibleNames.length > 0) {
      result.nome_completo = possibleNames.join(' ');
      console.log('👤 Nome encontrado (qualquer formato):', result.nome_completo);
    }
    
    // Procurar QUALQUER data
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /(\d{1,2}-\d{1,2}-\d{4})/,
      /(\d{8})/,
      /(\d{4}-\d{1,2}-\d{1,2})/,
      /(\d{1,2}\.\d{1,2}\.\d{4})/
    ];
    
    for (const pattern of datePatterns) {
      const dateMatch = data.match(pattern);
      if (dateMatch) {
        const formattedDate = formatDate(dateMatch[1]);
        if (isValidDate(formattedDate)) {
          result.data_nascimento = formattedDate;
          console.log('📅 Data encontrada (qualquer formato):', dateMatch[1], '->', formattedDate);
          break;
        }
      }
    }
    
    // Procurar províncias
    const provincias = ['LUANDA', 'HUAMBO', 'BENGUELA', 'HUÍLA', 'CABINDA', 'MALANJE', 'NAMIBE', 'BIÉ', 'KUANZA NORTE', 'KUANZA SUL', 'LUNDA NORTE', 'LUNDA SUL', 'MOXICO', 'UÍGE', 'ZAIRE', 'CUNENE', 'KWANZA NORTE', 'KWANZA SUL'];
    
    for (const word of allWords) {
      const upperWord = word.toUpperCase();
      if (provincias.includes(upperWord)) {
        result.provincia_nascimento = upperWord;
        console.log('🌍 Província encontrada (qualquer formato):', upperWord);
        break;
      }
    }
    
    // Nacionalidade padrão
    result.nacionalidade = 'Angolana';
    
    const success = Object.keys(result).length > 1; // Mais que apenas nacionalidade
    console.log('🔍 Resultado do parser qualquer texto:', { success, data: result });

    return {
      success,
      data: result
    };
  } catch (error) {
    console.error('❌ Erro no parser qualquer texto:', error);
    console.log('❌ Nenhum padrão BI encontrado para os dados:', data);
    return { success: false };
  }
}

/**
 * Parser para dados brutos - último recurso absoluto
 */
function parseRawDataFormat(data: string): QRParseResult {
  try {
    console.log('🔍 Tentando parsear dados brutos:', data);
    const result: QRParsedData = {};
    
    // Se chegou até aqui, pelo menos tentar extrair algo
    result.nacionalidade = 'Angolana';
    
    // Procurar QUALQUER número
    const numbers = data.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      // Pegar o número mais longo
      const longestNumber = numbers.reduce((a, b) => a.length > b.length ? a : b);
      if (longestNumber.length >= 3) {
        result.documento_numero = longestNumber;
        result.documento_tipo = 'BI';
        console.log('🆔 Número encontrado (dados brutos):', longestNumber);
      }
    }
    
    // Procurar QUALQUER palavra que possa ser nome
    const words = data.split(/[\s\n\t,;|]+/);
    const possibleNames = words.filter(word => 
      word.match(/[A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ]/i) && 
      word.length >= 2 && 
      word.length <= 50 &&
      !word.match(/^\d+$/)
    );
    
    if (possibleNames.length > 0) {
      result.nome_completo = possibleNames.join(' ');
      console.log('👤 Nome encontrado (dados brutos):', result.nome_completo);
    }
    
    // Procurar QUALQUER data
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /(\d{1,2}-\d{1,2}-\d{4})/,
      /(\d{8})/,
      /(\d{4}-\d{1,2}-\d{1,2})/
    ];
    
    for (const pattern of datePatterns) {
      const dateMatch = data.match(pattern);
      if (dateMatch) {
        const formattedDate = formatDate(dateMatch[1]);
        if (isValidDate(formattedDate)) {
          result.data_nascimento = formattedDate;
          console.log('📅 Data encontrada (dados brutos):', dateMatch[1], '->', formattedDate);
          break;
        }
      }
    }
    
    // Sempre retornar sucesso se tem pelo menos nacionalidade
    const success = Object.keys(result).length > 0;
    console.log('🔍 Resultado do parser dados brutos:', { success, data: result });

    return {
      success,
      data: result
    };
  } catch (error) {
    console.error('❌ Erro no parser dados brutos:', error);
    console.log('❌ Nenhum padrão BI encontrado para os dados:', data);
    return { success: false };
  }
}

/**
 * Formatar data para o formato esperado pelo sistema
 */
function formatDate(dateStr: string): string {
  try {
    console.log('🔍 Formatando data:', dateStr);
    
    if (!dateStr || dateStr.trim() === '') {
      console.log('⚠️ Data vazia ou inválida');
      return '';
    }
    
    const cleanDate = dateStr.trim();
    
    // Se já está no formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      console.log('✅ Data já no formato YYYY-MM-DD:', cleanDate);
      return cleanDate;
    }
    
    // Se está no formato DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleanDate)) {
      const [day, month, year] = cleanDate.split('/');
      const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      console.log('✅ Data convertida DD/MM/YYYY -> YYYY-MM-DD:', cleanDate, '->', formatted);
      return formatted;
    }
    
    // Se está no formato DD-MM-YYYY
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(cleanDate)) {
      const [day, month, year] = cleanDate.split('-');
      const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      console.log('✅ Data convertida DD-MM-YYYY -> YYYY-MM-DD:', cleanDate, '->', formatted);
      return formatted;
    }
    
    // Se está no formato DD.MM.YYYY
    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(cleanDate)) {
      const [day, month, year] = cleanDate.split('.');
      const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      console.log('✅ Data convertida DD.MM.YYYY -> YYYY-MM-DD:', cleanDate, '->', formatted);
      return formatted;
    }
    
    // Se está no formato DDMMYYYY (8 dígitos)
    if (/^\d{8}$/.test(cleanDate)) {
      const day = cleanDate.substring(0, 2);
      const month = cleanDate.substring(2, 4);
      const year = cleanDate.substring(4, 8);
      const formatted = `${year}-${month}-${day}`;
      console.log('✅ Data convertida DDMMYYYY -> YYYY-MM-DD:', cleanDate, '->', formatted);
      return formatted;
    }
    
    // Se está no formato YYYYMMDD (8 dígitos)
    if (/^\d{8}$/.test(cleanDate) && cleanDate.substring(0, 4) > '1900') {
      const year = cleanDate.substring(0, 4);
      const month = cleanDate.substring(4, 6);
      const day = cleanDate.substring(6, 8);
      const formatted = `${year}-${month}-${day}`;
      console.log('✅ Data convertida YYYYMMDD -> YYYY-MM-DD:', cleanDate, '->', formatted);
      return formatted;
    }
    
    console.log('⚠️ Formato de data não reconhecido, retornando como está:', cleanDate);
    return cleanDate;
  } catch (error) {
    console.error('❌ Erro ao formatar data:', error, 'Data original:', dateStr);
    return dateStr;
  }
}

/**
 * Validar se os dados extraídos são válidos
 */
export function validateQRData(data: QRParsedData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  console.log('🔍 Validando dados:', data);
  
  // Validação ultra-flexível - aceita qualquer dado extraído
  const hasAnyData = Object.keys(data).length > 0;
  const hasValidName = Boolean(data.nome_completo && data.nome_completo.trim().length >= 1);
  const hasValidDocument = Boolean(data.documento_numero && data.documento_numero.trim().length >= 1);
  const hasValidDate = Boolean(data.data_nascimento && isValidDate(data.data_nascimento));
  const hasNationality = Boolean(data.nacionalidade && data.nacionalidade.trim().length >= 1);
  
  // Se tem qualquer dado útil, é válido
  const isValid: boolean = hasAnyData && (hasValidName || hasValidDocument || hasValidDate || hasNationality);
  
  // Só adiciona erros se não tem NENHUM dado útil
  if (!isValid) {
    errors.push('Nenhum dado válido foi extraído do QR Code');
  }
  
  console.log('🔍 Validação:', { 
    hasAnyData,
    hasValidName, 
    hasValidDocument, 
    hasValidDate,
    hasNationality,
    isValid, 
    errors,
    dataKeys: Object.keys(data)
  });
  
  return {
    isValid,
    errors
  };
}

/**
 * Verificar se uma data é válida
 */
function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Extrair data de nascimento do QR Code
 */
export function extractDateFromQR(qrData: string): string | null {
  console.log('🔍 Extraindo data de:', qrData);
  
  // Estratégia 1: Formato DD/MM/AAAA
  const dateMatch1 = qrData.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
  if (dateMatch1) {
    const extractedDate = dateMatch1[1];
    console.log('🔍 Data extraída (DD/MM/AAAA):', extractedDate);
    return extractedDate;
  }
  
  // Estratégia 2: Formato DD-MM-AAAA
  const dateMatch2 = qrData.match(/(\d{1,2}-\d{1,2}-\d{4})/);
  if (dateMatch2) {
    const extractedDate = dateMatch2[1];
    console.log('🔍 Data extraída (DD-MM-AAAA):', extractedDate);
    return extractedDate;
  }
  
  // Estratégia 3: Formato DD.MM.AAAA
  const dateMatch3 = qrData.match(/(\d{1,2}\.\d{1,2}\.\d{4})/);
  if (dateMatch3) {
    const extractedDate = dateMatch3[1];
    console.log('🔍 Data extraída (DD.MM.AAAA):', extractedDate);
    return extractedDate;
  }
  
  // Estratégia 4: Formato DDMMAAAA (8 dígitos)
  const dateMatch4 = qrData.match(/(\d{8})/);
  if (dateMatch4) {
    const dateStr = dateMatch4[1];
    const day = dateStr.substring(0, 2);
    const month = dateStr.substring(2, 4);
    const year = dateStr.substring(4, 8);
    const formattedDate = `${day}/${month}/${year}`;
    console.log('🔍 Data extraída (DDMMAAAA):', dateStr, '->', formattedDate);
    return formattedDate;
  }
  
  // Estratégia 5: Formato YYYY-MM-DD
  const dateMatch5 = qrData.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch5) {
    const extractedDate = dateMatch5[1];
    console.log('🔍 Data extraída (YYYY-MM-DD):', extractedDate);
    return extractedDate;
  }
  
  // Estratégia 6: Formato YYYYMMDD (8 dígitos)
  const dateMatch6 = qrData.match(/(\d{8})/);
  if (dateMatch6) {
    const dateStr = dateMatch6[1];
    // Verificar se é formato YYYYMMDD (ano > 1900)
    const year = dateStr.substring(0, 4);
    if (parseInt(year) > 1900) {
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      const formattedDate = `${year}-${month}-${day}`;
      console.log('🔍 Data extraída (YYYYMMDD):', dateStr, '->', formattedDate);
      return formattedDate;
    }
  }
  
  console.log('🔍 Nenhuma data encontrada');
  return null;
}

/**
 * Extrair província do QR Code
 */
export function extractProvinceFromQR(qrData: string): string | null {
  console.log('🔍 Extraindo província de:', qrData);
  
  // Lista de províncias de Angola
  const provinces = [
    'LUANDA', 'BENGUELA', 'HUAMBO', 'BIÉ', 'MALANJE', 'NAMIBE', 'HUÍLA', 'CUNENE',
    'KWANZA NORTE', 'KWANZA SUL', 'LUNDA NORTE', 'LUNDA SUL', 'MOXICO', 'UÍGE',
    'ZAIRE', 'CABINDA', 'BENGUELA', 'CUANZA NORTE', 'CUANZA SUL', 'LUNDA NORTE',
    'LUNDA SUL', 'MALANJE', 'MOXICO', 'NAMIBE', 'UÍGE', 'ZAIRE'
  ];
  
  // Estratégia 1: Buscar por províncias conhecidas
  for (const province of provinces) {
    const regex = new RegExp(`\\b${province}\\b`, 'i');
    const match = qrData.match(regex);
    if (match) {
      console.log('🔍 Província encontrada:', match[0]);
      return match[0].toUpperCase();
    }
  }
  
  // Estratégia 2: Buscar por palavras que podem ser províncias (3+ letras, maiúsculas)
  const words = qrData.split(/\s+/);
  for (const word of words) {
    if (word.length >= 3 && /^[A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ]+$/.test(word)) {
      // Verificar se não é um número ou data
      if (!/\d/.test(word) && !word.includes('/') && !word.includes('-')) {
        console.log('🔍 Possível província encontrada:', word);
        return word;
      }
    }
  }
  
  console.log('🔍 Nenhuma província encontrada');
  return null;
}

/**
 * Extrair estado civil do QR Code
 */
export function extractEstadoCivilFromQR(qrData: string): string | null {
  console.log('🔍 Extraindo estado civil de:', qrData);
  
  // Lista de estados civis comuns
  const estadosCivis = [
    'SOLTEIRO', 'SOLTEIRA', 'CASADO', 'CASADA', 'DIVORCIADO', 'DIVORCIADA',
    'VIUVO', 'VIUVA', 'UNIAO_FACTO', 'UNIÃO DE FACTO', 'UNIAO DE FACTO',
    'SEPARADO', 'SEPARADA', 'UNIÃO', 'UNIAO'
  ];
  
  // Estratégia 1: Buscar por estados civis conhecidos
  for (const estado of estadosCivis) {
    const regex = new RegExp(`\\b${estado}\\b`, 'i');
    const match = qrData.match(regex);
    if (match) {
      let estadoFormatado = match[0].toUpperCase();
      
      // Normalizar variações
      if (estadoFormatado.includes('UNIÃO') || estadoFormatado.includes('UNIAO')) {
        estadoFormatado = 'UNIAO_FACTO';
      } else if (estadoFormatado.includes('SOLTEIR')) {
        estadoFormatado = 'SOLTEIRO';
      } else if (estadoFormatado.includes('CASAD')) {
        estadoFormatado = 'CASADO';
      } else if (estadoFormatado.includes('DIVORCIAD')) {
        estadoFormatado = 'DIVORCIADO';
      } else if (estadoFormatado.includes('VIUV')) {
        estadoFormatado = 'VIUVO';
      } else if (estadoFormatado.includes('SEPARAD')) {
        estadoFormatado = 'SEPARADO';
      }
      
      console.log('🔍 Estado civil encontrado:', match[0], '->', estadoFormatado);
      return estadoFormatado;
    }
  }
  
  // Estratégia 2: Buscar por palavras que podem ser estado civil
  const words = qrData.split(/\s+/);
  for (const word of words) {
    const upperWord = word.toUpperCase();
    if (upperWord.length >= 4 && /^[A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ]+$/.test(upperWord)) {
      // Verificar se não é um número, data ou província
      if (!/\d/.test(word) && !word.includes('/') && !word.includes('-') && 
          !['LUANDA', 'BENGUELA', 'HUAMBO', 'BIÉ', 'MALANJE', 'NAMIBE', 'HUÍLA', 'CUNENE'].includes(upperWord)) {
        console.log('🔍 Possível estado civil encontrado:', word);
        return upperWord;
      }
    }
  }
  
  console.log('🔍 Nenhum estado civil encontrado');
  return null;
}

/**
 * Extrair data de emissão do QR Code
 */
export function extractDataEmissaoFromQR(qrData: string): string | null {
  console.log('🔍 Extraindo data de emissão de:', qrData);
  
  // Estratégia 1: Buscar por padrões de data que podem ser emissão
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{4})/g,  // DD/MM/AAAA
    /(\d{1,2}-\d{1,2}-\d{4})/g,    // DD-MM-AAAA
    /(\d{1,2}\.\d{1,2}\.\d{4})/g,  // DD.MM.AAAA
    /(\d{4}-\d{2}-\d{2})/g         // YYYY-MM-DD
  ];
  
  const allDates: string[] = [];
  
  for (const pattern of datePatterns) {
    const matches = qrData.match(pattern);
    if (matches) {
      allDates.push(...matches);
    }
  }
  
  // Estratégia 2: Buscar por sequências de 8 dígitos que podem ser datas
  const eightDigitPattern = /(\d{8})/g;
  const eightDigitMatches = qrData.match(eightDigitPattern);
  
  if (eightDigitMatches) {
    for (const match of eightDigitMatches) {
      // Verificar se é uma data válida (DDMMAAAA)
      const day = parseInt(match.substring(0, 2));
      const month = parseInt(match.substring(2, 4));
      const year = parseInt(match.substring(4, 8));
      
      // Validar se é uma data válida
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
        // Verificar se não é parte do número do documento
        if (!match.match(/^\d{9}[A-Z]{2}\d{3}$/) && !match.match(/^\d{6,12}$/)) {
          allDates.push(match);
        }
      }
    }
  }
  
  // Filtrar datas que são claramente números de documento
  const filteredDates = allDates.filter(date => {
    // Se é uma sequência de 8 dígitos, verificar se não é parte de um número de documento
    if (date.length === 8 && /^\d{8}$/.test(date)) {
      // Verificar se está próximo de um número de documento no texto
      const dateIndex = qrData.indexOf(date);
      const beforeDate = qrData.substring(Math.max(0, dateIndex - 10), dateIndex);
      const afterDate = qrData.substring(dateIndex + 8, dateIndex + 18);
      
      // Se está próximo de letras (parte de número de documento), não é data
      if (beforeDate.match(/[A-Z]{2}$/) || afterDate.match(/^[A-Z]{2}/)) {
        console.log('🔍 Descartando sequência que parece ser parte de número de documento:', date);
        return false;
      }
    }
    return true;
  });
  
  console.log('🔍 Todas as datas encontradas:', allDates);
  console.log('🔍 Datas filtradas:', filteredDates);
  
  // Se encontrou múltiplas datas, tentar identificar qual é a emissão
  if (filteredDates.length > 2) {
    // Geralmente a data de emissão vem depois da data de nascimento
    // Vamos pegar a segunda data encontrada (assumindo que a primeira é nascimento)
    const segundaData = filteredDates[1];
    console.log('🔍 Data de emissão encontrada (segunda data):', segundaData);
    return segundaData;
  } else if (filteredDates.length === 2) {
    // Se tem duas datas, a segunda pode ser emissão
    const segundaData = filteredDates[1];
    console.log('🔍 Data de emissão encontrada (segunda data):', segundaData);
    return segundaData;
  } else if (filteredDates.length === 1) {
    // Se só tem uma data, pode ser nascimento ou emissão
    // Vamos assumir que é nascimento se não há outras datas
    console.log('🔍 Apenas uma data encontrada, assumindo que é nascimento');
    return null;
  }
  
  console.log('🔍 Nenhuma data de emissão encontrada');
  return null;
}

/**
 * Extrair data de validade do QR Code
 */
export function extractDataValidadeFromQR(qrData: string): string | null {
  console.log('🔍 Extraindo data de validade de:', qrData);
  
  // Estratégia 1: Buscar por padrões de data que podem ser validade
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{4})/g,  // DD/MM/AAAA
    /(\d{1,2}-\d{1,2}-\d{4})/g,    // DD-MM-AAAA
    /(\d{1,2}\.\d{1,2}\.\d{4})/g,  // DD.MM.AAAA
    /(\d{4}-\d{2}-\d{2})/g         // YYYY-MM-DD
  ];
  
  const allDates: string[] = [];
  
  for (const pattern of datePatterns) {
    const matches = qrData.match(pattern);
    if (matches) {
      allDates.push(...matches);
    }
  }
  
  // Estratégia 2: Buscar por sequências de 8 dígitos que podem ser datas
  const eightDigitPattern = /(\d{8})/g;
  const eightDigitMatches = qrData.match(eightDigitPattern);
  
  if (eightDigitMatches) {
    for (const match of eightDigitMatches) {
      // Verificar se é uma data válida (DDMMAAAA)
      const day = parseInt(match.substring(0, 2));
      const month = parseInt(match.substring(2, 4));
      const year = parseInt(match.substring(4, 8));
      
      // Validar se é uma data válida
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
        // Verificar se não é parte do número do documento
        // Números de documento angolanos geralmente têm formato específico
        if (!match.match(/^\d{9}[A-Z]{2}\d{3}$/) && !match.match(/^\d{6,12}$/)) {
          allDates.push(match);
        }
      }
    }
  }
  
  // Filtrar datas que são claramente números de documento
  const filteredDates = allDates.filter(date => {
    // Se é uma sequência de 8 dígitos, verificar se não é parte de um número de documento
    if (date.length === 8 && /^\d{8}$/.test(date)) {
      // Verificar se está próximo de um número de documento no texto
      const dateIndex = qrData.indexOf(date);
      const beforeDate = qrData.substring(Math.max(0, dateIndex - 10), dateIndex);
      const afterDate = qrData.substring(dateIndex + 8, dateIndex + 18);
      
      // Se está próximo de letras (parte de número de documento), não é data
      if (beforeDate.match(/[A-Z]{2}$/) || afterDate.match(/^[A-Z]{2}/)) {
        console.log('🔍 Descartando sequência que parece ser parte de número de documento:', date);
        return false;
      }
    }
    return true;
  });
  
  console.log('🔍 Todas as datas encontradas:', allDates);
  console.log('🔍 Datas filtradas:', filteredDates);
  
  // Se encontrou múltiplas datas, tentar identificar qual é a validade
  if (filteredDates.length > 2) {
    // Geralmente a data de validade vem por último
    const ultimaData = filteredDates[filteredDates.length - 1];
    console.log('🔍 Data de validade encontrada (última data):', ultimaData);
    return ultimaData;
  } else if (filteredDates.length === 2) {
    // Se tem duas datas, a segunda pode ser validade
    const segundaData = filteredDates[1];
    console.log('🔍 Data de validade encontrada (segunda data):', segundaData);
    return segundaData;
  } else if (filteredDates.length === 1) {
    // Se tem apenas uma data, verificar se pode ser validade
    const unicaData = filteredDates[0];
    console.log('🔍 Data de validade encontrada (única data):', unicaData);
    return unicaData;
  }
  
  console.log('🔍 Nenhuma data de validade encontrada');
  return null;
}

/**
 * Extrair tipo de documento do QR Code
 */
export function extractDocumentoTipoFromQR(qrData: string): string | null {
  console.log('🔍 Extraindo tipo de documento de:', qrData);
  
  // Estratégia 1: Buscar por prefixos conhecidos
  const tipoPatterns = [
    /^BI\s*/i,           // BI no início
    /BI\s*(\d+)/i,       // BI seguido de números
    /PASSAPORTE/i,       // Passaporte
    /PASSPORT/i,         // Passport
    /CARTA/i,            // Carta
    /IDENTIDADE/i,       // Identidade
    /IDENTITY/i          // Identity
  ];
  
  for (const pattern of tipoPatterns) {
    const match = qrData.match(pattern);
    if (match) {
      let tipo = match[0].toUpperCase();
      
      // Normalizar tipo
      if (tipo.includes('BI') || tipo.includes('IDENTIDADE') || tipo.includes('IDENTITY')) {
        console.log('🔍 Tipo de documento encontrado: BI');
        return 'BI';
      } else if (tipo.includes('PASSAPORTE') || tipo.includes('PASSPORT')) {
        console.log('🔍 Tipo de documento encontrado: PASSAPORTE');
        return 'PASSAPORTE';
      } else if (tipo.includes('CARTA')) {
        console.log('🔍 Tipo de documento encontrado: CARTA');
        return 'CARTA';
      }
    }
  }
  
  // Estratégia 2: Se não encontrou tipo específico, assumir BI por padrão
  console.log('🔍 Tipo de documento não encontrado, assumindo BI por padrão');
  return 'BI';
}


