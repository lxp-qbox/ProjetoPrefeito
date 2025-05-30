import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import AppContentWrapper from '@/components/layout/app-content-wrapper';

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'The Presidential Agency',
  description: 'Sua plataforma web para jogos de bingo emocionantes e gerenciamento de perfil com The Presidential Agency.',
  keywords: 'bingo, jogos, apostas, kako live, entretenimento, casino',
  authors: [{ name: 'The Presidential Agency' }],
  creator: 'The Presidential Agency',
  publisher: 'The Presidential Agency',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://presidentialagency.com/',
    title: 'The Presidential Agency',
    description: 'Sua plataforma web para jogos de bingo emocionantes e gerenciamento de perfil.',
    siteName: 'The Presidential Agency',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'The Presidential Agency',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Presidential Agency',
    description: 'Sua plataforma web para jogos de bingo emocionantes e gerenciamento de perfil.',
    images: ['/twitter-image.jpg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#4285F4',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={poppins.variable}>
      <body className="font-sans antialiased flex flex-col min-h-screen bg-background" suppressHydrationWarning>
        <AuthProvider>
          <AppContentWrapper>{children}</AppContentWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
