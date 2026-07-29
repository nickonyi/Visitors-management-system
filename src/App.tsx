import { AuthProvider, useAuth } from "@/context/AuthContext";
import { RouterProvider, useRouter } from "@/context/RouterContext";
import { ToastProvider } from "@/components/ui/Toast";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { AppShell } from "@/components/AppShell";
import { AuthScreen } from "@/screens/AuthScreen";
import { ResidentDashboard } from "@/screens/resident/ResidentDashboard";
import { CreateVisitorScreen } from "@/screens/resident/CreateVisitorScreen";
import { VisitorDetailsScreen } from "@/screens/resident/VisitorDetailsScreen";
import { ResidentHistoryScreen } from "@/screens/resident/ResidentHistoryScreen";
import { GuardScanScreen } from "@/screens/guard/GuardScanScreen";
import { GuardVerifyScreen } from "@/screens/guard/GuardVerifyScreen";
import { GuardHistoryScreen } from "@/screens/guard/GuardHistoryScreen";
import { AdminDashboard } from "@/screens/admin/AdminDashboard";
import { AdminAnalyticsScreen } from "@/screens/admin/AdminAnalyticsScreen";
import { AdminVisitorsScreen } from "@/screens/admin/AdminVisitorsScreen";
import { AdminUsersScreen } from "@/screens/admin/AdminUsersScreen";
import type { UserRole } from "@/types";

function NotFound() {
  return (
    <div className="text-center py-20">
      <p className="text-slate-500">Page not found.</p>
    </div>
  );
}

function Routes() {
  const { path, navigate } = useRouter();
  const { profile, loading } = useAuth();

  if (loading) return <FullPageSpinner label="Loading..." />;
  if (!profile) return <AuthScreen />;

  const role = profile.role as UserRole;
  const home = `/${role}`;

  // Guard against wrong-role access
  const allowedPrefix = `/${role}`;
  if (!path.startsWith(allowedPrefix) && path !== "/") {
    navigate(home);
    return null;
  }

  function render() {
    // Resident
    if (role === "resident") {
      if (path === "/resident" || path === "/") return <ResidentDashboard />;
      if (path === "/resident/new") return <CreateVisitorScreen />;
      if (path.startsWith("/resident/pass/")) {
        const id = path.split("/").pop() ?? "";
        return <VisitorDetailsScreen passId={id} />;
      }
      if (path === "/resident/history") return <ResidentHistoryScreen />;
      return <NotFound />;
    }
    // Guard
    if (role === "guard") {
      if (path === "/guard" || path === "/") return <GuardScanScreen />;
      if (path.startsWith("/guard/verify")) {
        const params = new URLSearchParams(path.split("?")[1] ?? "");
        const token = params.get("t") ?? "";
        return <GuardVerifyScreen token={token} />;
      }
      if (path === "/guard/history") return <GuardHistoryScreen />;
      return <NotFound />;
    }
    // Admin
    if (role === "admin") {
      if (path === "/admin" || path === "/") return <AdminDashboard />;
      if (path === "/admin/visitors") return <AdminVisitorsScreen />;
      if (path === "/admin/analytics") return <AdminAnalyticsScreen />;
      if (path === "/admin/users") return <AdminUsersScreen />;
      return <NotFound />;
    }
    return <NotFound />;
  }

  return <AppShell>{render()}</AppShell>;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider>
          <Routes />
        </RouterProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
