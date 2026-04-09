import React, { useMemo, useState, useEffect } from 'react';
import { User, Role } from '../types';
import {
  Shield,
  Activity,
  Database,
  Search,
  Pencil,
  KeyRound,
  X,
  Trash2,
  UserPlus,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { api, AuditLog } from '../api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface AdminPageProps {
  users: User[];
  onChanged?: () => void;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const inputClass =
  'w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-colors';

// ─── Admin Page ───────────────────────────────────────────────────────────────
export default function AdminPage({ users, onChanged }: AdminPageProps) {
  const [query, setQuery] = useState('');
  const [activeSection, setActiveSection] = useState<'users' | 'audit' | 'settings'>('users');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [settingPasswordFor, setSettingPasswordFor] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [addingUser, setAddingUser] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState<Record<string, boolean>>({
    automatedPenalties: true,
    allowLoanRequests: true,
    publicTransparency: true,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Audit log state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const PAGE_SIZE = 15;

  useEffect(() => {
    if (activeSection === 'settings') loadSettings();
    if (activeSection === 'audit') loadAuditLogs(0);
  }, [activeSection]);

  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const data = await api.getSettings();
      setSettings(s => ({ ...s, ...data }));
    } finally {
      setSettingsLoading(false);
    }
  };

  const loadAuditLogs = async (page: number) => {
    setAuditLoading(true);
    try {
      const { logs, total } = await api.getAuditLogs(PAGE_SIZE, page * PAGE_SIZE);
      setAuditLogs(logs);
      setAuditTotal(total);
      setAuditPage(page);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleToggle = async (key: string) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    try {
      await api.updateSettings({ [key]: updated[key] });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch {
      setSettings(settings); // revert on error
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.phoneNumber.toLowerCase().includes(q)
    );
  }, [users, query]);

  const totalPages = Math.ceil(auditTotal / PAGE_SIZE);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Admin Control Center</h3>
          <p className="text-sm text-zinc-400">System-wide settings and administrative controls</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AdminCard title="System Health" status="Operational" icon={<Activity className="text-emerald-500" />} />
        <AdminCard title="Total Members" status={String(users.length)} icon={<Database className="text-blue-500" />} />
        <AdminCard title="Security Level" status="High" icon={<Shield className="text-purple-500" />} />
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-white/5">
        {(['users', 'settings', 'audit'] as const).map(section => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={cn(
              'px-5 py-3 text-sm font-bold capitalize transition-colors border-b-2 -mb-px',
              activeSection === section
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-white'
            )}
          >
            {section === 'audit' ? 'Audit Logs' : section === 'settings' ? 'Settings' : 'User Management'}
          </button>
        ))}
      </div>

      {/* ── User Management ─────────────────────────────────────────────────── */}
      {activeSection === 'users' && (
        <div className="bg-zinc-900/50 rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h4 className="font-bold text-white">User Management</h4>
              <p className="text-sm text-zinc-500">Edit details, set passwords, and manage access</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search users..."
                  className="pl-9 pr-3 py-2 bg-white/5 rounded-full text-sm border border-white/5 focus:ring-2 focus:ring-emerald-500/20 w-64 transition-all text-white placeholder:text-zinc-600 outline-none"
                />
              </div>
              <button
                onClick={() => { setError(null); setAddingUser(true); }}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
              >
                <UserPlus size={16} /> Add Member
              </button>
            </div>
          </div>

          {error && (
            <div className="px-6 py-3 border-b border-white/5 text-sm text-red-400 bg-red-500/5">
              {error}
            </div>
          )}

          <div className="divide-y divide-white/5">
            <div className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-zinc-500 bg-white/5 grid grid-cols-12 gap-4">
              <div className="col-span-4">User</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-3">Phone</div>
              <div className="col-span-2">Join Date</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            {filtered.map(u => (
              <div key={u.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-white/[0.02] group">
                <div className="col-span-4 min-w-0 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-sm shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{u.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                  </div>
                </div>
                <div className="col-span-2">
                  <RoleBadge role={u.role} />
                </div>
                <div className="col-span-3 text-sm text-zinc-400">{u.phoneNumber}</div>
                <div className="col-span-2 text-sm text-zinc-500">{u.joinDate}</div>
                <div className="col-span-1 flex justify-end gap-1">
                  <button
                    onClick={() => { setError(null); setEditingUser(u); }}
                    className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:border-white/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Edit details"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => { setError(null); setSettingPasswordFor(u); }}
                    className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:border-white/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Set password"
                  >
                    <KeyRound size={14} />
                  </button>
                  <button
                    onClick={() => { setError(null); setDeletingUser(u); }}
                    className="p-1.5 rounded-lg bg-red-500/5 border border-red-500/10 text-red-500/50 hover:text-red-400 hover:border-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete user"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-6 py-10 text-sm text-zinc-500">No users match your search.</div>
            )}
          </div>
        </div>
      )}

      {/* ── Settings ────────────────────────────────────────────────────────── */}
      {activeSection === 'settings' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-white">Global Settings</h4>
              {settingsSaved && (
                <span className="text-xs text-emerald-400 font-bold animate-pulse">✓ Saved</span>
              )}
              {settingsLoading && <Loader2 size={16} className="animate-spin text-zinc-500" />}
            </div>
            <div className="space-y-2">
              <SettingToggle
                label="Enable Automated Penalties"
                description="Automatically apply late fees to overdue contributions"
                checked={settings.automatedPenalties ?? true}
                onChange={() => handleToggle('automatedPenalties')}
              />
              <SettingToggle
                label="Allow Member Loan Requests"
                description="Members can submit loan requests through the portal"
                checked={settings.allowLoanRequests ?? true}
                onChange={() => handleToggle('allowLoanRequests')}
              />
              <SettingToggle
                label="Public Financial Transparency"
                description="All members can view group-level financial summaries"
                checked={settings.publicTransparency ?? true}
                onChange={() => handleToggle('publicTransparency')}
              />
            </div>
          </div>

          <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-6">
            <h4 className="font-bold text-white mb-2">Danger Zone</h4>
            <p className="text-sm text-zinc-500 mb-4">Irreversible actions — proceed with care.</p>
            <button className="px-4 py-2 rounded-xl text-sm font-bold border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors">
              Export All Data (CSV)
            </button>
          </div>
        </div>
      )}

      {/* ── Audit Logs ──────────────────────────────────────────────────────── */}
      {activeSection === 'audit' && (
        <div className="bg-zinc-900/50 rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardList className="text-zinc-400" size={20} />
              <div>
                <h4 className="font-bold text-white">Audit Logs</h4>
                <p className="text-sm text-zinc-500">{auditTotal.toLocaleString()} total events</p>
              </div>
            </div>
            <button
              onClick={() => loadAuditLogs(auditPage)}
              className="p-2 text-zinc-500 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} className={auditLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {auditLoading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-zinc-500 text-sm">
              <Loader2 size={16} className="animate-spin" /> Loading logs...
            </div>
          ) : (
            <>
              <div className="divide-y divide-white/5">
                <div className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-zinc-500 bg-white/5 grid grid-cols-12 gap-4">
                  <div className="col-span-3">Timestamp</div>
                  <div className="col-span-2">Actor</div>
                  <div className="col-span-3">Action</div>
                  <div className="col-span-2">Entity</div>
                  <div className="col-span-2">Details</div>
                </div>
                {auditLogs.map(log => (
                  <div key={log.id} className="px-6 py-3 grid grid-cols-12 gap-4 items-start hover:bg-white/[0.02] text-sm">
                    <div className="col-span-3 text-zinc-500 text-xs font-mono">
                      {formatDateTime(log.createdAt)}
                    </div>
                    <div className="col-span-2 text-zinc-400 truncate text-xs" title={log.actorEmail ?? ''}>
                      {log.actorEmail ?? <span className="text-zinc-600">system</span>}
                    </div>
                    <div className="col-span-3">
                      <ActionBadge action={log.action} />
                    </div>
                    <div className="col-span-2 text-zinc-500 text-xs">
                      {log.entityType && (
                        <span className="font-mono">{log.entityType}</span>
                      )}
                    </div>
                    <div className="col-span-2 text-zinc-600 text-xs font-mono truncate" title={log.detailsJson ?? ''}>
                      {log.detailsJson ? summariseDetails(log.detailsJson) : '—'}
                    </div>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <div className="px-6 py-10 text-sm text-zinc-500">No audit events recorded yet.</div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
                  <p className="text-xs text-zinc-500">
                    Page {auditPage + 1} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={auditPage === 0}
                      onClick={() => loadAuditLogs(auditPage - 1)}
                      className="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      disabled={auditPage >= totalPages - 1}
                      onClick={() => loadAuditLogs(auditPage + 1)}
                      className="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {addingUser && (
        <AddUserModal
          saving={saving}
          onClose={() => setAddingUser(false)}
          onSave={async (data) => {
            setSaving(true);
            setError(null);
            try {
              await api.registerUser(data);
              setAddingUser(false);
              onChanged?.();
            } catch (e: any) {
              setError(e?.message ?? 'Failed to add member');
            } finally {
              setSaving(false);
            }
          }}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          saving={saving}
          onClose={() => setEditingUser(null)}
          onSave={async (data) => {
            setSaving(true);
            setError(null);
            try {
              await api.updateUser(editingUser.id, data);
              setEditingUser(null);
              onChanged?.();
            } catch (e: any) {
              setError(e?.message ?? 'Failed to update user');
            } finally {
              setSaving(false);
            }
          }}
        />
      )}

      {settingPasswordFor && (
        <SetPasswordModal
          user={settingPasswordFor}
          saving={saving}
          onClose={() => setSettingPasswordFor(null)}
          onSave={async (password) => {
            setSaving(true);
            setError(null);
            try {
              await api.setUserPassword(settingPasswordFor.id, password);
              setSettingPasswordFor(null);
              onChanged?.();
            } catch (e: any) {
              setError(e?.message ?? 'Failed to set password');
            } finally {
              setSaving(false);
            }
          }}
        />
      )}

      {deletingUser && (
        <DeleteUserModal
          user={deletingUser}
          saving={saving}
          onClose={() => setDeletingUser(null)}
          onConfirm={async () => {
            setSaving(true);
            setError(null);
            try {
              await api.deleteUser(deletingUser.id);
              setDeletingUser(null);
              onChanged?.();
            } catch (e: any) {
              setError(e?.message ?? 'Failed to delete user');
              setDeletingUser(null);
            } finally {
              setSaving(false);
            }
          }}
        />
      )}
    </div>
  );
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function AdminCard({ title, status, icon }: { title: string; status: string; icon: React.ReactNode }) {
  return (
    <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h5 className="text-sm font-medium text-zinc-400">{title}</h5>
      </div>
      <p className="text-xl font-bold text-white">{status}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const cls =
    role === 'Admin'
      ? 'bg-purple-500/10 text-purple-500'
      : role === 'Treasurer'
      ? 'bg-blue-500/10 text-blue-500'
      : 'bg-zinc-500/10 text-zinc-400';
  return <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full', cls)}>{role}</span>;
}

function SettingToggle({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-1 border-b border-white/5 last:border-0">
      <div className="flex-1 pr-6">
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        <p className="text-xs text-zinc-600 mt-0.5">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors focus:outline-none flex-shrink-0',
          checked ? 'bg-emerald-600' : 'bg-zinc-700'
        )}
        aria-checked={checked}
        role="switch"
      >
        <span
          className={cn(
            'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all',
            checked ? 'right-1' : 'left-1'
          )}
        />
      </button>
    </div>
  );
}

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-white/5 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h4 className="text-xl font-bold text-white">{title}</h4>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

function AddUserModal({
  saving,
  onClose,
  onSave,
}: {
  saving: boolean;
  onClose: () => void;
  onSave: (data: { name: string; email: string; role: Role; phoneNumber: string; password: string }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('Member');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  return (
    <ModalShell title="Add New Member" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={e => { e.preventDefault(); void onSave({ name, email, role, phoneNumber, password }); }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full Name">
            <input value={name} onChange={e => setName(e.target.value)} className={inputClass} required placeholder="Jane Doe" />
          </Field>
          <Field label="Role">
            <select value={role} onChange={e => setRole(e.target.value as Role)} className={inputClass}>
              <option value="Member">Member</option>
              <option value="Treasurer">Treasurer</option>
              <option value="Admin">Admin</option>
            </select>
          </Field>
          <Field label="Email">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} required placeholder="jane@example.com" />
          </Field>
          <Field label="Phone">
            <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className={inputClass} required placeholder="+2547..." />
          </Field>
        </div>
        <Field label="Initial Password">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} required placeholder="Minimum 6 characters" minLength={6} />
        </Field>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-white/10 text-zinc-300 hover:text-white transition-colors">
            Cancel
          </button>
          <button disabled={saving} type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Adding...</> : 'Add Member'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function EditUserModal({
  user,
  saving,
  onClose,
  onSave,
}: {
  user: User;
  saving: boolean;
  onClose: () => void;
  onSave: (data: { name: string; email: string; role: Role; phoneNumber: string }) => Promise<void>;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<Role>(user.role);
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber);

  return (
    <ModalShell title={`Edit: ${user.name}`} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={e => { e.preventDefault(); void onSave({ name, email, role, phoneNumber }); }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full Name">
            <input value={name} onChange={e => setName(e.target.value)} className={inputClass} required />
          </Field>
          <Field label="Role">
            <select value={role} onChange={e => setRole(e.target.value as Role)} className={inputClass}>
              <option value="Member">Member</option>
              <option value="Treasurer">Treasurer</option>
              <option value="Admin">Admin</option>
            </select>
          </Field>
          <Field label="Email">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} required />
          </Field>
          <Field label="Phone">
            <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className={inputClass} required />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-white/10 text-zinc-300 hover:text-white transition-colors">
            Cancel
          </button>
          <button disabled={saving} type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function SetPasswordModal({
  user,
  saving,
  onClose,
  onSave,
}: {
  user: User;
  saving: boolean;
  onClose: () => void;
  onSave: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const mismatch = password.length > 0 && confirm.length > 0 && password !== confirm;

  return (
    <ModalShell title={`Set Password: ${user.name}`} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={e => { e.preventDefault(); if (mismatch) return; void onSave(password); }}
      >
        <Field label="New Password">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} required minLength={6} placeholder="Min. 6 characters" />
        </Field>
        <Field label="Confirm Password">
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className={inputClass} required placeholder="Repeat password" />
          {mismatch && <p className="text-xs text-red-400 mt-1.5">Passwords do not match.</p>}
        </Field>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-white/10 text-zinc-300 hover:text-white transition-colors">
            Cancel
          </button>
          <button disabled={saving || mismatch} type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Set Password'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function DeleteUserModal({
  user,
  saving,
  onClose,
  onConfirm,
}: {
  user: User;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <ModalShell title="Delete Member" onClose={onClose}>
      <div className="space-y-5">
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
          <p className="text-sm text-red-300">
            Are you sure you want to permanently delete <span className="font-bold text-white">{user.name}</span>? This action cannot be undone and will remove all their data from the system.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-white/10 text-zinc-300 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            disabled={saving}
            onClick={() => void onConfirm()}
            className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> Deleting...</> : <><Trash2 size={14} /> Delete Member</>}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ActionBadge({ action }: { action: string }) {
  const color =
    action.includes('deleted') || action.includes('rejected')
      ? 'bg-red-500/10 text-red-400'
      : action.includes('approved') || action.includes('recorded') || action.includes('created')
      ? 'bg-emerald-500/10 text-emerald-400'
      : action.includes('password') || action.includes('updated')
      ? 'bg-blue-500/10 text-blue-400'
      : 'bg-zinc-500/10 text-zinc-400';
  return (
    <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full font-mono break-all leading-5', color)}>
      {action}
    </span>
  );
}

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function summariseDetails(json: string) {
  try {
    const obj = JSON.parse(json);
    const entries = Object.entries(obj).slice(0, 2);
    return entries.map(([k, v]) => `${k}:${v}`).join(' ');
  } catch {
    return json.slice(0, 40);
  }
}
