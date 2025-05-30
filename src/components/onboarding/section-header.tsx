import React, { ReactNode, memo } from 'react';
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  /**
   * Título principal da seção
   */
  title: string;
  
  /**
   * Texto de descrição abaixo do título
   */
  description: string | ReactNode;
  
  /**
   * Ícone a ser exibido no topo
   */
  icon: LucideIcon;
  
  /**
   * Classe adicional para o ícone
   * @default "text-primary"
   */
  iconClassName?: string;
  
  /**
   * Se deve exibir o separador abaixo do cabeçalho
   * @default true
   */
  showSeparator?: boolean;
}

/**
 * Cabeçalho padronizado para as seções de onboarding
 */
function SectionHeaderComponent({
  title,
  description,
  icon: Icon,
  iconClassName = "text-primary",
  showSeparator = true
}: SectionHeaderProps) {
  return (
    <>
      <CardHeader className="h-[200px] flex flex-col justify-center items-center text-center px-6 pb-0">
        <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto mt-8">
          <Icon className={`h-8 w-8 ${iconClassName}`} />
        </div>
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      {showSeparator && <Separator className="my-6" />}
    </>
  );
}

/**
 * Versão memoizada do SectionHeader para evitar renderizações desnecessárias.
 * Como o cabeçalho raramente muda durante o ciclo de vida do componente,
 * a memoização pode reduzir renderizações desnecessárias.
 */
export const SectionHeader = memo(SectionHeaderComponent); 