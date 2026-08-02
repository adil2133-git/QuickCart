import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
import { HeroSection } from "../components/heroSection";
import { WhyQuickKartSection } from "../components/whyQuickKartSection";
import { RoleSelectionSection } from "../components/roleSelectionSection";
import { HowItWorksSection } from "../components/howItWorksSection";

/* ─── Main Modular Landing Page ──────────────────────────────────────────── */

export default function QuickKartLanding() {
  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#16241D]">
      <Navbar />
      <main>
        <HeroSection />
        <WhyQuickKartSection />
        <RoleSelectionSection />
        <HowItWorksSection />
      </main>
      <Footer />
    </div>
  );
}