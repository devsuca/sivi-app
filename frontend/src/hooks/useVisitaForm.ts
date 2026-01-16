
import { useReducer, useCallback } from 'react';
import { VisitaFormState, Acompanhante, Viatura } from '@/types/visita';
import { Pertence } from '@/types/pertence';
import { useAuth } from '@/lib/auth';

// Form Action Type
type FormAction = 
  | { type: 'SET_FIELD', field: keyof VisitaFormState, value: any }
  | { type: 'SET_ACOMPANHANTES', payload: Acompanhante[] }
  | { type: 'SET_VIATURAS', payload: Viatura[] }
  | { type: 'SET_PERTENCES', payload: Pertence[] }
  | { type: 'RESET' };

// Initial State
export const initialState: VisitaFormState = {
  visitante: '',
  efetivo_visitar: '',
  orgao: '',
  motivo: '',
  estado: 'agendada',
  data_hora_entrada: new Date().toISOString().slice(0, 16),
  observacoes: '',
  acompanhantes: [],
  viaturas: [],
  pertences: [],
  is_interveniente_processo: false,
  numero_processo: '',
};

// Form Reducer
function formReducer(state: VisitaFormState, action: FormAction): VisitaFormState {
  console.log('🟣 formReducer - Action recebida:', action);
  switch (action.type) {
    case 'SET_FIELD':
      const newState = { ...state, [action.field]: action.value };
      console.log('🟣 formReducer - Novo estado:', newState);
      return newState;
    case 'SET_ACOMPANHANTES':
      return { ...state, acompanhantes: action.payload };
    case 'SET_VIATURAS':
        return { ...state, viaturas: action.payload };
    case 'SET_PERTENCES':
        return { ...state, pertences: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function useVisitaForm() {
  const { user } = useAuth();
  
  // Estado inicial baseado no role do usuário
  const getInitialState = (): VisitaFormState => {
    const currentDateTime = new Date().toISOString().slice(0, 16);
    console.log('🕐 useVisitaForm - Data/hora atual definida:', currentDateTime);
    
    return {
      ...initialState,
      estado: user?.role === 'recepcao' ? 'agendada' : initialState.estado,
      orgao: user?.role === 'recepcao' && user?.orgao ? String(user.orgao.id) : initialState.orgao,
      data_hora_entrada: currentDateTime // Garantir que sempre tenha a data/hora atual
    };
  };
  
  const [formState, dispatch] = useReducer(formReducer, getInitialState());

  const setFormField = useCallback((field: keyof VisitaFormState, value: any) => {
    console.log('🟢 useVisitaForm - setFormField chamado:', { field, value, valueType: typeof value });
    dispatch({ type: 'SET_FIELD', field, value });
  }, []);

  const setAcompanhantes = useCallback((acompanhantes: Acompanhante[]) => {
    dispatch({ type: 'SET_ACOMPANHANTES', payload: acompanhantes });
  }, []);

  const setViaturas = useCallback((viaturas: Viatura[]) => {
    dispatch({ type: 'SET_VIATURAS', payload: viaturas });
  }, []);

  const setPertences = useCallback((pertences: Pertence[]) => {
    dispatch({ type: 'SET_PERTENCES', payload: pertences });
  }, []);

  const resetForm = useCallback(() => {
    // Para recepção, garantir que o estado seja sempre "agendada" e o órgão seja o do usuário
    if (user?.role === 'recepcao') {
      dispatch({ type: 'SET_FIELD', field: 'estado', value: 'agendada' });
      if (user?.orgao) {
        dispatch({ type: 'SET_FIELD', field: 'orgao', value: String(user.orgao.id) });
      }
    }
    dispatch({ type: 'RESET' });
    // Após reset, garantir que a data/hora atual seja definida
    dispatch({ type: 'SET_FIELD', field: 'data_hora_entrada', value: new Date().toISOString().slice(0, 16) });
  }, [user?.role, user?.orgao]);

  return { formState, setFormField, setAcompanhantes, setViaturas, setPertences, resetForm };
}
