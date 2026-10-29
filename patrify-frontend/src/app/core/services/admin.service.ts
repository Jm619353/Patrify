import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Patrimony, PatrimonyCategory, PatrimonyCondition, PatrimonyStatus } from '../models/patrimony.model';
import { AuthResult, SubscriptionPlan, User } from '../models/user.model';

export interface AdminUserMetrics {
  patrimonyCount: number;
  totalUnits: number;
  totalValue: number;
  activeCount: number;
}

export interface AdminUserItem extends User {
  role: 'admin' | 'company';
  plan: SubscriptionPlan;
  active: boolean;
  metrics: AdminUserMetrics;
}

export interface AdminSummary {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalPatrimonies: number;
  totalUnits: number;
  totalAssetValue: number;
  totalMaintenances: number;
  totalLoans: number;
  totalInsurances: number;
}

export interface AdminOverviewResponse {
  data: {
    summary: AdminSummary;
    users: AdminUserItem[];
  };
}

export interface AdminPatrimonyOwner {
  id: string;
  name: string;
  legalName: string | null;
  cnpj: string;
  email: string;
}

export interface AdminPatrimonyItem extends Patrimony {
  owner: AdminPatrimonyOwner | null;
}

export interface CreateAdminUserPayload {
  name: string;
  legalName?: string | null;
  cnpj: string;
  email: string;
  password: string;
  phone1?: string | null;
  phone2?: string | null;
  address?: string | null;
  economicActivity?: string | null;
  branchType?: string | null;
  companySize?: string | null;
  role?: 'admin' | 'company';
  plan?: SubscriptionPlan;
  active?: boolean;
}

export interface UpdateAdminUserPayload {
  name?: string;
  legalName?: string | null;
  cnpj?: string;
  email?: string;
  password?: string;
  phone1?: string | null;
  phone2?: string | null;
  address?: string | null;
  economicActivity?: string | null;
  branchType?: string | null;
  companySize?: string | null;
  role?: 'admin' | 'company';
  plan?: SubscriptionPlan;
  active?: boolean;
}

export interface CreateAdminPatrimonyPayload {
  userId: string;
  name: string;
  value: number;
  quantity: number;
  purchaseDate: string;
  location: string;
  status: PatrimonyStatus;
  condition: PatrimonyCondition;
  category: PatrimonyCategory;
  responsible?: string | null;
  invoiceNumber?: string | null;
  warrantyUntil?: string | null;
  notes?: string | null;
}

export type UpdateAdminPatrimonyPayload = Partial<CreateAdminPatrimonyPayload>;

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  constructor(private readonly http: HttpClient) {}

  getOverview(search?: string): Observable<AdminOverviewResponse> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<AdminOverviewResponse>(`${this.baseUrl}/overview`, { params });
  }

  createUser(payload: CreateAdminUserPayload): Observable<{ data: AdminUserItem }> {
    return this.http.post<{ data: AdminUserItem }>(`${this.baseUrl}/users`, payload);
  }

  updateUser(id: string, payload: UpdateAdminUserPayload): Observable<{ data: User }> {
    return this.http.patch<{ data: User }>(`${this.baseUrl}/users/${id}`, payload);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${id}`);
  }

  impersonateUser(id: string): Observable<{ data: AuthResult }> {
    return this.http.post<{ data: AuthResult }>(`${this.baseUrl}/users/${id}/impersonate`, {});
  }

  listAllPatrimonies(filters?: {
    search?: string;
    userId?: string;
    category?: string;
    status?: string;
  }): Observable<{ data: AdminPatrimonyItem[] }> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.userId) params = params.set('userId', filters.userId);
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.status) params = params.set('status', filters.status);
    return this.http.get<{ data: AdminPatrimonyItem[] }>(`${this.baseUrl}/patrimonies`, { params });
  }

  createPatrimony(payload: CreateAdminPatrimonyPayload): Observable<{ data: AdminPatrimonyItem }> {
    return this.http.post<{ data: AdminPatrimonyItem }>(`${this.baseUrl}/patrimonies`, payload);
  }

  updatePatrimony(
    id: string,
    payload: UpdateAdminPatrimonyPayload
  ): Observable<{ data: AdminPatrimonyItem }> {
    return this.http.patch<{ data: AdminPatrimonyItem }>(
      `${this.baseUrl}/patrimonies/${id}`,
      payload
    );
  }

  deletePatrimony(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/patrimonies/${id}`);
  }
}
