import { useMemo, useState } from "react";
import {
  Search,
  UserPlus,
  ShieldCheck,
  Home,
  User as UserIcon,
  Power,
  Pencil,
} from "lucide-react";
import {
  useProfiles,
  updateProfile,
  createProfileViaSignup,
} from "@/hooks/useProfiles";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import type { Profile, UserRole } from "@/types";

const roleConfig: Record<
  UserRole,
  { label: string; icon: React.ReactNode; color: string }
> = {
  resident: {
    label: "Resident",
    icon: <Home className="h-3.5 w-3.5" />,
    color: "bg-blue-100 text-blue-700",
  },
  guard: {
    label: "Guard",
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    color: "bg-teal-100 text-teal-700",
  },
  admin: {
    label: "Admin",
    icon: <UserIcon className="h-3.5 w-3.5" />,
    color: "bg-slate-900 text-white",
  },
};

export function AdminUsersScreen() {
  const { profile: me } = useAuth();
  const { toast } = useToast();
  const { profiles, loading, reload } = useProfiles();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [editing, setEditing] = useState<Profile | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      if (roleFilter !== "all" && p.role !== roleFilter) return false;
      if (
        search &&
        !p.full_name.toLowerCase().includes(search.toLowerCase()) &&
        !p.unit?.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [profiles, search, roleFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage residents, guards, and administrators.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <UserPlus className="h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "resident", "guard", "admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
                roleFilter === r
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {r === "all" ? "All" : r}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<UserIcon className="h-6 w-6" />}
              title="No users found"
              description="Try adjusting your search or add a new user."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const rc = roleConfig[p.role];
                return (
                  <li key={p.id} className="px-5 py-4 flex items-center gap-4">
                    <Avatar name={p.full_name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 truncate">
                          {p.full_name}
                        </p>
                        {p.id === me?.id && (
                          <span className="text-xs text-slate-400">(you)</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 truncate">
                        {p.unit ? `Unit ${p.unit} · ` : ""}
                        {p.phone ?? "No phone"} · Joined{" "}
                        {formatDate(p.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${rc.color}`}
                      >
                        {rc.icon} {rc.label}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${p.active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-600"}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                        {p.active ? "Active" : "Disabled"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditing(p)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
          onToast={toast}
        />
      )}
      {creating && (
        <CreateUserModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            reload();
          }}
          onToast={toast}
        />
      )}
    </div>
  );
}

function EditUserModal({
  user,
  onClose,
  onSaved,
  onToast,
}: {
  user: Profile;
  onClose: () => void;
  onSaved: () => void;
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const [fullName, setFullName] = useState(user.full_name);
  const [role, setRole] = useState<UserRole>(user.role);
  const [unit, setUnit] = useState(user.unit ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [active, setActive] = useState(user.active);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile(user.id, {
        full_name: fullName.trim(),
        role,
        unit: unit.trim() || null,
        phone: phone.trim() || null,
        active,
      });
      onToast("User updated successfully.", "success");
      onSaved();
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : "Failed to update user.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit User"
      description={`${user.full_name}`}
    >
      <div className="space-y-4">
        <Input
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Select
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
        >
          <option value="resident">Resident</option>
          <option value="guard">Security Guard</option>
          <option value="admin">Administrator</option>
        </Select>
        <Input
          label="Unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="e.g. A-204"
        />
        <Input
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 555 000 1234"
        />
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
          <span className="text-sm text-slate-700 flex items-center gap-1.5">
            <Power className="h-4 w-4" /> Account active
          </span>
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function CreateUserModal({
  onClose,
  onSaved,
  onToast,
}: {
  onClose: () => void;
  onSaved: () => void;
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("resident");
  const [unit, setUnit] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      onToast("Name, email, and password are required.", "error");
      return;
    }
    if (password.length < 6) {
      onToast("Password must be at least 6 characters.", "error");
      return;
    }
    setSaving(true);
    try {
      await createProfileViaSignup({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        role,
        unit: unit.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      onToast("User created successfully.", "success");
      onSaved();
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : "Failed to create user.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add New User"
      description="Create a new resident, guard, or admin account."
    >
      <div className="space-y-4">
        <Input
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Doe"
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
        />
        <Select
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
        >
          <option value="resident">Resident</option>
          <option value="guard">Security Guard</option>
          <option value="admin">Administrator</option>
        </Select>
        {role === "resident" && (
          <Input
            label="Unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g. A-204"
          />
        )}
        <Input
          label="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 555 000 1234"
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={handleCreate}>
            <UserPlus className="h-4 w-4" /> Create User
          </Button>
        </div>
      </div>
    </Modal>
  );
}
