import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import ServiceWorkerRegistrar from '../components/ServiceWorkerRegistrar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Monster Mash',
  description: '3 WODS. 5 MIN REST. ALL HYPE.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Monster Mash',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#FF5A1F" />
      </head>
      <body className="mm-app-bg text-bone min-h-screen">
        <ServiceWorkerRegistrar />
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
