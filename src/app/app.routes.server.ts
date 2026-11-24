import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'reviews/:reviewId/comments',
    renderMode: RenderMode.Server
  },

  { path: '**', renderMode: RenderMode.Prerender}
];
