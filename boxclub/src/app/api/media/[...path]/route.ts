/** Liefert Dateien aus data/media aus (mit Range-Unterstützung für Video-Spulen). */
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { MEDIA_DIR } from '@/lib/store';
export const dynamic = 'force-dynamic';

const TYPES: Record<string, string> = { '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.png': 'image/png', '.jpg': 'image/jpeg' };

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  const abs = path.resolve(MEDIA_DIR, ...parts);
  if (!abs.startsWith(path.resolve(MEDIA_DIR) + path.sep) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) return new Response('Nicht gefunden', { status: 404 });
  const size = fs.statSync(abs).size;
  const type = TYPES[path.extname(abs).toLowerCase()] ?? 'application/octet-stream';
  const dl = new URL(req.url).searchParams.has('download');
  const headers: Record<string, string> = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
  if (dl) headers['Content-Disposition'] = `attachment; filename="${path.basename(abs)}"`;
  const range = req.headers.get('range');
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m?.[1] ? parseInt(m[1]) : 0;
    const end = m?.[2] ? Math.min(parseInt(m[2]), size - 1) : size - 1;
    const stream = fs.createReadStream(abs, { start, end });
    return new Response(Readable.toWeb(stream) as ReadableStream, { status: 206, headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1) } });
  }
  return new Response(Readable.toWeb(fs.createReadStream(abs)) as ReadableStream, { headers: { ...headers, 'Content-Length': String(size) } });
}
