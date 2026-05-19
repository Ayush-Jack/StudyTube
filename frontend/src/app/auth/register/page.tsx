"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();
  const router = useRouter();

  const strength = password.length >= 8 ? "strong" : password.length >= 4 ? "medium" : password.length > 0 ? "weak" : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { setError("Please fill in all fields"); return; }
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      router.push("/onboarding");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
      setLoading(false);
    }
  };

  const inputClass = `
    w-full px-4 py-3 rounded-xl text-sm outline-none transition-all
    bg-white/[0.05] light:bg-white/60
    border border-white/[0.08] light:border-[rgba(200,210,235,0.55)]
    text-[#e8eaf2] light:text-[#0f1523]
    placeholder:text-[#4a4f66] light:placeholder:text-[#7a86a8]
    focus:border-brand-500/50 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)]
  `;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(ellipse_at_center,#131320_0%,#0e0e12_100%)] light:bg-[radial-gradient(ellipse_at_center,#e8ecf8_0%,#f0f2f8_100%)]">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center mb-8">
          <div className="
            w-16 h-16 rounded-2xl flex items-center justify-center mb-4
            bg-brand-600/15 light:bg-brand-600/10
            border border-brand-500/30
            shadow-[inset_0_0_20px_rgba(37,99,235,0.25),0_0_40px_rgba(37,99,235,0.15)]
          ">
            <BookOpen size={32} className="text-brand-400 light:text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold font-display logo-gradient">StudyTube</h1>
          <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b] mt-1">Start your learning journey</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-[#e8eaf2] light:text-[#0f1523] mb-6 text-center">Create account</h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm text-red-400 light:text-red-600 bg-red-900/20 light:bg-red-100 border border-red-900/40 light:border-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8b90a7] light:text-[#3d4a6b] mb-1.5">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b90a7] light:text-[#3d4a6b] mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b90a7] light:text-[#3d4a6b] mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters" className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4f66] light:text-[#7a86a8]">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {strength && (
                <div className="flex gap-1 mt-2">
                  {["weak", "medium", "strong"].map((s, i) => (
                    <div key={s} className="h-1 flex-1 rounded-full transition-all"
                      style={{
                        backgroundColor: i <= (strength === "strong" ? 2 : strength === "medium" ? 1 : 0)
                          ? strength === "strong" ? "#34d399" : strength === "medium" ? "#fbbf24" : "#ef4444"
                          : "rgba(255,255,255,0.07)"
                      }} />
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 mt-1">
              <input type="checkbox" id="tos" className="mt-0.5 accent-brand-500" required />
              <label htmlFor="tos" className="text-xs text-[#8b90a7] light:text-[#3d4a6b]">
                I agree to the <span className="text-brand-400 light:text-brand-600 cursor-pointer hover:underline">Terms of Service</span> and <span className="text-brand-400 light:text-brand-600 cursor-pointer hover:underline">Privacy Policy</span>
              </label>
            </div>

            <button type="submit" disabled={loading}
              className={`
                w-full py-3 rounded-xl font-semibold text-sm transition-all mt-2
                bg-brand-600/20 light:bg-brand-600/10
                border-[1.5px] border-brand-500/45 light:border-brand-500/35
                text-brand-400 light:text-brand-600
                hover:bg-brand-600/30 hover:shadow-glow-sm
                ${loading ? 'opacity-70' : ''}
              `}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b]">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-medium text-brand-400 light:text-brand-600 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
