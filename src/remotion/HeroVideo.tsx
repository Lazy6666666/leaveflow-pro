import {
    AbsoluteFill,
    staticFile
} from 'remotion';
import { Video } from '@remotion/media';
import React from 'react';

export const HeroVideo: React.FC = () => {
    return (
        <AbsoluteFill className="bg-[#0A0A0A] overflow-hidden">
            {/* Dynamic Video Background */}
            <Video
                src={staticFile("beams-1773253678293.webm")}
                loop
                muted
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.5,
                    filter: 'grayscale(100%) contrast(110%) brightness(0.8)'
                }}
            />

            {/* Elegant Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-black/40" />
            <div className="absolute inset-0 bg-black/20" />

            {/* Subtle Grid Pattern Overlay for texture */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}
            />

            {/* Elegant Frame Accents */}
            <div className="absolute inset-[10%] border border-white/5 pointer-events-none" />
            <div className="absolute top-[10%] left-[10%] w-12 h-12 border-t border-l border-white/20" />
            <div className="absolute top-[10%] right-[10%] w-12 h-12 border-t border-r border-white/20" />
            <div className="absolute bottom-[10%] left-[10%] w-12 h-12 border-b border-l border-white/20" />
            <div className="absolute bottom-[10%] right-[10%] w-12 h-12 border-b border-r border-white/20" />
        </AbsoluteFill>
    );
};
