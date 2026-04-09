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
  X
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
  Area 
} from 'recharts';
import { User, Role, Contribution, Loan, FinancialSummary } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { api } from '../api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error(`Firestore ${operationType} error on ${path}:`, error);
  // In a real app, we would throw a structured error for the ErrorBoundary
}

const CHART_DATA = [
  { month: 'Jan', contributions: 45000, loans: 20000 },
  { month: 'Feb', contributions: 52000, loans: 35000 },
  { month: 'Mar', contributions: 48000, loans: 15000 },
  { month: 'Apr', contributions: 61000, loans: 40000 },
];

export function Dashboard({ summary }: { summary: FinancialSummary }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Contributions" value={`KES ${summary.totalContributions.toLocaleString()}`} trend="+12.5%" trendUp={true} icon={<Wallet className="text-emerald-500" />} />
        <StatCard title="Loans Disbursed" value={`KES ${summary.totalLoansDisbursed.toLocaleString()}`} trend="+5.2%" trendUp={true} icon={<HandCoins className="text-blue-500" />} />
        <StatCard title="Penalty Revenue" value={`KES ${summary.totalPenaltiesCollected.toLocaleString()}`} trend="-2.4%" trendUp={false} icon={<CircleAlert className="text-amber-500" />} />
        <StatCard title="Available Balance" value={`KES ${summary.availableBalance.toLocaleString()}`} trend="+8.1%" trendUp={true} icon={<TrendingUp className="text-purple-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-zinc-900/50 p-6 rounded-2xl border border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-white">Growth Overview</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="colorCont" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#666'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#666'}} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }} />
                <Area type="monotone" dataKey="contributions" stroke="#10b981" fillOpacity={1} fill="url(#colorCont)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 shadow-sm">
          <h3 className="font-bold text-lg mb-6 text-white">Recent Activity</h3>
          <div className="space-y-6">
            <ActivityItem icon={<ArrowUpRight className="text-emerald-500" />} title="Contribution Received" desc="Alice Wanjiku paid KES 5,000" time="2h ago" />
            <ActivityItem icon={<ArrowDownRight className="text-blue-500" />} title="Loan Approved" desc="KES 25,000 for Alice Wanjiku" time="5h ago" />
            <ActivityItem icon={<CircleAlert className="text-amber-500" />} title="Penalty Applied" desc="Bob Otieno: KES 500 late fee" time="1d ago" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, trendUp, icon }: { title: string, value: string, trend: string, trendUp: boolean, icon: React.ReactNode }) {
  return (
    <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 shadow-sm hover:border-white/10 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-white/5 rounded-xl">{icon}</div>
        <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full", trendUp ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>{trend}</span>
      </div>
      <p className="text-sm text-zinc-500 font-medium">{title}</p>
      <h4 className="text-2xl font-bold mt-1 text-white">{value}</h4>
    </div>
  );
}

function ActivityItem({ icon, title, desc, time }: { icon: React.ReactNode, title: string, desc: string, time: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate text-white">{title}</p>
        <p className="text-xs text-zinc-500 truncate">{desc}</p>
      </div>
      <span className="text-[10px] font-bold text-zinc-600 uppercase">{time}</span>
    </div>
  );
}

