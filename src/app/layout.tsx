import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'SafeTrade Ghana — Secure Escrow for Social Commerce',
  description:
    'Stop getting scammed on Instagram and WhatsApp. SafeTrade holds your money in escrow until you receive your item. Trustworthy commerce for Ghana.',
  keywords: ['escrow', 'Ghana', 'social commerce', 'MoMo', 'safe trading', 'Instagram', 'WhatsApp'],
  openGraph: {
    title: 'SafeTrade Ghana — Secure Escrow for Social Commerce',
    description: 'Stop getting scammed. Start trading safely.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans`}>
        <AuthProvider>
          <Navbar />
          <main className="pt-16">{children}</main>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'hsl(0 0% 10%)',
                color: '#fff',
                border: '1px solid hsl(0 0% 15%)',
                borderRadius: '12px',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
