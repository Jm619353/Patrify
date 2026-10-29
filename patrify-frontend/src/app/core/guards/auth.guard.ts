import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  canActivate(): Observable<boolean> | boolean {
    if (!this.auth.hasValidToken()) {
      this.auth.logout(false);
      this.router.navigate(['/login']);
      return false;
    }

    if (this.auth.currentUser) return true;

    return this.auth.loadMe().pipe(
      map(() => true),
      catchError(() => {
        this.auth.logout(false);
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
