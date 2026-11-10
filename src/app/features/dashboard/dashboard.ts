import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  books = [
    { id: 1, name: 'The Hobbit' },
    { id: 2, name: 'Atomic Habits' },
    { id: 3, name: 'The Alchemist' },
  ];
  // books = [];
}
