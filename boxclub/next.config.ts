import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@remotion/renderer', '@remotion/bundler', '@remotion/compositor-linux-x64-gnu', 'esbuild'],
  // Server-Aktionen/Routen laufen lokal; Medien werden über /api/media ausgeliefert
};

export default nextConfig;
