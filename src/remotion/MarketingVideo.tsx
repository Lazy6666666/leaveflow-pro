import {
    AbsoluteFill,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
    Easing
} from 'remotion';
import React from 'react';

export const MarketingVideo: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    // 1. Entrance Spring (Smooth reveal)
    const entrance = spring({
        frame,
        fps,
        config: { damping: 200 }
    });

    // 2. Text Fly-in
    const textOpacity = interpolate(frame, [20, 45], [0, 1], {
        extrapolateRight: 'clamp'
    });
    const textTranslateY = interpolate(frame, [20, 60], [40, 0], {
        easing: Easing.out(Easing.quad),
        extrapolateRight: 'clamp'
    });

    return (
        <AbsoluteFill className="bg-[#0A0A0A] flex items-center justify-center overflow-hidden">
            {/* Abstract Background with scale pulse */}
            <div
                className="absolute inset-0 grayscale opacity-40 bg-cover bg-center"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')",
                    transform: `scale(${1 + (entrance * 0.05)})`
                }}
            />
            <div className="absolute inset-0 bg-[#0A0A0A]/60" />

            {/* Main Content Group */}
            <div
                style={{
                    opacity: entrance,
                    transform: `translateY(${textTranslateY}px)`
                }}
                className="relative z-10 flex flex-col items-center gap-8 text-center"
            >
                <div className="flex items-center gap-3 bg-white/5 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-white/60 font-['Inter'] text-sm font-semibold tracking-widest uppercase">
                        BALANCE
                    </span>
                </div>

                <h1
                    className="text-white font-['Cormorant_Garamond'] text-[120px] font-medium leading-[0.9] tracking-tighter"
                    style={{ opacity: textOpacity }}
                >
                    Workforce,<br />Refined.
                </h1>

                <p
                    className="text-white/50 font-['Inter'] text-2xl max-w-3xl leading-relaxed"
                    style={{ opacity: textOpacity }}
                >
                    The architectural standard for enterprise fluidity.<br />
                    Harmonizing human potential with systemic precision.
                </p>
            </div>
        </AbsoluteFill>
    );
};
