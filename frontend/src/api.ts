import { User, Contribution, Loan, StatementData, ChartData } from './types';

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data: any = await res.clone().json();
    return data?.error || data?.message || `HTTP ${res.status}`;
  } catch {
    try {
      const text = await res.clone().text();
      return text?.slice(0, 200) || `HTTP ${res.status}`;
    } catch {
      return `HTTP ${res.status}`;
    }
  }
}

export const api = {
  async getMe(): Promise<{ user: User } | null> {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return null;
    return res.json();
  },

  async login(email: string, password?: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  async register(data: { name: string; email: string; phoneNumber: string; password: string }): Promise<{ success: boolean; user?: User; error?: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' });
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/users');
    if (!res.ok) return [];
    return res.json();
  },

  async updateUser(id: string, data: { name: string; email: string; role: User['role']; phoneNumber: string }): Promise<void> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await readErrorMessage(res));
  },

  async setUserPassword(id: string, password: string): Promise<void> {
    const res = await fetch(`/api/users/${id}/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!res.ok) throw new Error(await readErrorMessage(res));
  },

  async registerUser(userData: Omit<User, 'id' | 'joinDate'> & { password?: string }): Promise<User> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) throw new Error(await readErrorMessage(res));
    return res.json();
  },

  async deleteUser(id: string): Promise<void> {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await readErrorMessage(res));
  },

  async getContributions(): Promise<Contribution[]> {
    const res = await fetch('/api/contributions');
    if (!res.ok) return [];
    return res.json();
  },

  async recordContribution(data: Omit<Contribution, 'id'>): Promise<Contribution> {
    const res = await fetch('/api/contributions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await readErrorMessage(res));
    return res.json();
  },

  async getLoans(): Promise<Loan[]> {
    const res = await fetch('/api/loans');
    if (!res.ok) return [];
    return res.json();
  },

  async requestLoan(data: Omit<Loan, 'id' | 'status' | 'interestRate'>): Promise<Loan> {
    const res = await fetch('/api/loans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, status: 'Pending', interestRate: 10 })
    });
    if (!res.ok) throw new Error(await readErrorMessage(res));
    return res.json();
  },

  async updateLoanStatus(id: string, status: string): Promise<void> {
    const res = await fetch(`/api/loans/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error(await readErrorMessage(res));
  },

  async repayLoan(id: string, amount: number, penalty?: number): Promise<{ success: boolean; repaidAmount: number; status: string }> {
    const res = await fetch(`/api/loans/${id}/repay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, penalty: penalty || 0 })
    });
    if (!res.ok) throw new Error(await readErrorMessage(res));
    return res.json();
  },

  async getStatement(): Promise<StatementData | null> {
    const res = await fetch('/api/statement');
    if (!res.ok) return null;
    return res.json();
  },

  async getChartData(): Promise<ChartData[]> {
    const res = await fetch('/api/reports/chart');
    if (!res.ok) return [];
    return res.json();
  },

  async getMetrics(): Promise<GroupMetrics | null> {
    const res = await fetch('/api/reports/metrics');
    if (!res.ok) return null;
    return res.json();
  },

  async getActivity(): Promise<ActivityItem[]> {
    const res = await fetch('/api/reports/activity');
    if (!res.ok) return [];
    return res.json();
  },

  async getAuditLogs(limit = 50, offset = 0): Promise<{ logs: AuditLog[]; total: number }> {
    const res = await fetch(`/api/audit-logs?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error(await readErrorMessage(res));
    return res.json();
  },

  async getSettings(): Promise<Record<string, boolean>> {
    const res = await fetch('/api/settings');
    if (!res.ok) return {};
    return res.json();
  },

  async updateSettings(settings: Record<string, boolean>): Promise<void> {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error(await readErrorMessage(res));
  },
};

export interface GroupMetrics {
  repaymentRate: number;
  complianceRate: number;
  pendingLoans: number;
  totalMembers: number;
  totalContributions: number;
  totalDisbursed: number;
  totalRepaid: number;
  totalPenalties: number;
}

export interface ActivityItem {
  id: string;
  type: 'contribution' | 'penalty' | 'loan_disbursement' | 'loan_repayment';
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
  memberName: string;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  detailsJson: string | null;
  createdAt: string;
}
