export type LoanStatus = 'Em andamento' | 'Devolvido' | 'Cancelado';

export interface LoanItem {
  id: string;
  patrimonyId: string;
  patrimonyName: string;
  serialNumber: string;
  category: string;
  borrowerName: string;
  borrowerDocument?: string | null;
  department: string;
  purpose: string;
  loanDate: string;
  expectedReturnDate: string;
  returnedAt?: string | null;
  status: LoanStatus;
  conditionOut: string;
  conditionIn?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoanSummary {
  total: number;
  active: number;
  overdue: number;
  returned: number;
}

export interface CreateLoanPayload {
  patrimonyId: string;
  borrowerName: string;
  borrowerDocument?: string | null;
  department: string;
  purpose: string;
  loanDate: string;
  expectedReturnDate: string;
  conditionOut?: string;
  notes?: string | null;
}

export interface UpdateLoanPayload {
  status?: LoanStatus;
  expectedReturnDate?: string;
  conditionIn?: string | null;
  notes?: string | null;
}

export const LOAN_STATUSES: LoanStatus[] = ['Em andamento', 'Devolvido', 'Cancelado'];
