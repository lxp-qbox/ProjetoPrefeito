import React, { memo } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  /**
   * URL para onde o botão deve navegar
   */
  href: string;
  
  /**
   * Se o botão deve estar desabilitado
   */
  disabled?: boolean;
  
  /**
   * Texto do título do botão (para acessibilidade)
   * @default "Voltar"
   */
  title?: string;
  
  /**
   * Posição absoluta do botão no topo/esquerda da página 
   * @default true
   */
  absolute?: boolean;
}

/**
 * Botão de voltar padronizado para o fluxo de onboarding
 */
function BackButtonComponent({ 
  href, 
  disabled = false, 
  title = "Voltar",
  absolute = true
}: BackButtonProps) {
  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className={`${absolute ? 'absolute top-4 left-4 z-10' : ''} h-12 w-12 rounded-full text-muted-foreground hover:bg-muted hover:text-primary transition-colors`}
      title={title}
      disabled={disabled}
    >
      <Link href={href}>
        <ArrowLeft className="h-8 w-8" />
        <span className="sr-only">{title}</span>
      </Link>
    </Button>
  );
}

/**
 * Versão memoizada do BackButton para evitar renderizações desnecessárias.
 * Como o botão de voltar raramente muda durante o ciclo de vida do componente,
 * a memoização pode reduzir renderizações desnecessárias.
 */
export const BackButton = memo(BackButtonComponent); 