import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { UpdateProfilePayload, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private readonly api: ApiService) {}

  getProfile(): Observable<User> {
    return this.api.get<User>('/users/me');
  }

  updateProfile(payload: UpdateProfilePayload): Observable<User> {
    return this.api.patch<User>('/users/me', payload);
  }
}
