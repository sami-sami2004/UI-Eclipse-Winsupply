import { Component } from '@angular/core';
import {GenreFilter} from '../genre-filter/genre-filter';

@Component({
  imports: [GenreFilter],
  selector: 'app-book-list',
  styleUrl: './book-list.scss',
  templateUrl: './book-list.html',
})
export class BookList {}
