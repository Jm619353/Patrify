import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';

const TOKEN_KEY = 'patrify.token';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return next.handle(request);

    return next.handle(
      request.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      })
    );
  }
}
