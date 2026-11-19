import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface Book{
    bookId: number,
    title: string,
    genreId: number,
    pageCount: number
}

@Injectable({
  providedIn: 'root'
})
export class BooksService {
  private apiService = inject(ApiService);

  getBooks(): Observable<Book[]> {
    return this.apiService.get<Book[]>('book').pipe(
      map(response => response.data)
    );
  }
}