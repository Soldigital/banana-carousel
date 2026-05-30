"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeatureExample } from "@/components/landing/FeatureExample";
import { PricingSection } from "@/components/pricing/PricingSection";
import { CtaSection } from "@/components/landing/CtaSection";
import {
  ApiKeyModal,
  useApiKeyHydration,
} from "@/components/api-key/ApiKeyModal";

export default function LandingPage() {
  useApiKeyHydration();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <FeatureExample />
        <PricingSection />
        <CtaSection />
      </main>
      <Footer />
      <ApiKeyModal />
    </div>
  );
}
