
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google'; // Changed from Geist
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import AppContentWrapper from '@/components/layout/app-content-wrapper';

// Changed font to Poppins
const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'], // Added common weights
});

export const metadata: Metadata = {
  title: 'The Presidential Agency',
  description: 'Sua plataforma web para jogos de bingo emocionantes e gerenciamento de perfil com The Presidential Agency.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      {/* Applied Poppins variable */}
      <body className={`${poppins.variable} font-sans antialiased flex flex-col min-h-screen bg-background`}>
        <AuthProvider>
          <AppContentWrapper>{children}</AppContentWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
