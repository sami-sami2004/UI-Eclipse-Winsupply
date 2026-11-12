import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentForm } from './comment-form';

describe('CommentForm', () => {
  let component: CommentForm;
  let fixture: ComponentFixture<CommentForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentForm],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
