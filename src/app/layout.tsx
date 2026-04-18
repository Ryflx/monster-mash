import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'Monster Mash',
  description: '3 WODS. 5 MIN REST. ALL HYPE.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="mm-app-bg text-bone min-h-screen">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
