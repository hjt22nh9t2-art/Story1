import path from 'node:path';
import type { NextConfig } from 'next';

const root = path.dirname(new URL(import.meta.url).pathname);

const nextConfig: NextConfig = {
  serverExternalPackages: ['@remotion/renderer', '@remotion/bundler', '@remotion/compositor-linux-x64-gnu', 'esbuild'],
  // Projektordner explizit als Wurzel (das Repo enthält weitere Lockfiles)
  turbopack: { root },
  outputFileTracingRoot: root,
};

export default nextConfig;
