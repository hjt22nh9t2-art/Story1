import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/providers/config';
export const dynamic = 'force-dynamic';
export const GET = () => NextResponse.json(getConfig());
