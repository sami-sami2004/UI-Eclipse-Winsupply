
# Component Plan

## 1. Component Hierarchy

Our book review application will have three main features: Dashboard, Reviews, and Comments.

```text
AppComponent
│
├── HeaderComponent
│
├── DashboardComponent
│   ├── GenreFilterComponent
│   ├── BookListComponent
│   │   └── BookCardComponent
│   └── RandomReviewsComponent
│       └── ReviewCardComponent
│
├── ReviewListComponent
│   ├── ReviewSortComponent
│   └── ReviewCardComponent
│
├── ReviewDetailsComponent
│
├── ReviewFormComponent
│
└── CommentThread
    ├── CommentCard
    └── CommentForm
```

## 2. Component Responsibilities

| Component | Responsibility |
|---|---|
| DashboardComponent | Displays books and random reviews. |
| GenreFilterComponent | Filters books by genre. |
| BookListComponent | Displays the filtered books. |
| BookCardComponent | Displays information about one book. |
| RandomReviewsComponent | Displays random reviews on the dashboard. |
| ReviewListComponent | Displays available reviews. |
| ReviewSortComponent | Sorts reviews by newest or oldest. |
| ReviewCardComponent | Displays a short review. |
| ReviewDetailsComponent | Displays full review and book information. |
| ReviewFormComponent | Creates a new review. |
| CommentThread | Displays comments for a review. |
| CommentCard | Displays one comment. |
| CommentForm | Allows users to add a comment. |
| HeaderComponent | Displays navigation links. |
| RatingComponent | Displays a book rating. |

## 3. Team Responsibilities

Our team has three members. Each member will work on one main feature.

| Team Member | Main Feature | Work |
|---|---|---|
| Prince Patel | Dashboard | Dashboard, genre filter, book list, and random reviews. |
| Tyler Gossett| Reviews | Review list, sorting, review details, and review form. |
| Sami Mohammad | Comments | Comment thread, comment card, and comment form. |

## 4. Routes

The following Angular routes will be used:

| Component | Route |
|---|---|
| DashboardComponent | `/dashboard` |
| ReviewListComponent | `/reviews` |
| ReviewFormComponent | `/reviews/create` |
| ReviewDetailsComponent | `/reviews/:id` |
| CommentThread | `/reviews/:reviewId/comments` |

Comments will have their own route and will be connected to a particular review using its ID.

## 5. Expected Data Models

These are the basic data models we expect to use in the frontend. Their properties can be adjusted to match the backend.

```typescript
interface Book {
  id: number;
  title: string;
  author: string;
  genre: Genre;
}

interface Genre {
  id: number;
  name: string;
}

interface Review {
  id: number;
  book: Book;
  reviewText: string;
  rating: number;
  isRecommended: boolean;
  datePosted: string;
}

interface Comment {
  id: number;
  reviewId: number;
  commentText: string;
  datePosted: string;
}
```

## 6. Folder Structure

```text
src/app/
├── shared/
│   └── components/
│       ├── header/
│       ├── book-card/
│       ├── review-card/
│       └── rating/
│
├── features/
│   ├── dashboard/
│   │   └── components/
│   ├── reviews/
│   │   └── components/
│   └── comments/
│       └── components/
│           ├── comment-thread/
│           ├── comment-card/
│           └── comment-form/
│
├── app.routes.ts
└── app.ts
```

## 7. Implementation Plan

1. Create the components using Angular CLI.
2. Add placeholder HTML to the components.
3. Configure the Angular routes.
4. Test the routes in the browser.
5. Continue developing each feature based on the assigned team responsibilities.
