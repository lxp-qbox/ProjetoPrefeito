import { useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import { useOnboardingStore } from '@/store/onboarding-store';

/**
 * Tipo de função seletora para extrair um slice de estado
 */
type SelectorFn<State, Selected> = (state: State) => Selected;

/**
 * Hook que seleciona um slice do estado Zustand com memoização para evitar 
 * renderizações desnecessárias, utilizando comparação rasa por padrão.
 * 
 * @param selector Função que seleciona um slice do estado
 * @param equalityFn Função opcional para comparar estados (shallow por padrão)
 * @returns O slice selecionado do estado
 */
export function useMemoizedSelector<Selected>(
  selector: SelectorFn<ReturnType<typeof useOnboardingStore>, Selected>,
  equalityFn = shallow
): Selected {
  // Seleciona o estado do store com a função de igualdade passada
  const selectedState = useOnboardingStore(selector, equalityFn);
  
  // Memoiza o resultado para evitar referências novas
  return useMemo(() => selectedState, [selectedState]);
}

/**
 * Hook para selecionar múltiplos valores independentes do estado com memoização
 * para cada um, evitando renderizações quando apenas um deles muda.
 * 
 * @param selectors Objeto com funções seletoras
 * @returns Objeto com valores selecionados memoizados
 */
export function useMemoizedSelectors<T extends Record<string, SelectorFn<ReturnType<typeof useOnboardingStore>, any>>>(
  selectors: T
): { [K in keyof T]: ReturnType<T[K]> } {
  const result = {} as { [K in keyof T]: ReturnType<T[K]> };
  
  // Para cada seletor no objeto
  for (const key in selectors) {
    if (Object.prototype.hasOwnProperty.call(selectors, key)) {
      // Seleciona e memoiza individualmente
      result[key] = useMemoizedSelector(selectors[key]);
    }
  }
  
  // Memoiza o objeto de resultado para manter referência estável
  return useMemo(() => result, Object.values(result));
}

/**
 * Hook que seleciona apenas dados do formulário relacionados ao onboarding
 * com memoização para evitar renderizações desnecessárias.
 */
export function useMemoizedOnboardingData() {
  return useMemoizedSelector(state => ({
    agreed: state.agreed,
    role: state.role,
    username: state.username,
    gender: state.gender,
    birthDate: state.birthDate,
    country: state.country,
    phoneNumber: state.phoneNumber,
    foundUsVia: state.foundUsVia,
    referralCode: state.referralCode,
    showId: state.showId
  }));
}

/**
 * Hook que seleciona apenas estados de navegação do onboarding
 * com memoização para evitar renderizações desnecessárias.
 */
export function useMemoizedNavigationState() {
  return useMemoizedSelector(state => ({
    isNavigating: state.isNavigating,
    isLoading: state.isLoading,
    loadingAction: state.loadingAction,
    resetNavigation: state.resetNavigation,
    startNavigation: state.startNavigation
  }));
} 