export function Members({ users, isAdmin }: { users: User[], isAdmin: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Member' as Role, phoneNumber: '' });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.registerUser(formData);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', role: 'Member', phoneNumber: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'users');
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-white">Register New Member</h4>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Email Address</label>
                <input 
                  type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Phone Number</label>
                <input 
                  type="text" required value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Role</label>
                <select 
                  value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role})}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                >
                  <option value="Member">Member</option>
                  <option value="Treasurer">Treasurer</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl mt-4 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all">
                Register Member
              </button>
            </form>
          </div>
        </div>
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
            {users
              .filter(user => isAdmin || user.role !== 'Admin')
              .map(user => (
              <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold">{user.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-bold text-white">{user.name}</p>
                      <p className="text-xs text-zinc-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full", user.role === 'Admin' ? "bg-purple-500/10 text-purple-500" : user.role === 'Treasurer' ? "bg-blue-500/10 text-blue-500" : "bg-zinc-500/10 text-zinc-500")}>{user.role}</span>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-400">{user.phoneNumber}</td>
                <td className="px-6 py-4 text-sm text-zinc-400">{user.joinDate}</td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-zinc-600 hover:text-white transition-colors"><UserCircle size={20} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Contributions({ contributions, isOfficial, users }: { contributions: Contribution[], isOfficial: boolean, users: User[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ memberId: '', memberName: '', amount: 0, date: new Date().toISOString().split('T')[0], status: 'Paid' as any, penalty: 0 });

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedUser = users.find(u => u.id === formData.memberId);
      await api.recordContribution({
        ...formData,
        memberName: selectedUser?.name || 'Unknown'
      });
      setIsModalOpen(false);
      setFormData({ memberId: '', memberName: '', amount: 0, date: new Date().toISOString().split('T')[0], status: 'Paid', penalty: 0 });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'contributions');
    }
  };

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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-white">Record Contribution</h4>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleRecord} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Select Member</label>
                <select 
                  required value={formData.memberId} onChange={e => setFormData({...formData, memberId: e.target.value})}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                >
                  <option value="">Choose a member...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Amount (KES)</label>
                <input 
                  type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Date</label>
                <input 
                  type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</label>
                <select 
                  value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                >
                  <option value="Paid">Paid</option>
                  <option value="Late">Late</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl mt-4 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all">
                Record Payment
              </button>
            </form>
          </div>
        </div>
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
              <th className="px-6 py-4 text-right">Receipt</th>
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
                    {c.status === 'Paid' ? <CheckCircle2 size={14} className="text-emerald-500" /> : c.status === 'Late' ? <Clock size={14} className="text-amber-500" /> : <XCircle size={14} className="text-red-500" />}
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", c.status === 'Paid' ? "text-emerald-500" : c.status === 'Late' ? "text-amber-500" : "text-red-500")}>{c.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-red-500">{c.penalty > 0 ? `KES ${c.penalty.toLocaleString()}` : '—'}</td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-zinc-600 hover:text-emerald-500 transition-colors"><FileText size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Loans({ loans, currentUser }: { loans: Loan[], currentUser: User }) {
  const isOfficial = ['Admin', 'Treasurer'].includes(currentUser.role);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ amount: 0, purpose: '', requestDate: new Date().toISOString().split('T')[0] });

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.requestLoan({
        ...formData,
        memberId: currentUser.id,
        memberName: currentUser.name
      });
      setIsModalOpen(false);
      setFormData({ amount: 0, purpose: '', requestDate: new Date().toISOString().split('T')[0] });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'loans');
    }
  };

  const handleStatusUpdate = async (loanId: string, newStatus: string) => {
    try {
      await api.updateLoanStatus(loanId, newStatus);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `loans/${loanId}`);
    }
  };

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-white">Request Loan</h4>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleRequest} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Amount (KES)</label>
                <input 
                  type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Purpose</label>
                <textarea 
                  required value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 outline-none h-24 resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Request Date</label>
                <input 
                  type="date" required value={formData.requestDate} onChange={e => setFormData({...formData, requestDate: e.target.value})}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl mt-4 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all">
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {loans.map(loan => (
          <div key={loan.id} className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", loan.status === 'Approved' ? "bg-emerald-500/10 text-emerald-500" : loan.status === 'Pending' ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500")}>
                <HandCoins size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-lg text-white">KES {loan.amount.toLocaleString()}</h4>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest", loan.status === 'Approved' ? "bg-emerald-500/10 text-emerald-500" : loan.status === 'Pending' ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500")}>{loan.status}</span>
                </div>
                <p className="text-sm text-zinc-400">{loan.memberName} • {loan.purpose}</p>
              </div>
            </div>
            {isOfficial && loan.status === 'Pending' && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleStatusUpdate(loan.id, 'Rejected')}
                  className="px-4 py-2 rounded-xl text-sm font-bold border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  Reject
                </button>
                <button 
                  onClick={() => handleStatusUpdate(loan.id, 'Approved')}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                >
                  Approve
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Reports() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Financial Reports</h3>
          <p className="text-sm text-zinc-500">Real-time statements and group performance analytics</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 shadow-sm">
          <h3 className="font-bold text-lg mb-6 text-white">Contributions vs Loans</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#666'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#666'}} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                <Bar dataKey="contributions" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="loans" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 shadow-sm">
          <h3 className="font-bold text-lg mb-6 text-white">Group Health Metrics</h3>
          <div className="space-y-6">
            <MetricRow label="Repayment Rate" value="94.2%" trend="+2.1%" />
            <MetricRow label="Contribution Compliance" value="88.5%" trend="-1.5%" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, trend }: { label: string, value: string, trend: string }) {
  const isPositive = trend.startsWith('+');
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
      <div>
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-bold mt-1 text-white">{value}</p>
      </div>
      <span className={cn("text-xs font-bold px-2 py-1 rounded-lg", isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>{trend}</span>
    </div>
  );
}
