import type { Metadata } from 'next';
import '@fontsource/anton/400.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import './globals.css';
import { Nav } from './Nav';

export const metadata: Metadata = { title: 'BOXCLUB – Serienstudio', description: 'Produktionsstudio für die animierte Boxclub-Serie' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <div className="shell">
          <Nav />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
