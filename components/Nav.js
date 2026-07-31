"use client";

import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Nav() {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const linkClass = (path) =>
    `text-sm font-medium transition ${
      pathname === path ? "text-forestDeep" : "text-ink/50 hover:text-ink"
    }`;

  return (
    <div className="border-b border-ink/10 bg-white/70 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-9">
          <button onClick={() => router.push("/")} className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 26 26" fill="none">
              <rect x="1" y="1" width="24" height="24" rx="7" fill="#2E4A31" />
              <path d="M6.5 14L13 8L19.5 14" stroke="#EFF2EA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8.5 12.5V18.5H17.5V12.5" stroke="#EFF2EA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 18.5V15.2H14V18.5" stroke="#B98A2E" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="font-semibold text-forestDeep" style={{ fontFamily: "Georgia, serif" }}>Tenfa</span>
          </button>
          <div className="flex items-center gap-6">
            <button onClick={() => router.push("/dashboard")} className={linkClass("/dashboard")}>Properties</button>
            <button onClick={() => router.push("/dashboard/portfolio")} className={linkClass("/dashboard/portfolio")}>Portfolio</button>
            <button onClick={() => router.push("/dashboard/billing")} className={linkClass("/dashboard/billing")}>Billing</button>
            <button onClick={() => router.push("/help")} className={linkClass("/help")}>Help</button>
          </div>
        </div>
        <button onClick={logout} className="text-sm text-ink/45 hover:text-ink">Log out</button>
      </div>
    </div>
  );
}
