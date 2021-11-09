import Router from '@koa/router';
import auth from './auth';
import categories from './categories';
import me from './me';
import posts from './posts';
import tempPosts from './tempPosts';
import upload from './upload';

const api = new Router();

api.get('/', (ctx) => {
  ctx.body = 'api index';
});
api.use('/posts', posts.routes());
api.use('/temps', tempPosts.routes());
api.use('/auth', auth.routes());
api.use('/me', me.routes());
api.use('/upload', upload.routes());
api.use('/categories', categories.routes());

export default api;
