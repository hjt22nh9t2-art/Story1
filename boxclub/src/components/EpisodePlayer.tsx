'use client';
/** Live-Vorschau einer Folge mit @remotion/player – ohne zu rendern. */
import { Player } from '@remotion/player';
import { useEffect, useState } from 'react';
import { EpisodeComposition, episodeDuration, type EpisodeProps } from '@/remotion/Episode';
import { FPS, HEIGHT, WIDTH } from '@/lib/timeline';
import { api } from './client';

export function EpisodePlayer({ id, version = 0, width = 330 }: { id: string; version?: number; width?: number }) {
  const [props, setProps] = useState<EpisodeProps | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { api<EpisodeProps>(`/api/episodes/${id}/props`).then(setProps).catch((e) => setErr(e.message)); }, [id, version]);
  if (err) return <div className="err">{err}</div>;
  if (!props) return <div className="muted" style={{ width, height: (width * 16) / 9, display: 'grid', placeItems: 'center', background: '#000', borderRadius: 14 }}>Lade Vorschau …</div>;
  return (
    <Player
      component={EpisodeComposition}
      inputProps={props}
      durationInFrames={episodeDuration(props.episode)}
      fps={FPS}
      compositionWidth={WIDTH}
      compositionHeight={HEIGHT}
      style={{ width, height: (width * 16) / 9, borderRadius: 14, overflow: 'hidden', border: '1px solid #36303c' }}
      controls
      acknowledgeRemotionLicense
    />
  );
}
