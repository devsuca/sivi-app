// Utilitário para debug do formulário de visitas
export const debugFormData = (data: any, label: string) => {
  console.group(`🔍 DEBUG: ${label}`);
  console.log('Dados:', data);
  if (Array.isArray(data)) {
    console.log('Tipo: Array');
    console.log('Quantidade:', data.length);
    if (data.length > 0) {
      console.log('Primeiro item:', data[0]);
      console.log('Tipos dos campos do primeiro item:');
      Object.entries(data[0]).forEach(([key, value]) => {
        console.log(`  ${key}: ${typeof value} = ${value}`);
      });
    }
  } else if (typeof data === 'object' && data !== null) {
    console.log('Tipo: Object');
    console.log('Chaves:', Object.keys(data));
    Object.entries(data).forEach(([key, value]) => {
      console.log(`  ${key}: ${typeof value} = ${value}`);
    });
  } else {
    console.log('Tipo:', typeof data);
    console.log('Valor:', data);
  }
  console.groupEnd();
};

export const debugFormState = (formState: any) => {
  console.group('📋 ESTADO DO FORMULÁRIO');
  Object.entries(formState).forEach(([key, value]) => {
    console.log(`${key}: ${typeof value} = ${value}`);
  });
  console.groupEnd();
};

export const debugSelectOptions = (options: any[], label: string) => {
  console.group(`📋 OPÇÕES: ${label}`);
  console.log('Quantidade:', options.length);
  options.forEach((option, index) => {
    console.log(`${index}:`, option);
  });
  console.groupEnd();
};

