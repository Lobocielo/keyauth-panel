"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/keys", label: "Keys", icon: "🔑" },
  { href: "/dashboard/users", label: "Users", icon: "👥" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-primary-400">LicensePanel</h1>
          <p className="text-xs text-gray-500 mt-1">Key Management System</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? "bg-primary-600/20 text-primary-400"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
          >
            <span>🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
