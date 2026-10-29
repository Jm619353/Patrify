import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DiscardPoint, DiscardSearchPayload } from '../models/discard.model';

@Injectable({ providedIn: 'root' })
export class DiscardService {
  constructor(private readonly api: ApiService) {}

  search(payload: DiscardSearchPayload): Observable<DiscardPoint[]> {
    return this.api.post<DiscardPoint[]>('/discard-points/search', payload);
  }
}
