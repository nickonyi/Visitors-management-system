import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  QrCode,
  History,
  ScanLine,
  Users,
  BarChart3,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  PlusCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/context/RouterContext";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const navByRole: Record<UserRole, NavItem[]> = {
  resident: [
    {
      label: "Dashboard",
      path: "/resident",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      label: "New Pass",
      path: "/resident/new",
      icon: <PlusCircle className="h-5 w-5" />,
    },
    {
      label: "History",
      path: "/resident/history",
      icon: <History className="h-5 w-5" />,
    },
  ],
  guard: [
    { label: "Scan", path: "/guard", icon: <ScanLine className="h-5 w-5" /> },
    {
      label: "History",
      path: "/guard/history",
      icon: <History className="h-5 w-5" />,
    },
  ],
  admin: [
    {
      label: "Dashboard",
      path: "/admin",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      label: "Visitors",
      path: "/admin/visitors",
      icon: <QrCode className="h-5 w-5" />,
    },
    {
      label: "Analytics",
      path: "/admin/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      label: "Users",
      path: "/admin/users",
      icon: <Users className="h-5 w-5" />,
    },
  ],
};

const roleLabels: Record<UserRole, string> = {
  resident: "Resident",
  guard: "Security Guard",
  admin: "Administrator",
};

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const { path, navigate } = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!profile) return null;
  const items = navByRole[profile.role] ?? [];

  function handleNav(p: string) {
    navigate(p);
    setMobileOpen(false);
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-200">
        <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-slate-900">
          GateKeep
        </span>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {items.map((item) => {
          const active =
            path === item.path ||
            (item.path !== `/${profile.role}` && path.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-200">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar name={profile.full_name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {profile.full_name}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {roleLabels[profile.role]}
              {profile.unit ? ` · ${profile.unit}` : ""}
            </p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="mt-2 w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 border-r border-slate-200 bg-white">
        {sidebar}
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="font-semibold text-slate-900">GateKeep</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="h-10 w-10 inline-flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl animate-slide-in-right">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
