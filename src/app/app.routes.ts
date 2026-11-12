import { Routes } from '@angular/router';
import { CommentThread } from './features/comments/components/comment-thread/comment-thread'


export const routes: Routes = [
    {path: 'reviews/:reviewId/comments', component: CommentThread}
];
