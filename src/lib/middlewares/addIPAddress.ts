import { Middleware } from 'koa';

const addIPAddress: Middleware = (ctx, next) => {
  const ipAddr = ctx.request.ip;

  ctx.ipAddr = ipAddr ?? null;

  return next();
};

export default addIPAddress;

declare module 'koa' {
  interface BaseContext {
    ipAddr: null | string;
  }
}
