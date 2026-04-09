import React, { useState } from 'react';
import { 
  HandCoins, 
  CircleAlert, 
  FileText, 
  Plus, 
  UserCircle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  X,
  Loader2,
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Legend
} from 'recharts';
import { User, Role, Contribution, Loan, FinancialSummary, ChartData, StatementData } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { api, GroupMetrics, ActivityItem } from '../api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
const inputClass = "w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-colors";

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function Dashboard({
  summary,
  chartData,
  metrics,
  activity,
}: {
  summary: FinancialSummary;
  chartData: ChartData[];
  metrics: GroupMetrics | null;
  activity: ActivityItem[];
}) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Contributions"
          value={`KES ${summary.totalContributions.toLocaleString()}`}
          sub={metrics ? `${metrics.complianceRate}% compliance` : undefined}
          trendUp={true}
          icon={<Wallet className="text-emerald-500" />}
        />
        <StatCard
          title="Loans Disbursed"
          value={`KES ${summary.totalLoansDisbursed.toLocaleString()}`}
          sub={metrics ? `${metrics.pendingLoans} pending` : undefined}
          trendUp={true}
          icon={<HandCoins className="text-blue-500" />}
        />
        <StatCard
          title="Penalty Revenue"
          value={`KES ${summary.totalPenaltiesCollected.toLocaleString()}`}
          trendUp={false}
          icon={<CircleAlert className="text-amber-500" />}
        />
        <StatCard
          title="Available Balance"
          value={`KES ${summary.availableBalance.toLocaleString()}`}
          trendUp={summary.availableBalance >= 0}
          icon={<TrendingUp className="text-purple-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-zinc-900/50 p-6 rounded-2xl border border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-white">Growth Overview</h3>
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Contributions</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Loans</span>
            </div>
          </div>
          <div className="h-[300px]">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                No transaction data yet. Record contributions or approve loans to see the chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCont" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                    formatter={(value: number) => [`KES ${value.toLocaleString()}`, undefined]}
                  />
                  <Area type="monotone" dataKey="contributions" name="Contributions" stroke="#10b981" fillOpacity={1} fill="url(#colorCont)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="loans" name="Loans" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLoans)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 shadow-sm">
          <h3 className="font-bold text-lg mb-6 text-white">Recent Activity</h3>
          <div className="space-y-5">
            {activity.length === 0 ? (
              <p className="text-sm text-zinc-600">No activity yet.</p>
            ) : (
              activity.slice(0, 6).map((item) => (
                <ActivityItemRow key={item.id} item={item} />
              ))
            )}
          </div>
        </div>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard label="Repayment Rate" value={`${metrics.repaymentRate}%`} color="emerald" />
          <MetricCard label="Contribution Compliance" value={`${metrics.complianceRate}%`} color="blue" />
          <MetricCard label="Total Members" value={String(metrics.totalMembers)} color="purple" />
        </div>
      )}
    </div>
  );
}

function ActivityItemRow({ item }: { key?: string | number; item: ActivityItem }) {
  const configs: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    contribution: { icon: <ArrowUpRight className="text-emerald-500" />, label: 'Contribution', color: 'text-emerald-500' },
    loan_disbursement: { icon: <ArrowDownRight className="text-blue-500" />, label: 'Loan Disbursed', color: 'text-blue-500' },
    loan_repayment: { icon: <ArrowUpRight className="text-purple-500" />, label: 'Loan Repayment', color: 'text-purple-500' },
    penalty: { icon: <CircleAlert className="text-amber-500" />, label: 'Penalty', color: 'text-amber-500' },
  };
  const cfg = configs[item.type] ?? configs.contribution;
  const timeAgo = formatTimeAgo(item.createdAt);

  return (
    <div className="flex gap-4">
      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate text-white">{cfg.label}</p>
        <p className="text-xs text-zinc-500 truncate">{item.memberName} • KES {item.amount.toLocaleString()}</p>
      </div>
      <span className="text-[10px] font-bold text-zinc-600 uppercase shrink-0">{timeAgo}</span>
    </div>
  );
}

function formatTimeAgo(isoStr: string): string {
  try {
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return '';
  }
}

