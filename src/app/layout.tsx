import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: {
    default: 'LAB Visualizer - Molecular Structure Visualization',
    template: '%s | LAB Visualizer',
  },
  description:
    'Interactive molecular structure visualization platform with progressive LOD rendering, real-time collaboration, and educational content for biochemistry learning.',
  keywords: [
    'molecular visualization',
    '3D protein structures',
    'PDB viewer',
    'biochemistry education',
    'WebGL',
    'Mol*',
    'structural biology',
  ],
  authors: [{ name: 'LAB Team' }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://lab-visualizer.vercel.app',
    title: 'LAB Visualizer - Molecular Structure Visualization',
    description: 'Interactive molecular structure visualization platform',
    siteName: 'LAB Visualizer',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LAB Visualizer',
    description: 'Interactive molecular structure visualization platform',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white antialiased dark:bg-secondary-950">
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
