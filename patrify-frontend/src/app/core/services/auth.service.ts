import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import {
  AuthResult,
  ChangePasswordPayload,
  LoginPayload,
  RegisterPayload,
  SubscriptionPlan,
  User
} from '../models/user.model';

const TOKEN_KEY = 'patrify.token';

const PLAN_LEVELS: Record<SubscriptionPlan, number> = {
  basic: 1,
  pro: 2,
  enterprise: 3
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSubject = new BehaviorSubject<User | null>(null);
  readonly user$ = this.userSubject.asObservable();

  constructor(
    private readonly api: ApiService,
    private readonly router: Router
  ) {}

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get sessionExpiresAt(): Date | null {
    const token = this.token;
    if (!token) return null;

    try {
      const payload = this.decodeToken(token);
      return payload.exp ? new Date(payload.exp * 1000) : null;
    } catch {
      return null;
    }
  }

  login(payload: LoginPayload): Observable<User> {
    return this.api.post<AuthResult>('/auth/login', payload).pipe(
      tap(({ token, user }) => this.storeSession(token, user)),
      map(({ user }) => user)
    );
  }

  register(payload: RegisterPayload): Observable<User> {
    return this.api.post<AuthResult>('/auth/register', payload).pipe(
      tap(({ token, user }) => this.storeSession(token, user)),
      map(({ user }) => user)
    );
  }

  loadMe(): Observable<User> {
    return this.api.get<User>('/auth/me').pipe(tap((user) => this.userSubject.next(user)));
  }

  updateUser(user: User): void {
    this.userSubject.next(user);
  }

  adoptSession(token: string, user: User): void {
    this.storeSession(token, user);
  }

  hasPlanAccess(minPlan?: SubscriptionPlan): boolean {
    if (!minPlan) return true;
    const user = this.currentUser;
    if (!user) return true;
    if (user.role === 'admin') return true;
    const currentPlan = user.plan || 'basic';
    return (PLAN_LEVELS[currentPlan] || 1) >= (PLAN_LEVELS[minPlan] || 1);
  }

  forgotPassword(payload: { cnpj: string; email: string }): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/auth/forgot-password', payload);
  }

  resetPassword(payload: { token: string; password: string }): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/auth/reset-password', payload);
  }

  changePassword(payload: ChangePasswordPayload): Observable<{ message: string }> {
    return this.api.patch<{ message: string }>('/auth/change-password', payload);
  }

  hasValidToken(): boolean {
    const token = this.token;
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      if (!payload.sub || !/^[a-fA-F0-9]{24}$/.test(String(payload.sub))) {
        localStorage.removeItem(TOKEN_KEY);
        return false;
      }
      if (!payload.exp) return true;
      return payload.exp * 1000 > Date.now() + 5_000;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      return false;
    }
  }

  logout(redirect = true): void {
    localStorage.removeItem(TOKEN_KEY);
    this.userSubject.next(null);
    if (redirect) {
      this.router.navigate(['/login']);
    }
  }

  private storeSession(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.userSubject.next(user);
  }

  private decodeToken(token: string): { exp?: number; sub?: string } {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized));
  }
}