function MetricCard({ label, value, color }: { label: string; value: string; color: 'emerald' | 'blue' | 'purple' }) {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/10',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/10',
  };
  return (
    <div className={cn('p-5 rounded-2xl border flex flex-col gap-1', colorMap[color])}>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function StatCard({ title, value, sub, trendUp, icon }: {
  title: string;
  value: string;
  sub?: string;
  trendUp: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 shadow-sm hover:border-white/10 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-white/5 rounded-xl">{icon}</div>
        {sub && (
          <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full', trendUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500')}>
            {sub}
          </span>
        )}
      </div>
      <p className="text-sm text-zinc-500 font-medium">{title}</p>
      <h4 className="text-2xl font-bold mt-1 text-white">{value}</h4>
    </div>
  );
}

// ─── Members ──────────────────────────────────────────────────────────────────
export function Members({ users, isAdmin, onChanged }: { users: User[]; isAdmin: boolean; onChanged: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Member' as Role, phoneNumber: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.registerUser(formData);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', role: 'Member', phoneNumber: '', password: '' });
      onChanged();
    } catch (err: any) {
      setError(err.message ?? 'Failed to register member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Group Members</h3>
          <p className="text-sm text-zinc-500">Manage and view all registered chama members</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
          >
            <Plus size={18} /> Register Member
          </button>
        )}
      </div>

      {isModalOpen && (
        <ModalShell title="Register New Member" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full Name">
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Role">
                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as Role })} className={inputClass}>
                  <option value="Member">Member</option>
                  <option value="Treasurer">Treasurer</option>
                  <option value="Admin">Admin</option>
                </select>
              </Field>
              <Field label="Email Address">
                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Phone Number">
                <input type="text" required value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} className={inputClass} placeholder="+2547..." />
              </Field>
            </div>
            <Field label="Initial Password">
              <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className={inputClass} placeholder="Set a login password" />
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl border border-white/10 text-zinc-300 hover:text-white transition-colors">Cancel</button>
              <button disabled={saving} type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {saving ? 'Registering...' : 'Register Member'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      <div className="bg-zinc-900/50 rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 text-[10px] uppercase tracking-widest font-bold text-zinc-500">
              <th className="px-6 py-4">Member</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Join Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{user.name}</p>
                      <p className="text-xs text-zinc-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-6 py-4 text-sm text-zinc-400">{user.phoneNumber}</td>
                <td className="px-6 py-4 text-sm text-zinc-400">{user.joinDate}</td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-zinc-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                    <UserCircle size={20} />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-zinc-600 text-sm">No members yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Contributions ────────────────────────────────────────────────────────────
export function Contributions({ contributions, isOfficial, users, onChanged }: {
  contributions: Contribution[];
  isOfficial: boolean;
  users: User[];
  onChanged: () => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    memberId: '',
    memberName: '',
    amount: 0,
    date: today(),
    status: 'Paid' as 'Paid' | 'Late' | 'Pending',
    penalty: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const selectedUser = users.find(u => u.id === formData.memberId);
      await api.recordContribution({ ...formData, memberName: selectedUser?.name ?? 'Unknown' });
      setIsModalOpen(false);
      setFormData({ memberId: '', memberName: '', amount: 0, date: today(), status: 'Paid', penalty: 0 });
      onChanged();
    } catch (err: any) {
      setError(err.message ?? 'Failed to record contribution');
    } finally {
      setSaving(false);
    }
  };

  const totalPaid = contributions.filter(c => c.status === 'Paid').reduce((s, c) => s + c.amount, 0);
  const totalPending = contributions.filter(c => c.status !== 'Paid').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Contribution Tracking</h3>
          <p className="text-sm text-zinc-500">Monthly records and automated penalty tracking</p>
        </div>
        {isOfficial && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
          >
            <Plus size={18} /> Record Payment
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Total Paid</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">KES {totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Records</p>
          <p className="text-xl font-bold text-white mt-1">{contributions.length}</p>
        </div>
        <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Outstanding</p>
          <p className="text-xl font-bold text-amber-400 mt-1">{totalPending}</p>
        </div>
      </div>

      {isModalOpen && (
        <ModalShell title="Record Contribution" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleRecord} className="space-y-4">
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Select Member">
                <select required value={formData.memberId} onChange={e => setFormData({ ...formData, memberId: e.target.value })} className={inputClass}>
                  <option value="">Choose a member...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className={inputClass}>
                  <option value="Paid">Paid</option>
                  <option value="Late">Late</option>
                  <option value="Pending">Pending</option>
                </select>
              </Field>
              <Field label="Amount (KES)">
                <input type="number" min="1" required value={formData.amount || ''} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} className={inputClass} />
              </Field>
              <Field label="Date">
                <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className={inputClass} />
              </Field>
            </div>
            {formData.status === 'Late' && (
              <Field label="Late Penalty (KES)">
                <input type="number" min="0" value={formData.penalty || ''} onChange={e => setFormData({ ...formData, penalty: Number(e.target.value) })} className={inputClass} />
              </Field>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl border border-white/10 text-zinc-300 hover:text-white transition-colors">Cancel</button>
              <button disabled={saving} type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 size={16} className="animate-spin" /> : 'Record Payment'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      <div className="bg-zinc-900/50 rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 text-[10px] uppercase tracking-widest font-bold text-zinc-500">
              <th className="px-6 py-4">Member</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Penalty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {contributions.map(c => (
              <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-white">{c.memberName}</td>
                <td className="px-6 py-4 text-sm font-mono text-zinc-300">KES {c.amount.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-zinc-500">{c.date}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {c.status === 'Paid'
                      ? <CheckCircle2 size={14} className="text-emerald-500" />
                      : c.status === 'Late'
                      ? <Clock size={14} className="text-amber-500" />
                      : <XCircle size={14} className="text-red-500" />}
                    <span className={cn('text-[10px] font-bold uppercase tracking-wider',
                      c.status === 'Paid' ? 'text-emerald-500' : c.status === 'Late' ? 'text-amber-500' : 'text-red-500'
                    )}>{c.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-red-500">{c.penalty > 0 ? `KES ${c.penalty.toLocaleString()}` : '—'}</td>
              </tr>
            ))}
            {contributions.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-zinc-600 text-sm">No contributions recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Loans ────────────────────────────────────────────────────────────────────
export function Loans({ loans, currentUser, onChanged }: { loans: Loan[]; currentUser: User; onChanged: () => void }) {
  const isOfficial = ['Admin', 'Treasurer'].includes(currentUser.role);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ amount: 0, purpose: '', requestDate: today() });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repayLoanId, setRepayLoanId] = useState<string | null>(null);
  const [repayData, setRepayData] = useState({ amount: 0, penalty: 0 });
  const [repaying, setRepaying] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.requestLoan({ ...formData, memberId: currentUser.id, memberName: currentUser.name });
      setIsModalOpen(false);
      setFormData({ amount: 0, purpose: '', requestDate: today() });
      onChanged();
    } catch (err: any) {
      setError(err.message ?? 'Failed to submit loan request');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (loanId: string, newStatus: string) => {
    try {
      await api.updateLoanStatus(loanId, newStatus);
      onChanged();
    } catch (err: any) {
      alert(err.message ?? 'Failed to update loan status');
    }
  };

  const handleRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayLoanId) return;
    setRepaying(true);
    try {
      await api.repayLoan(repayLoanId, repayData.amount, repayData.penalty);
      setRepayLoanId(null);
      setRepayData({ amount: 0, penalty: 0 });
      onChanged();
    } catch (err: any) {
      alert(err.message ?? 'Failed to record repayment');
    } finally {
      setRepaying(false);
    }
  };

  const pending = loans.filter(l => l.status === 'Pending');
  const active = loans.filter(l => l.status === 'Approved');
  const others = loans.filter(l => !['Pending', 'Approved'].includes(l.status));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Loan Management</h3>
          <p className="text-sm text-zinc-500">Apply for loans and track approval workflows</p>
        </div>
        {currentUser.role === 'Member' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
          >
            <Plus size={18} /> Request Loan
          </button>
        )}
      </div>

      {isModalOpen && (
        <ModalShell title="Request Loan" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleRequest} className="space-y-4">
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Field label="Amount (KES)">
              <input type="number" min="1" required value={formData.amount || ''} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Purpose">
              <textarea required value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} className={cn(inputClass, 'h-24 resize-none')} />
            </Field>
            <Field label="Request Date">
              <input type="date" required value={formData.requestDate} onChange={e => setFormData({ ...formData, requestDate: e.target.value })} className={inputClass} />
            </Field>
            <p className="text-xs text-zinc-500">Interest rate: 10% flat. Due date: 30 days from approval.</p>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl border border-white/10 text-zinc-300 hover:text-white transition-colors">Cancel</button>
              <button disabled={saving} type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {saving ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {repayLoanId && (
        <ModalShell title="Record Repayment" onClose={() => setRepayLoanId(null)}>
          <form onSubmit={handleRepay} className="space-y-4">
            <Field label="Amount (KES)">
              <input type="number" min="1" required value={repayData.amount || ''} onChange={e => setRepayData({ ...repayData, amount: Number(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Late Penalty (Optional)">
              <input type="number" min="0" value={repayData.penalty || ''} onChange={e => setRepayData({ ...repayData, penalty: Number(e.target.value) })} className={inputClass} />
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setRepayLoanId(null)} className="px-4 py-2 rounded-xl border border-white/10 text-zinc-300 hover:text-white transition-colors">Cancel</button>
              <button disabled={repaying} type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {repaying ? 'Saving...' : 'Submit Repayment'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {pending.length > 0 && (
        <Section title="Pending Approval" count={pending.length} dot="amber">
          {pending.map(loan => (
            <LoanCard key={loan.id} loan={loan} isOfficial={isOfficial}
              onApprove={() => handleStatusUpdate(loan.id, 'Approved')}
              onReject={() => handleStatusUpdate(loan.id, 'Rejected')}
            />
          ))}
        </Section>
      )}

      {active.length > 0 && (
        <Section title="Active Loans" count={active.length} dot="emerald">
          {active.map(loan => (
            <LoanCard key={loan.id} loan={loan} isOfficial={isOfficial}
              onRepay={() => {
                const total = loan.amount + (loan.amount * loan.interestRate / 100);
                setRepayLoanId(loan.id);
                setRepayData({ amount: total - (loan.repaidAmount ?? 0), penalty: 0 });
              }}
            />
          ))}
        </Section>
      )}

      {others.length > 0 && (
        <Section title="History" count={others.length} dot="zinc">
          {others.map(loan => <LoanCard key={loan.id} loan={loan} isOfficial={isOfficial} />)}
        </Section>
      )}

      {loans.length === 0 && (
        <div className="text-center py-16 text-zinc-600 text-sm">No loan records yet.</div>
      )}
    </div>
  );
}

function Section({ title, count, dot, children }: { title: string; count: number; dot: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full bg-${dot}-500`} />
        <h4 className="font-bold text-white text-sm uppercase tracking-widest">{title}</h4>
        <span className="text-xs text-zinc-600">({count})</span>
      </div>
      {children}
    </div>
  );
}

function LoanCard({ loan, isOfficial, onApprove, onReject, onRepay }: {
  key?: string | number;
  loan: Loan;
  isOfficial: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onRepay?: () => void;
}) {
  const statusColor = {
    Approved: 'bg-emerald-500/10 text-emerald-500',
    Pending: 'bg-amber-500/10 text-amber-500',
    Rejected: 'bg-red-500/10 text-red-500',
    Repaid: 'bg-zinc-500/10 text-zinc-400',
  }[loan.status] ?? 'bg-zinc-500/10 text-zinc-400';

  const iconBg = {
    Approved: 'bg-emerald-500/10 text-emerald-500',
    Pending: 'bg-amber-500/10 text-amber-500',
    Rejected: 'bg-red-500/10 text-red-500',
    Repaid: 'bg-zinc-500/10 text-zinc-400',
  }[loan.status] ?? 'bg-zinc-500/10 text-zinc-400';

  const amountDue = loan.amount + (loan.amount * loan.interestRate / 100);
  const repaid = loan.repaidAmount ?? 0;
  const progress = Math.min((repaid / amountDue) * 100, 100);

  return (
    <div className="bg-zinc-900/50 p-5 rounded-2xl border border-white/5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
            <HandCoins size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-lg text-white">KES {loan.amount.toLocaleString()}</h4>
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest', statusColor)}>{loan.status}</span>
            </div>
            <p className="text-sm text-zinc-400">{loan.memberName} • {loan.purpose}</p>
            <p className="text-xs text-zinc-600 mt-0.5">
              Requested {loan.requestDate}{loan.dueDate ? ` · Due ${loan.dueDate}` : ''} · {loan.interestRate}% interest
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isOfficial && loan.status === 'Pending' && (
            <>
              <button onClick={onReject} className="px-3 py-1.5 rounded-xl text-sm font-bold border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors">Reject</button>
              <button onClick={onApprove} className="px-3 py-1.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">Approve</button>
            </>
          )}
          {isOfficial && loan.status === 'Approved' && (
            <button onClick={onRepay} className="px-3 py-1.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">Record Repayment</button>
          )}
        </div>
      </div>

      {loan.status === 'Approved' && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
            <span>Repaid: KES {repaid.toLocaleString()}</span>
            <span>Total due: KES {amountDue.toLocaleString()}</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export function Reports({ chartData, metrics }: { chartData: ChartData[]; metrics: GroupMetrics | null }) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-white">Financial Reports</h3>
        <p className="text-sm text-zinc-500">Real-time statements and group performance analytics</p>
      </div>

      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ReportStat label="Total Contributions" value={`KES ${metrics.totalContributions.toLocaleString()}`} color="emerald" />
          <ReportStat label="Total Disbursed" value={`KES ${metrics.totalDisbursed.toLocaleString()}`} color="blue" />
          <ReportStat label="Total Repaid" value={`KES ${metrics.totalRepaid.toLocaleString()}`} color="purple" />
          <ReportStat label="Total Penalties" value={`KES ${metrics.totalPenalties.toLocaleString()}`} color="amber" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 shadow-sm">
          <h3 className="font-bold text-lg mb-6 text-white">Contributions vs Loans</h3>
          <div className="h-[300px]">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-600 text-sm">No chart data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} formatter={(v: number) => [`KES ${v.toLocaleString()}`, undefined]} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#666' }} />
                  <Bar dataKey="contributions" name="Contributions" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="loans" name="Loans" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 shadow-sm">
          <h3 className="font-bold text-lg mb-6 text-white">Group Health Metrics</h3>
          {metrics ? (
            <div className="space-y-6">
              <HealthMetric label="Repayment Rate" value={metrics.repaymentRate} max={100} unit="%" color="emerald" />
              <HealthMetric label="Contribution Compliance" value={metrics.complianceRate} max={100} unit="%" color="blue" />
              <div className="pt-2 border-t border-white/5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Total Members</span>
                  <span className="text-white font-bold">{metrics.totalMembers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Pending Loans</span>
                  <span className={cn("font-bold", metrics.pendingLoans > 0 ? "text-amber-400" : "text-zinc-400")}>{metrics.pendingLoans}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-zinc-600 text-sm">Loading metrics...</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportStat({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    amber: 'text-amber-400',
  };
  return (
    <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{label}</p>
      <p className={cn('text-lg font-bold mt-1', colors[color] ?? 'text-white')}>{value}</p>
    </div>
  );
}

function HealthMetric({ label, value, max, unit, color }: { label: string; value: number; max: number; unit: string; color: 'emerald' | 'blue' }) {
  const pct = Math.min((value / max) * 100, 100);
  const barColor = color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500';
  const textColor = color === 'emerald' ? 'text-emerald-400' : 'text-blue-400';
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-zinc-400">{label}</span>
        <span className={cn('font-bold', textColor)}>{value}{unit}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── My Statement ─────────────────────────────────────────────────────────────
export function MyStatement() {
  const [statement, setStatement] = React.useState<StatementData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.getStatement().then(d => { setStatement(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-zinc-500 py-10">
        <Loader2 size={20} className="animate-spin" /> Loading statement...
      </div>
    );
  }
  if (!statement) return <div className="text-zinc-500 py-10">Could not load your statement.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white">My Statement</h3>
        <p className="text-sm text-zinc-500">Your personal transaction ledger</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatementTile label="Total Contributions" value={`KES ${statement.totals.totalContributions.toLocaleString()}`} color="text-emerald-400" />
        <StatementTile label="Loans Disbursed" value={`KES ${statement.totals.totalLoanDisbursed.toLocaleString()}`} color="text-blue-400" />
        <StatementTile label="Loans Repaid" value={`KES ${statement.totals.totalLoanRepaid.toLocaleString()}`} color="text-purple-400" />
        <StatementTile label="Total Penalties" value={`KES ${statement.totals.totalPenalties.toLocaleString()}`} color="text-red-400" />
      </div>

      <div className="bg-zinc-900/50 rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 text-[10px] uppercase tracking-widest font-bold text-zinc-500">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Notes</th>
              <th className="px-6 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {statement.transactions.map(t => (
              <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 text-sm text-zinc-400">{t.date}</td>
                <td className="px-6 py-4">
                  <TxBadge type={t.type} />
                </td>
                <td className="px-6 py-4 text-xs text-zinc-600">{t.notes ?? '—'}</td>
                <td className="px-6 py-4 text-right font-mono text-sm">
                  <span className={['loan_disbursement', 'penalty'].includes(t.type) ? 'text-red-400' : 'text-emerald-400'}>
                    {['loan_disbursement', 'penalty'].includes(t.type) ? '-' : '+'} KES {t.amount.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
            {statement.transactions.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-zinc-600 text-sm">No transactions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatementTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center justify-center">
      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{label}</p>
      <p className={cn('text-lg font-bold mt-1', color)}>{value}</p>
    </div>
  );
}

function TxBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    contribution: 'bg-emerald-500/10 text-emerald-500',
    loan_disbursement: 'bg-blue-500/10 text-blue-500',
    loan_repayment: 'bg-purple-500/10 text-purple-500',
    penalty: 'bg-red-500/10 text-red-500',
  };
  return (
    <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide', map[type] ?? 'bg-zinc-500/10 text-zinc-400')}>
      {type.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Settings View ────────────────────────────────────────────────────────────
export function SettingsView({ currentUser, onChanged }: { currentUser: User; onChanged: () => void }) {
  const [profileData, setProfileData] = React.useState({ name: currentUser.name, email: currentUser.email, phoneNumber: currentUser.phoneNumber || '' });
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [message, setMessage] = React.useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [savingPw, setSavingPw] = React.useState(false);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.updateUser(currentUser.id, { ...profileData, role: currentUser.role });
      showMsg('Profile updated successfully.', 'success');
      onChanged();
    } catch (err: any) {
      showMsg(err.message ?? 'Failed to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { showMsg('Passwords do not match.', 'error'); return; }
    if (password.length < 6) { showMsg('Password must be at least 6 characters.', 'error'); return; }
    setSavingPw(true);
    try {
      await api.setUserPassword(currentUser.id, password);
      showMsg('Password updated successfully.', 'success');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showMsg(err.message ?? 'Failed to update password.', 'error');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h3 className="text-2xl font-bold text-white">Account Settings</h3>
        <p className="text-sm text-zinc-500">Update your profile and security credentials</p>
      </div>

      {message && (
        <div className={cn('px-4 py-3 rounded-xl text-sm border', message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20')}>
          {message.text}
        </div>
      )}

      <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
        <h4 className="font-bold text-white mb-4">Profile Information</h4>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name">
              <input type="text" required value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Phone Number">
              <input type="text" required value={profileData.phoneNumber} onChange={e => setProfileData({ ...profileData, phoneNumber: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <Field label="Email Address">
            <input type="email" required value={profileData.email} onChange={e => setProfileData({ ...profileData, email: e.target.value })} className={inputClass} />
          </Field>
          <button disabled={savingProfile} type="submit" className="bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all text-sm disabled:opacity-50">
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
        <h4 className="font-bold text-white mb-4">Change Password</h4>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <Field label="New Password">
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className={inputClass} placeholder="Min. 6 characters" />
          </Field>
          <Field label="Confirm Password">
            <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} placeholder="Repeat password" />
          </Field>
          <button disabled={savingPw} type="submit" className="bg-zinc-800 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-zinc-700 transition-all text-sm border border-white/10 disabled:opacity-50">
            {savingPw ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Shared Helpers ───────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const cls = role === 'Admin' ? 'bg-purple-500/10 text-purple-500' : role === 'Treasurer' ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-500/10 text-zinc-400';
  return <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full', cls)}>{role}</span>;
}

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-white/5 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h4 className="text-xl font-bold text-white">{title}</h4>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
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

function today() {
  return new Date().toISOString().split('T')[0];
}
