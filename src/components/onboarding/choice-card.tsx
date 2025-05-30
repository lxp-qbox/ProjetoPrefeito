import React, { ReactNode, memo } from 'react';
import { Card } from "@/components/ui/card";
import { LucideIcon } from 'lucide-react';
import LoadingSpinner from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

interface ChoiceCardProps {
  /**
   * Título do card
   */
  title: string;
  
  /**
   * Descrição do card
   */
  description: string;
  
  /**
   * Ícone a ser exibido no card
   */
  icon: LucideIcon;
  
  /**
   * Função de callback ao clicar no card
   */
  onClick: () => void;
  
  /**
   * Se o card está em estado de carregamento
   */
  isLoading?: boolean;
  
  /**
   * Se o card deve estar desabilitado
   */
  disabled?: boolean;
  
  /**
   * Altura do contêiner de carregamento
   * @default "100px"
   */
  loadingHeight?: string;
  
  /**
   * Tamanho do spinner de carregamento
   * @default "md"
   */
  spinnerSize?: "sm" | "md" | "lg";
}

/**
 * Card de escolha para o fluxo de onboarding
 */
function ChoiceCardComponent({
  title,
  description,
  icon: Icon,
  onClick,
  isLoading = false,
  disabled = false,
  loadingHeight = "100px",
  spinnerSize = "md"
}: ChoiceCardProps) {
  const isInteractive = !isLoading && !disabled;
  
  return (
    <Card
      className={cn(
        "p-6 flex flex-col items-center text-center cursor-pointer transition-shadow transform",
        isInteractive ? "hover:shadow-lg hover:scale-105" : "",
        disabled && "opacity-70"
      )}
      onClick={() => isInteractive && onClick()}
      role="button"
      tabIndex={isInteractive ? 0 : -1}
      onKeyDown={(e) => isInteractive && e.key === 'Enter' && onClick()}
      aria-disabled={!isInteractive}
    >
      {isLoading ? (
        <div className={`h-[${loadingHeight}] flex items-center justify-center`}>
          <LoadingSpinner size={spinnerSize} />
        </div>
      ) : (
        <>
          <div className="p-3 bg-primary/10 rounded-full mb-3">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </>
      )}
    </Card>
  );
}

/**
 * Versão memoizada do ChoiceCard para evitar renderizações desnecessárias.
 * Apenas renderiza novamente se alguma prop mudar.
 */
export const ChoiceCard = memo(ChoiceCardComponent, (prevProps, nextProps) => {
  // Comparação personalizada para determinar se precisa renderizar novamente
  return (
    prevProps.title === nextProps.title &&
    prevProps.description === nextProps.description &&
    prevProps.icon === nextProps.icon &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.disabled === nextProps.disabled &&
    // Para onClick, comparamos apenas a referência (comportamento padrão)
    prevProps.onClick === nextProps.onClick
  );
}); 