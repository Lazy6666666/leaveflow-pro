import { Composition } from 'remotion';
import { MarketingVideo } from './remotion/MarketingVideo';
import { HeroVideo } from './remotion/HeroVideo';
import './index.css';

export const RemotionRoot: React.FC = () => {
    return (
        <>
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
                durationInFrames={300} // 10 seconds loop
                fps={30}
                width={1920}
                height={1080}
            />
        </>
    );
};
