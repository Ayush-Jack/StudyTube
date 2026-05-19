"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import * as userService from "@/services/userService";
import { Check, ArrowRight } from "lucide-react";
import { DOMAINS } from "@/lib/mock-data";

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);
  const { updateUser } = useAuth();
  const router = useRouter();

  // Fetch available domains from backend
  useEffect(() => {
    userService.getAvailableDomains()
      .then(setAvailableDomains)
      .catch(() => {
        // Fallback to mock domain labels if API fails
        setAvailableDomains(DOMAINS.map(d => d.label));
      });
  }, []);

  const toggle = (label: string) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label]
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;
    setSubmitting(true);
    try {
      const updatedUser = await userService.updateDomains(selected);
      updateUser(updatedUser);
      router.push("/");
    } catch {
      // Fallback: still navigate to home
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[radial-gradient(ellipse_at_top,#131320_0%,#0e0e12_70%)] light:bg-[radial-gradient(ellipse_at_top,#e8ecf8_0%,#f0f2f8_70%)]">
      <div className="w-full max-w-[700px]">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="
            inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6
            bg-brand-600/15 light:bg-brand-600/10
            text-brand-400 light:text-brand-600
            border border-brand-500/30
          ">
            Step 1 of 1
          </div>
          <h1 className="text-3xl font-bold font-display text-[#e8eaf2] light:text-[#0f1523] mb-3">
            What do you want to study?
          </h1>
          <p className="text-[#8b90a7] light:text-[#3d4a6b]">
            Select your domains and we&apos;ll curate the perfect feed for you.
            <br />You can always change this later.
          </p>
        </div>

        {/* Domain Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
          {DOMAINS.map((domain) => {
            const isSelected = selected.includes(domain.id);
            return (
              <button
                key={domain.id}
                onClick={() => toggle(domain.id)}
                className="relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 cursor-pointer group border-2"
                style={{
                  backgroundColor: isSelected ? `${domain.color}20` : undefined,
                  borderColor: isSelected ? domain.color : "rgba(255,255,255,0.07)",
                  boxShadow: isSelected ? `0 0 20px ${domain.color}25` : "none",
                }}>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: domain.color }}>
                    <Check size={12} color="white" />
                  </div>
                )}
                <span className="text-3xl">{domain.icon}</span>
                <span className="text-sm font-semibold text-[#e8eaf2] light:text-[#0f1523]">{domain.label}</span>
                <span className="text-xs text-[#8b90a7] light:text-[#3d4a6b] text-center leading-tight">{domain.description}</span>
                <span className="text-xs font-medium mt-1" style={{ color: domain.color }}>
                  {domain.videoCount.toLocaleString()} videos
                </span>
              </button>
            );
          })}
        </div>

        {/* Selection count */}
        {selected.length > 0 && (
          <p className="text-center text-sm text-[#8b90a7] light:text-[#3d4a6b] mb-4">
            ✓ {selected.length} domain{selected.length > 1 ? "s" : ""} selected
          </p>
        )}

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleContinue}
            disabled={selected.length === 0}
            className={`
              flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm transition-all
              ${selected.length > 0
                ? 'bg-brand-500 text-white hover:bg-brand-600 hover:shadow-glow-blue cursor-pointer'
                : 'bg-white/[0.05] light:bg-black/[0.04] text-[#4a4f66] light:text-[#7a86a8] cursor-not-allowed'
              }
            `}>
            Continue to StudyTube <ArrowRight size={16} />
          </button>
          <button onClick={handleContinue}
            className="text-sm text-[#4a4f66] light:text-[#7a86a8] hover:text-[#8b90a7] light:hover:text-[#3d4a6b] transition-colors">
            Skip for now →
          </button>
        </div>
      </div>
    </div>
  );
}
