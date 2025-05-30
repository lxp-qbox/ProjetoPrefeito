import { lazy } from 'react';

/**
 * Implementação de code splitting com lazy loading para as páginas de onboarding
 * 
 * Isso divide o bundle da aplicação, carregando cada página apenas quando necessário,
 * melhorando o tempo de carregamento inicial da aplicação.
 */

// Lazy load das páginas de onboarding
export const TermsPage = lazy(() => import('./terms/page'));
export const RoleSelectionPage = lazy(() => import('./role-selection/page'));
export const AgeVerificationPage = lazy(() => import('./age-verification/page'));
export const ContactInfoPage = lazy(() => import('./contact-info/page'));
export const KakoAccountCheckPage = lazy(() => import('./kako-account-check/page'));
export const KakoCreationChoicePage = lazy(() => import('./kako-creation-choice/page'));
export const KakoDownloadPage = lazy(() => import('./kako-download/page'));
export const KakoAgentAssistPage = lazy(() => import('./kako-agent-assist/page'));
export const KakoIdInputPage = lazy(() => import('./kako-id-input/page'));

// Mapeamento de chaves de etapas para componentes
export const ONBOARDING_ROUTES = {
  'terms': TermsPage,
  'role-selection': RoleSelectionPage,
  'age-verification': AgeVerificationPage,
  'contact-info': ContactInfoPage,
  'kako-account-check': KakoAccountCheckPage,
  'kako-creation-choice': KakoCreationChoicePage,
  'kako-download': KakoDownloadPage,
  'kako-agent-assist': KakoAgentAssistPage,
  'kako-id-input': KakoIdInputPage,
}; 