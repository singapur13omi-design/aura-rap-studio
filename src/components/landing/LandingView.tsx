'use client';

import React from 'react';
import { LandingHero } from './LandingHero';
import { HipHopCultureSection } from './HipHopCultureSection';
import { StudioExperienceSection } from './StudioExperienceSection';
import { ContestAndPricingSection } from './ContestAndPricingSection';
import { StoryBehindTheSound } from './StoryBehindTheSound';
import { LandingFooter } from './LandingFooter';

interface LandingViewProps {
  onEnterStudio: () => void;
  onOpenTutorial: () => void;
  onOpenPricing?: () => void;
  onOpenAuth?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onEnterStudio,
  onOpenTutorial,
  onOpenPricing,
  onOpenAuth,
}) => {
  const handleScrollToCulture = () => {
    const el = document.getElementById('hip-hop-culture');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-brand-black text-white flex flex-col overflow-y-auto">
      {/* 1. Cinematic Hero Section */}
      <LandingHero
        onEnterStudio={onEnterStudio}
        onExploreCulture={handleScrollToCulture}
        onOpenTutorial={onOpenTutorial}
      />

      {/* 2. Hip-Hop Culture Section (MCing, DJing, Breaking, Graffiti) */}
      <HipHopCultureSection onEnterStudio={onEnterStudio} />

      {/* 3. Studio Experience Section (Multitrack, Auto-Tune, 808s, Mastering) */}
      <StudioExperienceSection onEnterStudio={onEnterStudio} />

      {/* 4. Súťaž o 3 ročné licencie zdarma & Nová cenotvorba (30 dní free / 9.99€ / 60€) */}
      <ContestAndPricingSection
        onEnterStudio={onEnterStudio}
        onOpenAuth={onOpenAuth}
        onSelectPlan={(planId) => {
          if (onOpenPricing) onOpenPricing();
          else onEnterStudio();
        }}
      />

      {/* 5. The Story Behind the Sound & 13OMI Founder Signature Section */}
      <StoryBehindTheSound onEnterStudio={onEnterStudio} />

      {/* 6. Brand Signature Footer */}
      <LandingFooter
        onEnterStudio={onEnterStudio}
        onScrollToTop={handleScrollToTop}
      />
    </div>
  );
};
