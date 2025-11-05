"use client"

/**
 * LANDING PAGE - REFACTORED VERSION
 *
 * This is the refactored landing page using modular components from Phases 1-7.
 *
 * Structure:
 * - Header (from Phase 5)
 * - HeroSection (from Phase 7)
 * - IntroSection (from Phase 7)
 * - CatalogSection (from Phase 7)
 * - ProcessSection (from Phase 6)
 * - BenefitsSection (from Phase 6)
 * - CRMSection (from Phase 7)
 * - FAQSection (from Phase 6)
 * - CTASection (from Phase 7)
 * - Footer (from Phase 5)
 *
 * All components use:
 * - Types from Phase 1
 * - Data from Phase 2
 * - Utils from Phase 3
 * - Hooks from Phase 4
 * - Cards from Phase 5
 */

import { Header } from "@/components/landing/Header"
import { Footer } from "@/components/landing/Footer"
import { HeroSection } from "@/components/landing/sections/HeroSection"
import { IntroSection } from "@/components/landing/sections/IntroSection"
import { CatalogSection } from "@/components/landing/sections/CatalogSection"
import { ProcessSection } from "@/components/landing/sections/ProcessSection"
import { BenefitsSection } from "@/components/landing/sections/BenefitsSection"
import { CRMSection } from "@/components/landing/sections/CRMSection"
import { FAQSection } from "@/components/landing/sections/FAQSection"
import { CTASection } from "@/components/landing/sections/CTASection"

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Header - Transparent for dark hero */}
      <Header />

      {/* Hero Section with Dashboard Preview */}
      <HeroSection />

      {/* Intro Section - Payment Agent Explanation */}
      <IntroSection />

      {/* Catalog Section - 10,000+ Products */}
      <CatalogSection />

      {/* Process Section - 7 Steps */}
      <ProcessSection />

      {/* Benefits Section - Why Choose Get2B */}
      <BenefitsSection />

      {/* CRM Section - Dashboard & Support */}
      <CRMSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Final CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  )
}
