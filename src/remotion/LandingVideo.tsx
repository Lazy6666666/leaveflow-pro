import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { Hero } from './sections/Hero';
import { Transition } from './sections/Transition';
import { Bento } from './sections/Bento';
import { Infrastructure } from './sections/Infrastructure';
import { Global } from './sections/Global';
import { FinalCTA } from './sections/FinalCTA';

// Timing constants (frames)
export const SECTION_DURATION = 150;
export const TOTAL_SECTIONS = 6;
export const TOTAL_FRAMES = SECTION_DURATION * TOTAL_SECTIONS;
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const LandingVideo: React.FC = () => {
  return (
    <AbsoluteFill className="bg-white">
      <Sequence from={SECTION_DURATION * 0} durationInFrames={SECTION_DURATION}>
        <Hero />
      </Sequence>
      
      <Sequence from={SECTION_DURATION * 1} durationInFrames={SECTION_DURATION}>
        <Transition />
      </Sequence>
 
      <Sequence from={SECTION_DURATION * 2} durationInFrames={SECTION_DURATION}>
        <Bento />
      </Sequence>
 
      <Sequence from={SECTION_DURATION * 3} durationInFrames={SECTION_DURATION}>
        <Infrastructure />
      </Sequence>
 
      <Sequence from={SECTION_DURATION * 4} durationInFrames={SECTION_DURATION}>
        <Global />
      </Sequence>
 
      <Sequence from={SECTION_DURATION * 5} durationInFrames={SECTION_DURATION}>
        <FinalCTA />
      </Sequence>
    </AbsoluteFill>
  );
};
