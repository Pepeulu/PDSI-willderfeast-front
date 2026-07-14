import type { Metadata } from 'next';
import './globals.css';
import './details.css';

export const metadata: Metadata = {
  title: 'Wilderfeast',
  description: 'Aventure-se, cace e festeje.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
