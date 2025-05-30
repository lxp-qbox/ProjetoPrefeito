import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile } from '@/types';

type OnboardingStep = 
  | 'terms'
  | 'role-selection'
  | 'age-verification'
  | 'contact-info'
  | 'kako-account-check'
  | 'kako-creation-choice'
  | 'kako-download'
  | 'kako-agent-assist'
  | 'kako-id-input';

/**
 * Interface para o estado global do fluxo de onboarding
 */
interface OnboardingState {
  // Estado atual
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  
  // Dados do formulário
  agreed: boolean;
  role: UserProfile['role'] | null;
  username: string;
  gender: UserProfile['gender'] | null;
  birthDate: string | null;
  country: string;
  phoneNumber: string;
  foundUsVia: string;
  referralCode: string;
  showId: string;
  
  // Controle de navegação
  isNavigating: boolean;
  isLoading: boolean;
  loadingAction: string | null;
  
  // Métodos
  setCurrentStep: (step: OnboardingStep) => void;
  markStepCompleted: (step: OnboardingStep) => void;
  resetNavigation: () => void;
  startNavigation: (action?: string) => void;
  
  // Setters
  setAgreed: (agreed: boolean) => void;
  setRole: (role: UserProfile['role'] | null) => void;
  setUsername: (username: string) => void;
  setGender: (gender: UserProfile['gender'] | null) => void;
  setBirthDate: (date: string | null) => void;
  setCountry: (country: string) => void;
  setPhoneNumber: (phoneNumber: string) => void;
  setFoundUsVia: (foundUsVia: string) => void;
  setReferralCode: (referralCode: string) => void;
  setShowId: (showId: string) => void;
  
  // Reset
  resetStore: () => void;
}

/**
 * Store Zustand para gerenciar o estado global do fluxo de onboarding
 */
export const useOnboardingStore = create<OnboardingState>()(
  // Adicionando persistência para manter o estado entre recarregamentos
  persist(
    (set) => ({
      // Estado inicial
      currentStep: 'terms',
      completedSteps: [],
      
      // Dados iniciais
      agreed: false,
      role: null,
      username: '',
      gender: null,
      birthDate: null,
      country: 'Brasil',
      phoneNumber: '',
      foundUsVia: '',
      referralCode: '',
      showId: '',
      
      // Estado de navegação
      isNavigating: false,
      isLoading: false,
      loadingAction: null,
      
      // Métodos para atualizar estado
      setCurrentStep: (step) => set({ currentStep: step }),
      markStepCompleted: (step) => set((state) => ({ 
        completedSteps: state.completedSteps.includes(step) 
          ? state.completedSteps 
          : [...state.completedSteps, step] 
      })),
      resetNavigation: () => set({ isNavigating: false, isLoading: false, loadingAction: null }),
      startNavigation: (action) => set({ isNavigating: true, isLoading: true, loadingAction: action || null }),
      
      // Setters
      setAgreed: (agreed) => set({ agreed }),
      setRole: (role) => set({ role }),
      setUsername: (username) => set({ username }),
      setGender: (gender) => set({ gender }),
      setBirthDate: (birthDate) => set({ birthDate }),
      setCountry: (country) => set({ country }),
      setPhoneNumber: (phoneNumber) => set({ phoneNumber }),
      setFoundUsVia: (foundUsVia) => set({ foundUsVia }),
      setReferralCode: (referralCode) => set({ referralCode }),
      setShowId: (showId) => set({ showId }),
      
      // Reset completo do store
      resetStore: () => set({
        currentStep: 'terms',
        completedSteps: [],
        agreed: false,
        role: null,
        username: '',
        gender: null,
        birthDate: null,
        country: 'Brasil',
        phoneNumber: '',
        foundUsVia: '',
        referralCode: '',
        showId: '',
        isNavigating: false,
        isLoading: false,
        loadingAction: null
      })
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

/**
 * Hook seletor para recuperar apenas os dados do formulário do onboarding
 */
export const useOnboardingData = () => useOnboardingStore(state => ({
  agreed: state.agreed,
  role: state.role,
  username: state.username,
  gender: state.gender,
  birthDate: state.birthDate,
  country: state.country,
  phoneNumber: state.phoneNumber,
  foundUsVia: state.foundUsVia,
  referralCode: state.referralCode,
  showId: state.showId
}));

/**
 * Hook seletor para recuperar apenas os estados de navegação
 */
export const useOnboardingNavigation = () => useOnboardingStore(state => ({
  isNavigating: state.isNavigating,
  isLoading: state.isLoading,
  loadingAction: state.loadingAction,
  resetNavigation: state.resetNavigation,
  startNavigation: state.startNavigation
})); 