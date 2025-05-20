
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import AppContentWrapper from '@/components/layout/app-content-wrapper'; // Import the new wrapper

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'The Presidential Agency',
  description: 'Join exciting bingo games and manage your profile with The Presidential Agency.',
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} font-sans antialiased flex flex-col min-h-screen bg-background`}>
        <AuthProvider>
          <AppContentWrapper>{children}</AppContentWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
