export type SubscriptionPlan = 'basic' | 'pro' | 'enterprise';

export interface User {
  id: string;
  name: string;
  email: string;
  cnpj: string;
  legalName: string | null;
  phone1: string | null;
  phone2: string | null;
  address: string | null;
  economicActivity: string | null;
  branchType: string | null;
  companySize: string | null;
  role?: 'admin' | 'company';
  plan?: SubscriptionPlan;
  active?: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface AuthResult {
  user: User;
  token: string;
}

export interface LoginPayload {
  cnpj: string;
  password: string;
}

export interface RegisterPayload {
  cnpj: string;
  email: string;
  password: string;
  name?: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  phone1?: string;
  phone2?: string;
  branchType?: string;
  companySize?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
