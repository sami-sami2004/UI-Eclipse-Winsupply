import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface Genre{
    genreId: number,
    genreName: string
}

@Injectable({
  providedIn: 'root'
})
export class GenresService {
  private apiService = inject(ApiService);

  getGenres(): Observable<Genre[]> {
    return this.apiService.get<Genre[]>('genres').pipe(
      map(response => response.data)
    );
  }
}