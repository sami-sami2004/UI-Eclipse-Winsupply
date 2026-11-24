import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentCard } from './comment-card';

describe('CommentCard', () => {
  let component: CommentCard;
  let fixture: ComponentFixture<CommentCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentCard],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('comment', {
      commentId: 1,
      reviewId: 1,
      commentText: 'Great review!',
      datePosted: '2026-01-01T12:00:00.000Z',
    });
    fixture.componentRef.setInput('number', 1);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
