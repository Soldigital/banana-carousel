"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeatureExample } from "@/components/landing/FeatureExample";
import { ExampleGallery } from "@/components/landing/ExampleGallery";
import { PricingSection } from "@/components/pricing/PricingSection";
import { CtaSection } from "@/components/landing/CtaSection";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header showApiKey={false} />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <FeatureExample />
        <ExampleGallery />
        <PricingSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
