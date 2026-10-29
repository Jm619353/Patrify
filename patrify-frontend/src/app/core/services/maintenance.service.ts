import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MaintenanceOrder,
  MaintenancePayload,
  MaintenanceQuery,
  MaintenanceSummary
} from '../models/maintenance.model';
import { ApiService } from './api.service';

export interface MaintenanceListResponse {
  data: MaintenanceOrder[];
  meta: MaintenanceSummary;
}

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private readonly baseUrl = environment.apiUrl.replace(/\/$/, '');

  constructor(
    private readonly api: ApiService,
    private readonly http: HttpClient
  ) {}

  list(query: MaintenanceQuery = {}): Observable<MaintenanceListResponse> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<MaintenanceListResponse>(`${this.baseUrl}/maintenances`, { params });
  }

  create(payload: MaintenancePayload): Observable<MaintenanceOrder> {
    return this.api.post<MaintenanceOrder>('/maintenances', payload);
  }

  update(id: string, payload: Partial<MaintenancePayload>): Observable<MaintenanceOrder> {
    return this.api.patch<MaintenanceOrder>(`/maintenances/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.api.delete(`/maintenances/${id}`);
  }
}
