import './globals.css';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';

const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', weight: ['400', '500', '700'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] });

export const metadata = {
  title: 'INDRISMA — Ambient Music',
  description: 'Ambient scenes, YouTube-powered music, and a movie watchlist you can sync anywhere with a key.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}