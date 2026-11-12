# Homework 3 - Component Plan

## Team Task Distribution

| Team Member              | Assigned Components  | Responsibilities                |
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

