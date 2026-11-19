import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { CommentService } from '../../services/comment.service';
import { CommentCard } from '../comment-card/comment-card';

@Component({
  imports: [CommentCard],
  selector: 'app-comment-thread',
  styleUrl: './comment-thread.scss',
  templateUrl: './comment-thread.html',
})
export class CommentThread {
  private commentService = inject(CommentService);
  private route = inject(ActivatedRoute);

  private paramMap = toSignal(this.route.paramMap);
    reviewId = computed(() => Number(this.paramMap()?.get('reviewId')));
  
    comments = toSignal(
      toObservable(this.reviewId).pipe(
        switchMap(id => this.commentService.getComments(id))
      ),
      {initialValue: []}
    )

myComments = computed(() => this.commentService.localComments().filter(c => c.reviewId === this.reviewId()));


  newCommentText = signal('');

  onInput(event: Event) {
    this.newCommentText.set((event.target as HTMLInputElement).value);
  }

  addComment(): void {
    this.commentService.addComment(this.reviewId(), this.newCommentText());
    this.newCommentText.set('');
  }

}
