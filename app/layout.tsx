import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'まん福返礼品推薦システム',
  description: '条件に基づいて最適な返礼品を提案します。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
