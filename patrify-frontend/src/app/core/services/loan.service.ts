import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateLoanPayload,
  LoanItem,
  LoanSummary,
  UpdateLoanPayload
} from '../models/loan.model';

export interface LoanListResponse {
  data: LoanItem[];
  meta: LoanSummary;
}

@Injectable({ providedIn: 'root' })
export class LoanService {
  private readonly baseUrl = `${environment.apiUrl}/loans`;

  constructor(private readonly http: HttpClient) {}

  list(filters?: {
    search?: string;
    status?: string;
    patrimonyId?: string;
  }): Observable<LoanListResponse> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.patrimonyId) params = params.set('patrimonyId', filters.patrimonyId);
    return this.http.get<LoanListResponse>(this.baseUrl, { params });
  }

  create(payload: CreateLoanPayload): Observable<{ data: LoanItem }> {
    return this.http.post<{ data: LoanItem }>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateLoanPayload): Observable<{ data: LoanItem }> {
    return this.http.patch<{ data: LoanItem }>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
