/**
 * Utilidades para otimização de performance
 */

/**
 * Executa uma função após um debounce (atraso)
 * Útil para evitar múltiplas chamadas em eventos como resize, scroll ou input
 * 
 * @param func Função a ser executada
 * @param wait Tempo de espera em ms
 * @param immediate Se deve executar imediatamente
 * @returns Função com debounce
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T, 
  wait: number, 
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
    
    if (callNow) {
      func.apply(context, args);
    }
  };
}

/**
 * Executa uma função com throttle (limita execuções a cada X ms)
 * Útil para eventos contínuos como scroll, resize ou arrasto do mouse
 * 
 * @param func Função a ser executada
 * @param limit Limite de tempo em ms
 * @returns Função com throttle
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      lastRan = Date.now();
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

/**
 * Adia a execução de uma tarefa para o próximo ciclo do event loop
 * Útil para tarefas pesadas que não são críticas para o carregamento inicial
 * 
 * @param callback Função a ser executada
 */
export function deferTask(callback: () => void): void {
  setTimeout(callback, 0);
}

/**
 * Executa uma tarefa quando o browser estiver ocioso
 * Usa requestIdleCallback com fallback para setTimeout
 * 
 * @param callback Função a ser executada
 * @param options Opções para requestIdleCallback
 */
export function runWhenIdle(
  callback: () => void,
  options?: { timeout?: number }
): void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => callback(), options);
  } else {
    // Fallback para navegadores que não suportam requestIdleCallback
    setTimeout(callback, options?.timeout || 1);
  }
}

/**
 * Mede o tempo de execução de uma função
 * Útil para diagnóstico de performance
 * 
 * @param name Nome da medição
 * @param fn Função a ser medida
 * @returns Resultado da função
 */
export function measurePerformance<T>(name: string, fn: () => T): T {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Performance] ${name}: ${(endTime - startTime).toFixed(2)}ms`);
  }
  
  return result;
} 