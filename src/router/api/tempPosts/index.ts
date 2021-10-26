import Router from '@koa/router';
import checkAuth from '@src/lib/middlewares/checkAuth';
import * as tempPostsCtrl from './tempPosts.torm.ctrl';

const tempPosts = new Router();

tempPosts.get('/', tempPostsCtrl.getTempPosts);
tempPosts.get('/:slug', tempPostsCtrl.getLastTempPost);
tempPosts.post('/new', checkAuth, tempPostsCtrl.saveNewTempPost);
tempPosts.put('/save/:slug', checkAuth, tempPostsCtrl.saveTempPost);

export default tempPosts;
