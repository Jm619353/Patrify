import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Paginated } from '../models/api.model';
import {
  Patrimony,
  PatrimonyMovementPayload,
  PatrimonyPayload,
  PatrimonyQrCode,
  PatrimonyQuery,
  PatrimonySummary,
  PublicPatrimonyVerification
} from '../models/patrimony.model';

@Injectable({ providedIn: 'root' })
export class PatrimonyService {
  constructor(private readonly api: ApiService) {}

  list(query: PatrimonyQuery): Observable<Paginated<Patrimony[]>> {
    return this.api.getWithMeta<Patrimony[]>('/patrimonies', query as Record<string, unknown>);
  }

  getById(id: string): Observable<Patrimony> {
    return this.api.get<Patrimony>(`/patrimonies/${id}`);
  }

  getQrCode(id: string): Observable<PatrimonyQrCode> {
    return this.api.get<PatrimonyQrCode>(`/patrimonies/${id}/qrcode`);
  }

  verifyBySerial(serial: string): Observable<PublicPatrimonyVerification> {
    return this.api.get<PublicPatrimonyVerification>(
      `/public/patrimonies/${encodeURIComponent(serial.trim())}`
    );
  }

  summary(): Observable<PatrimonySummary> {
    return this.api.get<PatrimonySummary>('/patrimonies/summary');
  }

  create(payload: PatrimonyPayload): Observable<Patrimony> {
    return this.api.post<Patrimony>('/patrimonies', payload);
  }

  update(id: string, payload: Partial<PatrimonyPayload>): Observable<Patrimony> {
    return this.api.patch<Patrimony>(`/patrimonies/${id}`, payload);
  }

  addMovement(id: string, payload: PatrimonyMovementPayload): Observable<Patrimony> {
    return this.api.post<Patrimony>(`/patrimonies/${id}/movements`, payload);
  }

  remove(id: string): Observable<void> {
    return this.api.delete(`/patrimonies/${id}`);
  }

  uploadImage(id: string, file: File): Observable<Patrimony> {
    return this.api.upload<Patrimony>(`/patrimonies/${id}/image`, file);
  }
}
