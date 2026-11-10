import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-review-list',
  styleUrl: './review-list.scss',
  templateUrl: './review-list.html',
})
export class ReviewList {
  reviews = [
    {id: 1, name: 'Sami', book: 'Dune', rating: 5, comment: 'The world-building pulled me in right away!'},
    { id: 2, name: 'David', book: 'Dune', rating: 4, comment: 'Slow start, but the second half is worth it.' },
    { id: 3, name: 'Marcus', book: 'The Hobbit', rating: 5, comment: 'A cozy adventure I could reread every year.' },
    { id: 4, name: 'Elena', book: 'Frankenstein', rating: 3, comment: 'Great ideas, though the pacing dragged for me.' },
    { id: 5, name: 'Jordan', book: 'Beloved', rating: 4, comment: 'Heavy and beautifully written.' }
  ]
}
