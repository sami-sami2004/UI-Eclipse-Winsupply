
/**
 * Reference data for Bookish dropdowns and filters.
 *
 * Loads available book genres from the backend.
 */
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Genre data returned by the Bookish backend.
 */
export interface Genre {
  genreId: number;
  genreName: string;
}

@Injectable({
  providedIn: 'root'
})
export class LookupService {
  private readonly apiService = inject(ApiService);

  /**
   * GET /genre
   *
   * Returns available genres for book forms and filters.
   */
  getGenres(): Observable<Genre[]> {
    return this.apiService.get<Genre[]>('genre').pipe(
      map(response => response.data)
    );
  }
}
