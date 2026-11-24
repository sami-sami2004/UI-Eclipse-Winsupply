import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { CommentService } from '../../services/comment.service';
import { CommentCard } from '../comment-card/comment-card';
import { catchError, of, switchMap } from 'rxjs';
import { BookComment } from '../../models/book-comment';

@Component({
  imports: [CommentCard],
  selector: 'app-comment-thread',
  styleUrl: './comment-thread.scss',
  templateUrl: './comment-thread.html',
})
export class CommentThread {
  private readonly commentService = inject(CommentService);
  private readonly route = inject(ActivatedRoute);

  private readonly paramMap = toSignal(this.route.paramMap);
    readonly reviewId = computed(() => Number(this.paramMap()?.get('reviewId')));
    readonly isValidReviewId = computed(() => Number.isInteger(this.reviewId()) && this.reviewId() > 0);

    readonly comments= toSignal(
      toObservable(this.reviewId).pipe(
        switchMap(id => 
          Number.isInteger(id) && id > 0 
          ? this.commentService.getComments(id).pipe(catchError(() => of <BookComment[]>([])))
          : of<BookComment[]>([])
        )
        ),
        { initialValue: [] as BookComment[] }
    );

    readonly allComments = computed(() => [
      ...this.comments(),
      ...this.commentService.localComments().filter(c => c.reviewId === this.reviewId()),
    ]);

  newCommentText = signal('');

  onInput(event: Event) {
    this.newCommentText.set((event.target as HTMLInputElement).value);
  }

  addComment(): void {
    if (!this.isValidReviewId()) return;
    this.commentService.addComment(this.reviewId(), this.newCommentText());
    this.newCommentText.set('');
  }

}
