import React from 'react';
import { Composition, Still } from 'remotion';
import './fonts';
import { EpisodeComposition, episodeDuration, type EpisodeProps } from './Episode';
import { CharacterSheet, type CharacterSheetProps } from './CharacterSheet';
import { FPS, HEIGHT, WIDTH } from '../lib/timeline';

// Platzhalter – die echten Daten kommen beim Rendern als inputProps
const emptyProps = { episode: null, characters: [], club: null, assetBase: '', available: [] } as unknown as EpisodeProps;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="BoxclubEpisode"
      component={EpisodeComposition}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      durationInFrames={FPS * 45}
      defaultProps={emptyProps}
      calculateMetadata={({ props }) => ({ durationInFrames: props.episode ? episodeDuration(props.episode) : FPS * 45 })}
    />
    <Still id="CharacterSheet" component={CharacterSheet} width={1800} height={1100} defaultProps={{ character: null } as unknown as CharacterSheetProps} />
  </>
);
