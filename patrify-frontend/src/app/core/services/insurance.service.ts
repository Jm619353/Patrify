import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateInsurancePayload,
  InsuranceItem,
  InsuranceSummary,
  UpdateInsurancePayload
} from '../models/insurance.model';

export interface InsuranceListResponse {
  data: InsuranceItem[];
  meta: InsuranceSummary;
}

@Injectable({ providedIn: 'root' })
export class InsuranceService {
  private readonly baseUrl = `${environment.apiUrl}/insurances`;

  constructor(private readonly http: HttpClient) {}

  list(filters?: {
    search?: string;
    status?: string;
    coverageType?: string;
    patrimonyId?: string;
  }): Observable<InsuranceListResponse> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.coverageType) params = params.set('coverageType', filters.coverageType);
    if (filters?.patrimonyId) params = params.set('patrimonyId', filters.patrimonyId);
    return this.http.get<InsuranceListResponse>(this.baseUrl, { params });
  }

  create(payload: CreateInsurancePayload): Observable<{ data: InsuranceItem }> {
    return this.http.post<{ data: InsuranceItem }>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateInsurancePayload): Observable<{ data: InsuranceItem }> {
    return this.http.patch<{ data: InsuranceItem }>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
