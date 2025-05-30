"use client";

import { useContext } from "react";
import { AuthContext } from "@/contexts/auth-context";
import { UserProfile } from "@/types";

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  // Adiciona função para verificar se o onboarding está completo
  const isOnboardingComplete = (user: UserProfile | null): boolean => {
    if (!user) return false;
    
    // Verifica todos os campos necessários para o cadastro completo
    return !!(
      user.isVerified &&
      user.agreedToTermsAt &&
      user.role &&
      user.birthDate &&
      user.gender &&
      user.country &&
      user.phoneNumber &&
      user.foundUsVia &&
      user.hasCompletedOnboarding
    );
  };
  
  return {
    ...context,
    isOnboardingComplete
  };
}
