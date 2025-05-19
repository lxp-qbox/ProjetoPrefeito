
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import type { ReactNode} from 'react';
import { useEffect } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function ProtectedPage({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace("/login?redirect=" + window.location.pathname);
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-250px)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
