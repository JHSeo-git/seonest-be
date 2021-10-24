import { Middleware } from 'koa';

let alive = true;

export function appClose() {
  alive = false;
}

const healthCheck: Middleware = (ctx, next) => {
  if (!alive) {
    ctx.res.end();
  }
  return next();
};

export default healthCheck;
