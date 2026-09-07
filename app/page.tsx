import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { FeatureExample } from "@/components/landing/FeatureExample";
import { ExampleGallery } from "@/components/landing/ExampleGallery";
import { PricingSection } from "@/components/pricing/PricingSection";
import { IntegrationsBand } from "@/components/landing/IntegrationsBand";
import { AboutSection } from "@/components/landing/AboutSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { softwareApplicationLd, faqLd } from "@/lib/seo/structured-data";
import { SITE_DESCRIPTION } from "@/lib/seo/site";

// Server component. This file previously carried "use client" without using a
// single hook — every child that needs interactivity declares its own
// directive — which made per-page `metadata` impossible. Dropping it changes
// no rendered output; it only moves the client boundary down to the components
// that actually need it, and unlocks the export below.
export const metadata: Metadata = {
  title: "AI Carousel Generator & Master Prompt Gemini untuk Instagram",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <JsonLd data={[softwareApplicationLd(), faqLd()]} />
      <Header showApiKey={false} showNav />
      <main className="flex-1">
        <Hero />
        <FeaturesGrid />
        <HowItWorks />
        <ServicesSection />
        <FeatureExample />
        <ExampleGallery />
        <PricingSection />
        <IntegrationsBand />
        <AboutSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
