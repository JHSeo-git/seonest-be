import Router from '@koa/router';
import api from './api';

const router = new Router();

router.get('/', (ctx) => {
  ctx.body = 'index';
});
router.use('/api', api.routes());

export default router;
