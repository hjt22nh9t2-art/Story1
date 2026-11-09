import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { characters } from '../src/seed/world';
import { CharacterPortrait } from '../src/remotion/Character';
import fs from 'node:fs';
const acts = ['keine','zeigen','arme_verschraenkt','jubeln','schlagen','achselzucken','faust_heben'] as const;
const html = '<html><body style="background:#ddd;margin:0;display:flex;flex-wrap:wrap">' + characters.map((c,i)=>renderToStaticMarkup(<div style={{padding:10}}><CharacterPortrait look={c.look} heightCm={c.heightCm} size={250} action={acts[i%acts.length]} emotion={i%2?'froh':'neutral'} mouth={i===2?0.7:0}/><div>{c.name}</div></div>)).join('') + '</body></html>';
fs.writeFileSync(process.argv[2], html);
