/**
 * Low-level HTTP gateway to the Spring Boot API (Bookish).
 *
 * Domain services call ApiService instead of HttpClient so URL building and
 * response wrapping stay consistent. Only GET and POST: that is the backend contract.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/** Normalized wrapper around a successful HTTP response body. */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  timestamp: Date;
}

/** Query-string values accepted by GET helpers. */
export type QueryParams = Record<string, string | number | boolean | Date | null | undefined>;

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  get<T>(endpoint: string, params?: QueryParams): Observable<ApiResponse<T>> {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`, {
      params: this.toHttpParams(params)
    }).pipe(
      map(data => ({
        success: data != null,
        data,
        timestamp: new Date()
      }))
    );
  }

  getPaginated<T>(endpoint: string, params?: QueryParams): Observable<PaginatedResponse<T>> {
    return this.http.get<PaginatedResponse<T>>(`${this.baseUrl}/${endpoint}`, {
      params: this.toHttpParams(params)
    });
  }

  post<T>(endpoint: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body).pipe(
      map(response => ({
        success: true,
        data: response,
        timestamp: new Date()
      }))
    );
  }

  private toHttpParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();
    if (!params) {
      return httpParams;
    }

    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) {
        continue;
      }
      if (value instanceof Date) {
        httpParams = httpParams.set(key, value.toISOString());
      } else {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return httpParams;
  }
}
