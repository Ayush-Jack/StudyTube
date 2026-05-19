import type { Metadata } from "next";
import "@/styles/globals.css";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import ClientLayout from "@/components/layout/ClientLayout";

export const metadata: Metadata = {
  title: "StudyTube — YouTube, but only for studying",
  description: "A curated educational video platform with zero distractions. Only study content from verified channels.",
  keywords: ["study", "education", "videos", "JEE", "NEET", "UPSC", "programming", "learn"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="relative z-[1]" suppressHydrationWarning>
        {/* Ambient blobs */}
        <div className="fixed -top-32 -left-24 w-[480px] h-[480px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.10)_0%,transparent_70%)] blur-[60px] pointer-events-none z-0 animate-blob-float" />
        <div className="fixed -bottom-20 -right-16 w-[380px] h-[380px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.07)_0%,transparent_70%)] blur-[60px] pointer-events-none z-0 animate-[blob-float_20s_ease-in-out_infinite_alternate-reverse] light:opacity-60" />

        <ClientLayout>
          <Navbar />
          <div className="flex pt-[60px] min-h-screen relative z-[1]">
            <Sidebar />
            <main id="main-content" className="flex-1 min-w-0 px-4">
              {children}
            </main>
          </div>
        </ClientLayout>
      </body>
    </html>
  );
}
