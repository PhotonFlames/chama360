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
  dueDate?: string;
  repaidAmount?: number;
}

export interface Transaction {
  id: string;
  memberId: string;
  type: 'contribution' | 'penalty' | 'loan_disbursement' | 'loan_repayment';
  amount: number;
  date: string;
  referenceType?: 'contribution' | 'loan';
  referenceId?: string;
  notes?: string;
  createdAt: string;
}

export interface StatementTotals {
  totalContributions: number;
  totalPenalties: number;
  totalLoanDisbursed: number;
  totalLoanRepaid: number;
}

export interface StatementData {
  memberId: string;
  totals: StatementTotals;
  transactions: Transaction[];
}

export interface ChartData {
  month: string;
  contributions: number;
  loans: number;
}

export interface FinancialSummary {
  totalContributions: number;
  totalLoansDisbursed: number;
  totalPenaltiesCollected: number;
  availableBalance: number;
}

