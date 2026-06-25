"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const adminNav = [
  { href: "/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/dashboard/keys", label: "Keys", icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
  { href: "/dashboard/users", label: "Users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { href: "/dashboard/resellers", label: "Revendedores", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
  { href: "/dashboard/monitor", label: "Monitor", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { href: "/dashboard/logs", label: "Logs", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
];

const resellerNav = [
  { href: "/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/dashboard/licenses", label: "Licencias", icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
  { href: "/dashboard/credits", label: "Creditos", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
];

const sectionLabels: Record<string, string> = {
  "/dashboard": "GENERAL",
  "/dashboard/keys": "GESTION",
  "/dashboard/licenses": "GESTION",
  "/dashboard/users": "GESTION",
  "/dashboard/resellers": "GESTION",
  "/dashboard/credits": "GESTION",
  "/dashboard/monitor": "SEGURIDAD",
  "/dashboard/logs": "SEGURIDAD",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user) setUser(d.user);
      else router.push("/login");
    }).catch(() => router.push("/login"));
  }, [router]);

  async function handleLogout() {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  }

  const navItems = user?.type === "reseller" ? resellerNav : adminNav;

  // Group nav items by section
  const sections: { label: string; items: typeof navItems }[] = [];
  let lastSection = "";
  for (const item of navItems) {
    const section = sectionLabels[item.href] || "OTHER";
    if (section !== lastSection) {
      sections.push({ label: section, items: [] });
      lastSection = section;
    }
    sections[sections.length - 1].items.push(item);
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#0a0a0a" }}>
      {/* Sidebar */}
      <aside className="w-[72px] lg:w-60 bg-[#111] border-r border-gray-800/50 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-800/50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">Z</span>
            </div>
            <div className="hidden lg:block">
              <h1 className="text-sm font-bold text-white">Zeniht</h1>
              <p className="text-[10px] text-gray-500">{user?.type === "reseller" ? "Sub-reseller" : "Admin"}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-4 overflow-y-auto">
          {sections.map((section, si) => (
            <div key={si}>
              <p className="px-3 mb-1 text-[10px] font-bold text-gray-600 uppercase tracking-widest hidden lg:block">{section.label}</p>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    pathname === item.href
                      ? "bg-green-500/10 text-green-400"
                      : "text-gray-500 hover:bg-gray-800/50 hover:text-gray-300"
                  }`}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-3 border-t border-gray-800/50">
          <div className="flex items-center gap-2 mb-2 px-2">
            <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
              <span className="text-gray-400 text-xs font-medium">{user?.username?.[0]?.toUpperCase()}</span>
            </div>
            <div className="hidden lg:block">
              <span className="text-xs text-gray-300 font-medium">{user?.username}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden lg:block">Salir</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
