
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import type { ReactNode } from 'react';

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ProtectedPage>
      <div className="flex justify-center items-center h-screen p-4 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 overflow-hidden">
        {children}
      </div>
    </ProtectedPage>
  );
}
