import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UPIlerify Starter — Open-Source Zero-Fee UPI Payment Engine',
  description:
    'Self-hosted, developer-first UPI payment verification starter for Next.js and Node.js. 0% transaction fees via Gmail IMAP.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-slate-100 antialiased selection:bg-cyan-500/20 selection:text-cyan-400">
        {children}
      </body>
    </html>
  );
}
