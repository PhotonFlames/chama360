export type Role = 'Member' | 'Treasurer' | 'Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  joinDate: string;
  phoneNumber: string;
}

export interface Contribution {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Late';
  penalty: number;
}

export interface Loan {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  purpose: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Repaid';
  requestDate: string;
  repaymentDate?: string;
  interestRate: number;
}

export interface FinancialSummary {
  totalContributions: number;
  totalLoansDisbursed: number;
  totalPenaltiesCollected: number;
  availableBalance: number;
}
