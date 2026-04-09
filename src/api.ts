import { User, Contribution, Loan } from './types';

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

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' });
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/users');
    if (!res.ok) return [];
    return res.json();
  },

  async registerUser(userData: Omit<User, 'id' | 'joinDate'>): Promise<User> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) throw new Error('Failed to register user');
    return res.json();
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
    if (!res.ok) throw new Error('Failed to record contribution');
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
    if (!res.ok) throw new Error('Failed to request loan');
    return res.json();
  },

  async updateLoanStatus(id: string, status: string): Promise<void> {
    const res = await fetch(`/api/loans/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update loan status');
  }
};
