import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEnvelope, Paginated, PaginationMeta } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl.replace(/\/$/, '');

  constructor(private readonly http: HttpClient) {}

  get<T>(path: string, params?: Record<string, unknown>): Observable<T> {
    return this.http
      .get<ApiEnvelope<T>>(this.url(path), { params: this.toParams(params) })
      .pipe(map((response) => response.data));
  }

  getWithMeta<T>(path: string, params?: Record<string, unknown>): Observable<Paginated<T>> {
    return this.http
      .get<ApiEnvelope<T>>(this.url(path), { params: this.toParams(params) })
      .pipe(
        map((response) => ({
          data: response.data,
          meta: response.meta as PaginationMeta
        }))
      );
  }

  post<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http
      .post<ApiEnvelope<T>>(this.url(path), body)
      .pipe(map((response) => response.data));
  }

  patch<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http
      .patch<ApiEnvelope<T>>(this.url(path), body)
      .pipe(map((response) => response.data));
  }

  put<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http
      .put<ApiEnvelope<T>>(this.url(path), body)
      .pipe(map((response) => response.data));
  }

  delete(path: string): Observable<void> {
    return this.http.delete<void>(this.url(path));
  }

  upload<T>(path: string, file: File, fieldName = 'image'): Observable<T> {
    const formData = new FormData();
    formData.append(fieldName, file);
    return this.http
      .post<ApiEnvelope<T>>(this.url(path), formData)
      .pipe(map((response) => response.data));
  }

  private url(path: string): string {
    return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private toParams(params?: Record<string, unknown>): HttpParams {
    let httpParams = new HttpParams();

    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      httpParams = httpParams.set(key, String(value));
    });

    return httpParams;
  }
}
