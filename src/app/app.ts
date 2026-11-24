import { Component, signal } from '@angular/core';
import { RouterOutlet,RouterLink } from '@angular/router';
// import { Dashboard } from './features/dashboard/dashboard';

@Component({
  imports: [RouterOutlet,RouterLink],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('bookish-ui');
}
