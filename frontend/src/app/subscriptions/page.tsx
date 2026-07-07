"use client";

import Link from "next/link";
import { Tv, HelpCircle } from "lucide-react";

export default function SubscriptionsPage() {
  return (
    <div className="min-h-screen pt-14">
      <div className="max-w-[1100px] mx-auto px-6 py-6 pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center">
            <Tv size={20} className="text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-[#e8eaf2] light:text-[#0f1523]">
            Subscriptions
          </h1>
        </div>

        {/* Work in progress */}
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-20 h-20 rounded-2xl bg-brand-500/10 flex items-center justify-center">
            <Tv size={36} className="text-brand-400/60" />
          </div>
          <h2 className="text-lg font-semibold text-[#e8eaf2] light:text-[#0f1523]">
            We are working
          </h2>
          <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b] max-w-sm text-center">
            This page is under construction. Stay tuned for Subscriptions content!
          </p>
          <Link
            href="/help"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-white/[0.05] light:bg-white/50 border border-white/[0.08] light:border-[rgba(200,210,235,0.40)] text-[#8b90a7] light:text-[#3d4a6b] hover:bg-white/[0.09] light:hover:bg-white/70 hover:text-[#e8eaf2] light:hover:text-[#0f1523] transition-all"
          >
            <HelpCircle size={16} />
            Need Help?
          </Link>
        </div>
      </div>
    </div>
  );
}
