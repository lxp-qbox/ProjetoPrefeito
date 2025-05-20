
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import AppContentWrapper from '@/components/layout/app-content-wrapper';

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'The Presidential Agency',
  description: 'Sua plataforma web para jogos de bingo emocionantes e gerenciamento de perfil com The Presidential Agency.',
  icons: {
    icon: '/favicon.ico',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#4285F4" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${poppins.variable} font-sans antialiased flex flex-col min-h-screen bg-background`}>
        <AuthProvider>
          <AppContentWrapper>{children}</AppContentWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
