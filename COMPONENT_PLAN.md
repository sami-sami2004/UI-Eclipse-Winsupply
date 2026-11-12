# Homework 3 - Component Plan

## Team Task Distribution

| Team Member              | Components           | Responsibilities                |
|--------------------------|----------------------|---------------------------------|
| Member A - Prince Petal  | DashboardComponent   | Dashboard and statistics        |
| Member B - Tylar Gossett | ReviewComponent      | Review management and display   |
| Member C - Sami Mohammad | CommentComponent     | Comment management and display  |

## Component Hierarchy

```
src/
└── app/
    ├── app.routes.ts
    ├── dashboard/
    │   └── DashboardComponent (Main Page)
    │       └── MetricCardComponent (Child Component - Planned)
    ├── review-list/
    │   └── ReviewListComponent (Main Page)
    │       └── ReviewCardComponent (Child Component - Planned)
    ├── review-detail/
    │   └── ReviewDetailComponent (Main Page - Planned)
    └── comments/
        └── CommentComponent (Main Page - Planned)
            └── CommentCardComponent (Child Component - Planned)
```

## Review Component Tree 

```
src/
└── app/
    ├── app.routes.ts
    ├── review-list/
    │   ├── review-list.component.html
    │   ├── review-list.component.scss
    │   └── review-list.component.ts
    ├── review-detail/
    │   └── (Planned)
    ├── shared/
    │   └── components/
    │       └── review-card/
    │           ├── review-card.ts (Planned)
    │           ├── review-card.html (Planned)
    │           └── review-card.scss (Planned)
    └── services/
        ├── api.service.ts
        ├── lookup.service.ts
        └── review-list.service.ts
```

>NOTE! I already created this in homework 2 and just used the `tree` cmd to get whats above

 ## Data Interfaces - Review

| Component             | Input                             | Output                       |
|-----------------------|-----------------------------------|------------------------------|
| ReviewListComponent   | `Review[]` from ReviewListService | Displays review list         |
| ReviewDetailComponent | Review ID and `Review` data       | Displays review details      |
| ReviewCardComponent   | `Review` object                   | Emits review selection event |

## Application Routes

```
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(
        m => m.DashboardComponent
      )
  },

  {
    path: 'review',
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        loadComponent: () =>
            import('./review-list/review-list.component').then(
            m => m.ReviewListComponent
        )
    }
    ]
},

  // Default redirect
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  // Wildcard route - must be last
  {
    path: '**',
    redirectTo: '/dashboard'
  }
]
```

