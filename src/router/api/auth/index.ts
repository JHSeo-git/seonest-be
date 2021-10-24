import Router from '@koa/router';
import * as authCtrl from './auth.torm.ctrl';

const auth = new Router();

auth.get('/', (ctx) => {
  ctx.body = 'auth index';
});
auth.post('/google/login', authCtrl.loginWithGoogle);

export default auth;
