import { Component } from '@angular/core';
import { GenreFilter } from './components/genre-filter/genre-filter';
import { BookList } from './components/book-list/book-list';

@Component({
  imports: [GenreFilter, BookList],
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
