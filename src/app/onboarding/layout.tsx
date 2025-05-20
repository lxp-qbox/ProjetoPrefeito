
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import type { ReactNode } from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const isMobile = useIsMobile();

  return (
    <ProtectedPage>
      <div className={cn(
        "flex justify-center items-center h-screen overflow-hidden",
        !isMobile && "p-4 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900",
        isMobile && "bg-card p-0"
      )}>
        <Card className={cn(
          "w-full max-w-md flex flex-col overflow-hidden",
          !isMobile && "shadow-xl max-h-[calc(100%-2rem)] aspect-[9/16]",
          isMobile && "h-full shadow-none rounded-none"
        )}>
          {children}
        </Card>
      </div>
    </ProtectedPage>
  );
}
