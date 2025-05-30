import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface UseOnboardingNavigationProps {
  /**
   * URL para onde navegar quando a ação for concluída
   */
  navigateTo: string;
  
  /**
   * Tempo de delay antes da navegação em milissegundos
   * @default 100
   */
  delay?: number;
}

/**
 * Hook para gerenciar navegação entre páginas de onboarding com proteção contra
 * múltiplos cliques e recarregamentos.
 */
export function useOnboardingNavigation({ navigateTo, delay = 100 }: UseOnboardingNavigationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Limpar estado de navegação no desmonte do componente
  useEffect(() => {
    return () => {
      setNavigating(false);
    };
  }, []);

  // Função memoizada para verificar se está em transição
  const isTransitioning = useMemo(() => isLoading || navigating, [isLoading, navigating]);

  // Função memoizada para redefinir estados
  const resetNavigation = useCallback(() => {
    setIsLoading(false);
    setNavigating(false);
  }, []);

  // Função de navegação segura, memoizada para evitar recriação em cada renderização
  const navigate = useCallback((options?: { 
    loadingAction?: string;
    showToast?: boolean; 
    toastMessage?: { title: string; description: string } 
  }) => {
    if (isTransitioning) return false;
    
    setIsLoading(true);
    setNavigating(true);
    
    // Mostrar toast se requisitado
    if (options?.showToast && options.toastMessage) {
      toast(options.toastMessage);
    }
    
    // Adicionar pequeno delay para garantir feedback visual
    const timeoutId = setTimeout(() => {
      router.push(navigateTo);
    }, delay);
    
    // Cleanup para evitar memory leaks
    return () => clearTimeout(timeoutId);
  }, [isTransitioning, router, navigateTo, delay, toast]);

  // Retornar objeto memoizado para evitar recriação em cada renderização
  return useMemo(() => ({
    isLoading,
    navigating,
    isTransitioning,
    navigate,
    resetNavigation,
    setIsLoading
  }), [isLoading, navigating, isTransitioning, navigate, resetNavigation]);
} 