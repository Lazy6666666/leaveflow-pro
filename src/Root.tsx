import { Composition } from 'remotion';
import { MarketingVideo } from './remotion/MarketingVideo';
import { HeroVideo } from './remotion/HeroVideo';
import { LandingVideo, TOTAL_FRAMES, FPS, WIDTH, HEIGHT } from './remotion/LandingVideo';
import './index.css';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="LandingVideo"
                component={LandingVideo}
                durationInFrames={TOTAL_FRAMES}
                fps={FPS}
                width={WIDTH}
                height={HEIGHT}
            />
            <Composition
                id="MarketingVideo"
                component={MarketingVideo}
                durationInFrames={150}
                fps={30}
                width={1920}
                height={1080}
            />
            <Composition
                id="HeroVideo"
                component={HeroVideo}
                durationInFrames={300}
                fps={30}
                width={1920}
                height={1080}
            />
        </>
    );
};
