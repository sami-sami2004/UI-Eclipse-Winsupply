import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ReviewList } from './review-list/review-list';

@Component({
  imports: [RouterOutlet, ReviewList],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('bookish-ui');
}
