import Router from '@koa/router';
import * as meCtrl from './me.torm.ctrl';

const me = new Router();

me.get('/', meCtrl.getMe);

export default me;
