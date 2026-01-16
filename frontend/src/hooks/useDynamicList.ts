
import { useReducer } from 'react';

// Generic state and action types for the reducer
type State<T> = T[];
type Action<T> = 
  | { type: 'ADD', item: T }
  | { type: 'REMOVE', index: number }
  | { type: 'UPDATE', index: number, field: keyof T, value: any };

// Generic reducer
function listReducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case 'ADD':
      return [...state, action.item];
    case 'REMOVE':
      return state.filter((_, i) => i !== action.index);
    case 'UPDATE':
      return state.map((item, i) => 
        i === action.index ? { ...item, [action.field]: action.value } : item
      );
    default:
      throw new Error('Unhandled action type');
  }
}

export function useDynamicList<T>(initialState: T[] = []) {
  const [items, dispatch] = useReducer(listReducer<T>, initialState);

  const addItem = (item: T) => {
    dispatch({ type: 'ADD', item });
  };

  const removeItem = (index: number) => {
    dispatch({ type: 'REMOVE', index });
  };

  const updateItem = (index: number, field: keyof T, value: any) => {
    dispatch({ type: 'UPDATE', index, field, value });
  };

  return { items, addItem, removeItem, updateItem };
}
