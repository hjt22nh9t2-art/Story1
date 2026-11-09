/** Hilfen für API-Routen: einheitliche Fehlerbehandlung. */
import { NextResponse } from 'next/server';
import { isSeeded } from './store';

export async function handle<T>(fn: () => Promise<T> | T) {
  try {
    if (!isSeeded()) return NextResponse.json({ error: 'Noch keine Daten – bitte "npm run seed" ausführen.' }, { status: 400 });
    return NextResponse.json(await fn());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
