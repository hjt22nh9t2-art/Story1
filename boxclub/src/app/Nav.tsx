'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  ['/', 'Dashboard'],
  ['/generator', 'Episoden-Generator'],
  ['/charaktere', 'Charaktere'],
  ['/verein', 'Boxclub'],
  ['/archiv', 'Videoarchiv'],
  ['/einstellungen', 'Einstellungen'],
];

export function Nav() {
  const p = usePathname();
  return (
    <nav className="nav">
      <div className="brand">BOXCLUB</div>
      <div className="brand-sub">Serienstudio · BC Rostfaust</div>
      {items.map(([href, label]) => (
        <Link key={href} href={href} className={(href === '/' ? p === '/' : p.startsWith(href)) ? 'active' : ''}>{label}</Link>
      ))}
    </nav>
  );
}
