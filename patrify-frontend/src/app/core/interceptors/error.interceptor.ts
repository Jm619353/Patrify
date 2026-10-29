import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, Observable, throwError } from 'rxjs';
import { ApiError, ApiErrorBody } from '../models/api.model';

const TOKEN_KEY = 'patrify.token';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private readonly router: Router,
    private readonly toastr: ToastrService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const body = error.error as ApiErrorBody | null;
        const message =
          body?.error?.message ||
          this.fallbackMessage(error.status) ||
          'Não foi possível concluir a operação.';

        const isAuthRequest =
          request.url.includes('/auth/login') ||
          request.url.includes('/auth/register') ||
          request.url.includes('/auth/forgot-password') ||
          request.url.includes('/auth/reset-password');

        if (error.status === 401 && !isAuthRequest) {
          localStorage.removeItem(TOKEN_KEY);
          this.toastr.warning('Sua sessão expirou. Faça login novamente.', 'Sessão encerrada');
          this.router.navigate(['/login']);
        } else {
          this.toastr.error(message, 'Não foi possível concluir');
        }

        return throwError(
          () =>
            new ApiError(
              message,
              error.status,
              body?.error?.code || 'UNKNOWN_ERROR',
              body?.error?.details || []
            )
        );
      })
    );
  }

  private fallbackMessage(status: number): string | null {
    switch (status) {
      case 0:
        return 'Não foi possível conectar ao servidor. Verifique sua internet.';
      case 403:
        return 'Você não tem permissão para executar esta ação.';
      case 404:
        return 'O recurso solicitado não foi encontrado.';
      case 429:
        return 'Muitas requisições. Aguarde alguns instantes.';
      case 500:
      case 502:
      case 503:
        return 'O serviço está indisponível no momento. Tente novamente mais tarde.';
      default:
        return null;
    }
  }
}
