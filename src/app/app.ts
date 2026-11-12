/**
 * Root shell component for Bookish.
 *
 * Displays the active page through Angular routing.
 */
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'Bookish';
}