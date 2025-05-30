import { useEffect, useRef, DependencyList } from 'react';

/**
 * Hook similar ao useEffect, mas com proteção contra memory leaks e efeitos desatualizados
 * quando o componente é desmontado.
 * 
 * @param effect Função de efeito a ser executada
 * @param deps Array de dependências
 */
export function useSafeEffect(
  effect: () => void | (() => void),
  deps?: DependencyList
) {
  // Ref para rastrear se o componente está montado
  const isMounted = useRef(true);
  
  // Efeito principal
  useEffect(() => {
    // Apenas executa o efeito se o componente estiver montado
    if (isMounted.current) {
      const cleanup = effect();
      
      return () => {
        // Limpa quando o componente desmontar
        if (cleanup) cleanup();
        isMounted.current = false;
      };
    }
  }, deps);
}

/**
 * Hook similar ao useEffect, mas com proteção contra chamadas desatualizadas em funções assíncronas
 * 
 * @param asyncEffect Função assíncrona de efeito
 * @param deps Array de dependências
 */
export function useAsyncEffect(
  asyncEffect: () => Promise<void | (() => void)>,
  deps?: DependencyList
) {
  // Ref para rastrear se o componente está montado
  const isMounted = useRef(true);
  
  // Efeito para executar a função assíncrona
  useEffect(() => {
    // Flag para rastrear a versão mais recente do efeito
    let effectVersion = true;
    
    // Executa o efeito assíncrono
    const executeAsyncEffect = async () => {
      try {
        const cleanup = await asyncEffect();
        
        // Verifica se ainda é a versão mais recente e se o componente está montado
        if (effectVersion && isMounted.current && cleanup) {
          return cleanup;
        }
      } catch (error) {
        // Apenas loga o erro se o componente ainda estiver montado e for a versão mais recente
        if (effectVersion && isMounted.current) {
          console.error('Error in async effect:', error);
        }
      }
    };
    
    executeAsyncEffect();
    
    // Função de limpeza
    return () => {
      effectVersion = false;
      isMounted.current = false;
    };
  }, deps);
}

/**
 * Hook para executar um callback quando o componente for montado
 * 
 * @param callback Função a ser executada na montagem
 */
export function useMount(callback: () => void) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(callback, []);
}

/**
 * Hook para executar um callback quando o componente for desmontado
 * 
 * @param callback Função a ser executada na desmontagem
 */
export function useUnmount(callback: () => void) {
  // Ref para armazenar o callback
  const callbackRef = useRef(callback);
  
  // Atualiza a ref quando o callback mudar
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  // Executa apenas na desmontagem
  useEffect(() => {
    return () => callbackRef.current();
  }, []);
} 