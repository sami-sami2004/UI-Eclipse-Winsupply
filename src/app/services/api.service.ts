import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../envirnments/environment';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  get<T>(endpoint: string): Observable<ApiResponse<T>> {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`).pipe(
      map(data => ({
        success: data != null,
        data,
        timestamp: new Date()
      }))
    );
  }
}