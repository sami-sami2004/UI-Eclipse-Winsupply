import { Injectable, signal } from '@angular/core';
import { BookComment } from '../models/book-comment';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly _comments = signal<BookComment[]>([
    {
      id: 1,
      reviewId: 1,
      author: 'Sami',
      text: 'This is a great book!',
      createdAt: '2023-01-01T00:00:00Z'
    },

    {
        id: 2,
        reviewId: 2,
        author: 'Priya',
        text: 'I really enjoyed this book!',
        createdAt: '2023-01-02T00:00:00Z'
    },

    {
        id: 3,
        reviewId: 3,
        author: 'Jacob',
        text: 'A must-read for everyone!',
        createdAt: '2023-01-03T00:00:00Z'
    }

  ]);
  
  readonly comments = this._comments.asReadonly();

  addComment(reviewId: number, text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;
    this._comments.update(list => [
        ...list,
        {id: Date.now(), reviewId, author: 'You', text: trimmed, createdAt: new Date().toISOString()},
    ]);
  }
}
