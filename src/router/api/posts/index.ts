import Router from '@koa/router';
import checkAuth from '@src/lib/middlewares/checkAuth';
import * as postCtrl from './posts.torm.ctrl';

const posts = new Router();

posts.get('/', postCtrl.getPosts);
posts.get('/all-slug', postCtrl.getAllPostSlug);
posts.get('/all-id', postCtrl.getAllPostId);
posts.get('/:slug', postCtrl.getPostBySlug);
posts.post('/new', checkAuth, postCtrl.saveNewPost);
posts.put('/:slug', checkAuth, postCtrl.updatePost);
posts.delete('/:slug', checkAuth, postCtrl.deletePostBySlug);

export default posts;
