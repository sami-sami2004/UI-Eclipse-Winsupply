import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewDetailCard } from './review-detail-card';

describe('ReviewDetailCard', () => {
  let component: ReviewDetailCard;
  let fixture: ComponentFixture<ReviewDetailCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewDetailCard],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewDetailCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
