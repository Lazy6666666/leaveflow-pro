import { useEffect } from 'react';
import { PremiumLanding } from './PremiumLanding';
import { useAnalytics } from '@/hooks/useAnalytics';

const Index = () => {
  const { trackOnce } = useAnalytics();

  useEffect(() => {
    window.scrollTo(0, 0);
    void trackOnce("landing_page_viewed", "landing_page_viewed", {
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      device_type: typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop",
    }, { surface: "landing", path: "/" });
  }, [trackOnce]);

  return <PremiumLanding />;
};

export default Index;
