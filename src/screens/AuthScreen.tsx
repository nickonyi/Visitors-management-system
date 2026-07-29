import { useState } from "react";
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Home,
  Phone,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { UserRole } from "@/types";

type Mode = "signin" | "signup";

const roleOptions: { value: UserRole; label: string; description: string }[] = [
  {
    value: "resident",
    label: "Resident",
    description: "Invite and manage your guests",
  },
  {
    value: "guard",
    label: "Security Guard",
    description: "Scan and verify visitors at the gate",
  },
  {
    value: "admin",
    label: "Administrator",
    description: "Manage users and view analytics",
  },
];

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("resident");
  const [unit, setUnit] = useState("");
  const [phone, setPhone] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          setError(
            error.includes("Invalid login")
              ? "Invalid email or password. Please double-check your credentials."
              : error,
          );
        } else {
          toast("Welcome back!", "success");
        }
      } else {
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          return;
        }
        const { error } = await signUp({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          role,
          unit: unit.trim() || undefined,
          phone: phone.trim() || undefined,
        });
        if (error) {
          setError(
            error.includes("weak") || error.includes("pwned")
              ? "That password is too common. Please choose a stronger password."
              : error,
          );
        } else {
          toast("Account created. You are signed in.", "success");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(account: { email: string; password: string }) {
    setMode("signin");
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Brand panel */}
      <div className="relative lg:w-1/2 bg-slate-900 text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(99,102,241,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(16,185,129,0.3) 0%, transparent 50%)",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              GateKeep
            </span>
          </div>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            Modern visitor management for your residential community.
          </h1>
          <p className="mt-4 text-slate-300 text-base sm:text-lg leading-relaxed">
            Pre-register guests, generate QR passes, and verify visitors at the
            gate — all in one secure, easy-to-use platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{" "}
              QR-based check-in
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{" "}
              Role-based access
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{" "}
              Real-time analytics
            </div>
          </div>
        </div>
        <div className="relative text-xs text-slate-400">
          Trusted by modern residential communities.
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
              {mode === "signin"
                ? "Sign in to your account"
                : "Create your account"}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              {mode === "signin"
                ? "Welcome back. Enter your details to continue."
                : "Fill in your details to get started."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <Input
                  label="Full name"
                  name="fullName"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Account type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {roleOptions.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`rounded-xl border p-3 text-left transition-all ${
                          role === r.value
                            ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <span className="block text-sm font-semibold text-slate-900">
                          {r.label}
                        </span>
                        <span className="block text-[11px] text-slate-500 mt-0.5 leading-tight">
                          {r.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                {role === "resident" && (
                  <Input
                    label="Apartment / Unit"
                    name="unit"
                    placeholder="e.g. A-204"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                )}
                <Input
                  label="Phone (optional)"
                  name="phone"
                  type="tel"
                  placeholder="+1 555 000 1234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </>
            )}

            <Input
              label="Email address"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
            />

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              {mode === "signin" ? "Sign in" : "Create account"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {mode === "signin" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className="font-semibold text-slate-900 hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                  className="font-semibold text-slate-900 hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>

          {mode === "signup" && (
            <button
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className="mt-4 w-full inline-flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </button>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
              Quick demo access
            </p>
            <div className="grid grid-cols-3 gap-2">
              {roleOptions.map((r) => (
                <button
                  key={r.value}
                  onClick={() =>
                    fillDemo({
                      email: `${r.value}@demo.app`,
                      password: "demo1234",
                    })
                  }
                  className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400 text-center">
              Demo accounts need to be created once via sign-up.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
