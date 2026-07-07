"use client";

import { HelpCircle, Globe, MessagesSquare, ExternalLink, Code2, Heart } from "lucide-react";

const DEVELOPER_LINKS = [
  {
    icon: Globe,
    label: "Website",
    href: "https://www.ayushsrivastava.me/",
    username: "ayushsrivastava.me",
    color: "from-blue-500 to-cyan-400",
    hoverBorder: "hover:border-blue-500/40",
  },
  {
    icon: MessagesSquare,
    label: "Instagram",
    href: "https://www.instagram.com/ayush_.exe_",
    username: "@ayush_.exe_",
    color: "from-pink-500 to-purple-500",
    hoverBorder: "hover:border-pink-500/40",
  },
  {
    icon: ExternalLink,
    label: "GitHub",
    href: "https://github.com/Ayush-Jack",
    username: "Ayush-Jack",
    color: "from-gray-400 to-gray-200",
    hoverBorder: "hover:border-gray-400/40",
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen pt-14">
      <div className="max-w-[800px] mx-auto px-6 py-6 pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center">
            <HelpCircle size={20} className="text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#e8eaf2] light:text-[#0f1523]">
              Help & Support
            </h1>
            <p className="text-xs text-[#8b90a7] light:text-[#3d4a6b] mt-0.5">
              Get in touch with the developer
            </p>
          </div>
        </div>

        {/* Developer Card */}
        <div className="rounded-2xl border border-white/[0.08] light:border-[rgba(200,210,235,0.40)] bg-white/[0.03] light:bg-white/50 backdrop-blur-xl p-8 mb-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 shadow-lg shadow-brand-500/20 border-2 border-brand-500/30">
              <img
                src="/developer-avatar.png"
                alt="Ayush Srivastava"
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-xl font-bold text-[#e8eaf2] light:text-[#0f1523]">
              Ayush Srivastava
            </h2>
            <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b] mt-1">
              Developer & Creator of StudyTube
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            {DEVELOPER_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  group flex items-center gap-4 p-4 rounded-xl
                  border border-white/[0.06] light:border-[rgba(200,210,235,0.30)]
                  bg-white/[0.02] light:bg-white/30
                  ${link.hoverBorder}
                  hover:bg-white/[0.06] light:hover:bg-white/50
                  transition-all duration-300
                `}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center shrink-0 shadow-md`}>
                  <link.icon size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#e8eaf2] light:text-[#0f1523]">
                    {link.label}
                  </p>
                  <p className="text-xs text-[#8b90a7] light:text-[#3d4a6b] truncate">
                    {link.username}
                  </p>
                </div>
                <ExternalLink
                  size={16}
                  className="text-[#4a4f66] light:text-[#7a86a8] group-hover:text-[#e8eaf2] light:group-hover:text-[#0f1523] transition-colors shrink-0"
                />
              </a>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center">
          <p className="text-xs text-[#4a4f66] light:text-[#7a86a8] flex items-center justify-center gap-1.5">
            Made with <Heart size={12} className="text-red-400 fill-red-400" /> by Ayush Srivastava
          </p>
        </div>
      </div>
    </div>
  );
}
