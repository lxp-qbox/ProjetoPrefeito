import React, { ReactNode, memo } from 'react';
import { Button } from "@/components/ui/button";
import { LucideIcon } from 'lucide-react';
import LoadingSpinner from "@/components/ui/loading-spinner";

interface ActionButtonProps {
  /**
   * Texto do botão
   */
  children: ReactNode;
  
  /**
   * Função de callback ao clicar no botão
   */
  onClick: () => void;
  
  /**
   * Se o botão deve estar desabilitado
   */
  disabled?: boolean;
  
  /**
   * Se o botão está em estado de carregamento
   */
  isLoading?: boolean;
  
  /**
   * Ícone a ser exibido ao lado do texto quando não estiver carregando
   */
  icon?: LucideIcon;
  
  /**
   * Classe CSS adicional para o botão
   */
  className?: string;
  
  /**
   * Variante do botão
   * @default "default"
   */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  
  /**
   * Tamanho do spinner quando em carregamento
   * @default "sm"
   */
  spinnerSize?: "sm" | "md" | "lg";
}

/**
 * Botão de ação padronizado para o fluxo de onboarding
 */
function ActionButtonComponent({
  children,
  onClick,
  disabled = false,
  isLoading = false,
  icon: Icon,
  className = "w-full mt-auto",
  variant = "default",
  spinnerSize = "sm"
}: ActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={className}
      disabled={disabled || isLoading}
      variant={variant}
    >
      {isLoading ? (
        <LoadingSpinner size={spinnerSize} className="mr-2" />
      ) : Icon ? (
        <Icon className="mr-2 h-4 w-4" />
      ) : null}
      {children}
    </Button>
  );
}

/**
 * Versão memoizada do ActionButton para evitar renderizações desnecessárias.
 */
export const ActionButton = memo(ActionButtonComponent); 