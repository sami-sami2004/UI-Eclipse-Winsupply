import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BookComment } from '../../models/book-comment';

@Component({
  imports: [DatePipe],
  selector: 'app-comment-card',
  styleUrl: './comment-card.scss',
  templateUrl: './comment-card.html',
})
export class CommentCard {
  comment = input.required<BookComment>();
}