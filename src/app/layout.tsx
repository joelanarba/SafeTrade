import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Web3ModalWrapper from '@/components/Web3ModalWrapper';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
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
    <html lang="en">
      <body className={`${jakarta.variable} font-sans`}>
        <Web3ModalWrapper>
          <AuthProvider>
            <Navbar />
            <main className="pt-16">{children}</main>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#fff',
                color: '#0F172A',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
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
        </Web3ModalWrapper>
      </body>
    </html>
  );
}
