import { Injectable, inject, signal } from '@angular/core';
import { BookComment } from '../models/book-comment';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private http = inject(HttpClient);

  private readonly mockUrl = 'https://jsonplaceholder.typicode.com/comments';

  private readonly _localComments = signal<BookComment[]>([]);
  readonly localComments = this._localComments.asReadonly();

  getComments(reviewId: number): Observable<BookComment[]> {
    return this.http
      .get<{ postId: number; id: number; body: string; }[]>(`${this.mockUrl}?postId=${reviewId}`)
      .pipe(
        map(list => 
          list.map(c => ({
          commentId: c.id,
          reviewId: c.postId,
          commentText: c.body,
          datePosted: new Date().toISOString()
        }))
        )
      );
  }

  addComment(reviewId: number, text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;
    this._localComments.update(list => [
      ...list,
      {
        commentId: Date.now(),
        reviewId,
        commentText: trimmed,
        datePosted: new Date().toISOString(),
      },
    ]);




}


}