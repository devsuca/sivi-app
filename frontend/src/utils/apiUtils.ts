/**
 * Utilitários para lidar com respostas da API
 */

/**
 * Extrai dados de uma resposta da API, lidando com paginação do Django REST Framework
 * @param responseData - Dados da resposta da API
 * @returns Array de dados ou array vazio se não encontrar dados válidos
 */
export function extractDataFromResponse(responseData: any): any[] {
  if (!responseData || typeof responseData !== 'object') {
    console.error('❌ Erro: responseData não é um objeto válido:', responseData);
    return [];
  }

  if (Array.isArray(responseData)) {
    // Resposta direta como array
    return responseData;
  } else if (responseData.results && Array.isArray(responseData.results)) {
    // Resposta paginada - usar a propriedade 'results'
    return responseData.results;
  } else if (responseData.data && Array.isArray(responseData.data)) {
    // Resposta com propriedade 'data'
    return responseData.data;
  } else {
    console.error('❌ Erro: Estrutura de resposta não reconhecida:', responseData);
    return [];
  }
}

/**
 * Extrai dados de uma resposta da API e aplica uma transformação
 * @param responseData - Dados da resposta da API
 * @param transformFn - Função para transformar cada item
 * @returns Array de dados transformados
 */
export function extractAndTransformData<T, R>(
  responseData: any, 
  transformFn: (item: T) => R
): R[] {
  const data = extractDataFromResponse(responseData);
  return data.map(transformFn);
}
