import { useState, useEffect } from 'react';
import { getStoriesPaginated } from '../lib/storyService';
import type { Story } from '../lib/types';
import {
  HeroSection,
  GenresSection,
  HowItWorksSection,
  FeaturesSection,
  FeaturedStoriesSection,
  TestimonialsSection,
  PricingSection,
  FaqSection,
  FinalCtaSection,
  LandingHeader,
  LandingFooter,
} from '../features/landing';

interface LandingPageProps {
  onGetStarted: () => void;
  onSelectStory: (storyId: string) => void;
}

export function LandingPage({ onGetStarted, onSelectStory }: LandingPageProps) {
  const [featuredStories, setFeaturedStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    loadFeaturedStories();
  }, []);

  const loadFeaturedStories = async () => {
    try {
      const result = await getStoriesPaginated(3, 0);
      setFeaturedStories(result.data);
    } catch (error) {
      console.error('Error loading featured stories:', error);
    } finally {
      setLoadingStories(false);
    }
  };

  const handleToggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <LandingHeader onGetStarted={onGetStarted} />
      <HeroSection featuredStory={featuredStories[0]} onGetStarted={onGetStarted} />
      <GenresSection />
      <HowItWorksSection />
      <FeaturesSection />
      <FeaturedStoriesSection
        stories={featuredStories}
        isLoading={loadingStories}
        onSelectStory={onSelectStory}
        onGetStarted={onGetStarted}
      />
      <TestimonialsSection />
      <PricingSection onGetStarted={onGetStarted} />
      <FaqSection activeFaq={activeFaq} onToggleFaq={handleToggleFaq} />
      <FinalCtaSection onGetStarted={onGetStarted} />
      <LandingFooter />
    </div>
  );
}
