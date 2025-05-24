
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LayoutProvider } from '@/contexts/LayoutContext';
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider

export const metadata: Metadata = {
  title: 'SeatLayout Editor',
  description: 'Edit and store cinema hall layouts',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
      <body className="antialiased">
        <AuthProvider> {/* Wrap with AuthProvider */}
          <LayoutProvider>
            {children}
            <Toaster />
          </LayoutProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
